import proj4 from 'proj4'
import Dispatcher from '../message/dispatcher'
import { MercatorCoordinate } from '../math/mercatorCoordinate'
import { GridContext, GridCheckingInfo, GridSaveInfo, MultiGridRenderInfo, MultiGridBaseInfo, StructuredGridRenderVertices, GridKeyHashTable } from './types'

proj4.defs('EPSG:2326',"+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.243649,-1.158827,-1.094246 +units=m +no_defs")

const DELETED_FLAG = 1
const UNDELETED_FLAG = 0

interface GridLevelInfo {
    width: number
    height: number
}

export interface GridLayerSerializedInfo {
    CRS: string
    levelInfos: GridLevelInfo[]
    extent: [number, number, number, number]
    subdivideRules: [number, number][]
    grids: {
        type: number
        index: number
        level: number
        height: number
        globalId: number
        edges: number[][]
    }[]
    edges: {
        type: number
        key: string
        index: number
        height: number
        adjGrids: number[]
    }[]
}

export interface GridRecordOptions {
    maxGridNum?: number
    workerCount?: number
    dispatcher?: Dispatcher
}

export default class GridCore {
    // Grid metadata
    maxGridNum: number
    levelInfos: GridLevelInfo[]
    renderRelativeCenter: Float32Array

    // Worker dispatcher
    private _dispatcher: Dispatcher

    // Grid cache
    private _nextStorageId = 0
    private _gridLevelCache: Uint8Array
    private _gridDeletedCache: Uint8Array
    private _gridGlobalIdCache: Uint32Array
    private _gridKey_storageId_dict: GridKeyHashTable

    constructor(public context: GridContext, options: GridRecordOptions = {}) {
        // Init metadata
        this.maxGridNum = options.maxGridNum ?? 4096 * 4096
        this.levelInfos = new Array<GridLevelInfo>(this.context.rules.length)
        this.context.rules.forEach((_, level, rules) => {
            let width: number, height: number
            if (level == 0) {
                width = 1
                height = 1
            } else {
                width = this.levelInfos[level - 1].width * rules[level - 1][0]
                height = this.levelInfos[level - 1].height * rules[level - 1][1]
            }
            this.levelInfos[level] = { width, height }
        })

        // Calculate bounding box center in mercator coordinates for high-precision rendering
        const bBoxCenter: [number, number] = proj4(this.context.srcCS, this.context.targetCS, this.context.bBox.center)
        const mercatorCenter = MercatorCoordinate.fromLonLat(bBoxCenter)
        const centerX = encodeFloatToDouble(mercatorCenter[0])
        const centerY = encodeFloatToDouble(mercatorCenter[1])
        this.renderRelativeCenter = new Float32Array([...centerX, ...centerY])

        // Init dispatcher
        this._dispatcher = new Dispatcher(this, options.workerCount)

        // Init grid cache
        this._gridLevelCache = new Uint8Array(this.maxGridNum)
        this._gridGlobalIdCache = new Uint32Array(this.maxGridNum)
        this._gridDeletedCache = new Uint8Array(this.maxGridNum).fill(UNDELETED_FLAG)
        this._gridKey_storageId_dict = new GridKeyHashTable(this.maxGridNum)
    }

    get bBox() {
        return this.context.bBox
    }

    get srcCRS() {
        return this.context.srcCS
    }

    get gridNum(): number {
        return this._nextStorageId
    }

    get maxLevel() {
        return this.levelInfos.length - 1
    }

    init(callback?: Function): void {
        // Clear next storage ID
        this._nextStorageId = 0

        // Brodcast actors to init grid manager and initialize grid cache
        this._dispatcher.broadcast('setGridManager', this.context, () => {
            // Get activate grid information
            this._dispatcher.actor.send('getGridInfo', null, (_, baseInfo: MultiGridBaseInfo) => {
                this.updateMultiGridRenderInfo(baseInfo, callback)
            })
        })
    }

    updateMultiGridRenderInfo(baseInfo: MultiGridBaseInfo, callback?: Function): void {
        // Initialize grid cache
        const gridNum = baseInfo.levels.length
        for (let i = 0; i < gridNum; i++) {
            const storageId = this._nextStorageId + i
            this._gridKey_storageId_dict.update(storageId, baseInfo.levels[i], baseInfo.globalIds[i])
        }
        
        // Get render vertices of all grids
        this._gridLevelCache.set(baseInfo.levels, this._nextStorageId)
        this._gridDeletedCache.set(baseInfo.deleted!, this._nextStorageId)
        this._gridGlobalIdCache.set(baseInfo.globalIds, this._nextStorageId)

        let completedActorNum = 0
        const vertices = new Float32Array(gridNum * 8)
        const verticesLow = new Float32Array(gridNum * 8)
        const actorNum = gridNum < this._dispatcher.actorNum ? 1 : this._dispatcher.actorNum  // avoid abusing too many actors when gridNum is small
        const batchSize = Math.ceil(gridNum / actorNum)
        for (let actorIndex = 0; actorIndex < actorNum; actorIndex++) {
            const fromStorageId = actorIndex * batchSize
            const toStorageId = Math.min(gridNum, (actorIndex + 1) * batchSize)

            // Send grid info batch to actor and get render vertices
            const info: MultiGridBaseInfo = {
                levels: baseInfo.levels.slice(fromStorageId, toStorageId),
                globalIds: baseInfo.globalIds.slice(fromStorageId, toStorageId),
            }
            this._dispatcher.actor.send('getMultiGridRenderVertices', info, (_, renderInfo: StructuredGridRenderVertices) => {
                completedActorNum += 1
                vertices.set(renderInfo.tl, gridNum * 2 * 0 + fromStorageId * 2)
                vertices.set(renderInfo.tr, gridNum * 2 * 1 + fromStorageId * 2)
                vertices.set(renderInfo.bl, gridNum * 2 * 2 + fromStorageId * 2)
                vertices.set(renderInfo.br, gridNum * 2 * 3 + fromStorageId * 2)

                verticesLow.set(renderInfo.tlLow, gridNum * 2 * 0 + fromStorageId * 2)
                verticesLow.set(renderInfo.trLow, gridNum * 2 * 1 + fromStorageId * 2)
                verticesLow.set(renderInfo.blLow, gridNum * 2 * 2 + fromStorageId * 2)
                verticesLow.set(renderInfo.brLow, gridNum * 2 * 3 + fromStorageId * 2)

                // If all actors have completed, make callback
                if (completedActorNum === actorNum) {
                    callback && callback([this._nextStorageId, baseInfo.levels, vertices, verticesLow, baseInfo.deleted])
                    this._nextStorageId += gridNum
                }
            })
        }
    }

    deleteGridLocally(storageId: number, callback?: Function): void {
        const lastStorageId = this._nextStorageId - 1

        // Get render info of this removable grid and the grid having the last storageId
        const lastDeleted = this._gridDeletedCache[lastStorageId]
        const [lastLevel, lastGlobalId] = this.getGridInfoByStorageId(lastStorageId)
        this._gridKey_storageId_dict.delete(lastLevel, lastGlobalId)
        this._nextStorageId -= 1

        // Do nothing if the removable grid is the grid having the last storageId
        if (this._nextStorageId === storageId) return

        // Replace removable render info with the last render info in the cache
        this._gridLevelCache[storageId] = lastLevel
        this._gridDeletedCache[storageId] = lastDeleted
        this._gridGlobalIdCache[storageId] = lastGlobalId
        this._gridKey_storageId_dict.update(storageId, lastLevel, lastGlobalId)
        callback && callback([lastStorageId, storageId])
    }

    deleteGridsLocally(storageIds: number[], callback?: Function): void {
        // Convert removableStorageIds to ascending order and record grids' levels and globalIds which point to
        const removableGridNum = storageIds.length
        const removableLevels = new Array<number>(removableGridNum)
        const removableGlobalIds = new Array<number>(removableGridNum)

        storageIds.sort((a, b) => a - b).forEach((storageId, index) => {
            const [level, globalId] = this.getGridInfoByStorageId(storageId)
            removableLevels[index] = level
            removableGlobalIds[index] = globalId
        })

       for (let i = 0; i < removableGridNum; i++) {
            this._gridKey_storageId_dict.delete(removableLevels[i], removableGlobalIds[i])
       } 

        const maintainedGridNum = this.gridNum - removableGridNum
        const replacedGridNum = maintainedGridNum > removableGridNum ? removableGridNum : maintainedGridNum

        // Generate info cache about replaced grids having last valid storageIds 
        // Note: storageId not pointing to any removable grids is valid
        let replacedStorageId = this._nextStorageId - 1
        const removableIdStack = storageIds.slice()
        const replacedGridInfo = new Array<[storageId: number, level: number, globalId: number, deleted: number]>()
        while (replacedGridInfo.length !== replacedGridNum) {

            // No need to replace removable grids by valid grid infos since they are never be used
            if (storageIds[replacedGridInfo.length] >= this.gridNum) break

            // Check if lastStorageId is one of removable storageIds
            if (removableIdStack.length && removableIdStack[removableIdStack.length - 1] === replacedStorageId) {
                removableIdStack.pop()
            } else {

                // If replacedStorageId is less than removableStorageId, break for replacement not necessary
                if (replacedStorageId <= storageIds[replacedGridInfo.length]) break
                const [lastLevel, lastGlobalId] = this.getGridInfoByStorageId(replacedStorageId)
                const lastDeleted = this._gridDeletedCache[replacedStorageId]
                replacedGridInfo.push([replacedStorageId, lastLevel, lastGlobalId, lastDeleted])
            }
            replacedStorageId--
        }

        this._nextStorageId -= removableGridNum

        const replacedStorageIds: number[] = []     // source storageIds to be replaced
        const removableStorageIds: number[] = []    // target storageIds to be removed
        storageIds.forEach((storageId, index) => {
            if (index > replacedGridInfo.length - 1) return
            
            // Replace removable render info with the last render info in the cache
            const [replacedStorageId, replacedLevel, replacedGlobalId, replacedDeleted] = replacedGridInfo[index]
            this._gridLevelCache[storageId] = replacedLevel
            this._gridDeletedCache[storageId] = replacedDeleted
            this._gridGlobalIdCache[storageId] = replacedGlobalId
            this._gridKey_storageId_dict.update(storageId, replacedLevel, replacedGlobalId)

            replacedStorageIds.push(replacedStorageId)
            removableStorageIds.push(storageId)
        })
        callback && callback([
            replacedStorageIds, 
            removableStorageIds,
        ])
    }

    /**
     * Mark the specified grids as deleted
     * @description: Marks the specified grids as deleted in the grid system.  
     * Not really deleted, but marked as deleted.  
     * For recover operation, the deleted grids must still can be picked up.
     */
    markGridsAsDeleted(removableStorageIds: number[], callback?: Function): void {
        const levels = new Uint8Array(removableStorageIds.length)
        const globalIds = new Uint32Array(removableStorageIds.length)
        for (let i = 0; i < removableStorageIds.length; i++) {
            const storageId = removableStorageIds[i]
            const [level, globalId] = this.getGridInfoByStorageId(storageId)
            levels[i] = level
            globalIds[i] = globalId
            this._gridDeletedCache[storageId] = DELETED_FLAG
        }
        // Mark provided grids as deleted
        this._dispatcher.actor.send('removeGrids', { levels, globalIds }, () => {
            callback && callback()
        })
    }

    recoverGrids(recoverableStorageIds: number[], callback?: Function): void {
        const levels = new Uint8Array(recoverableStorageIds.length)
        const globalIds = new Uint32Array(recoverableStorageIds.length)
        for (let i = 0; i < recoverableStorageIds.length; i++) {
            const storageId = recoverableStorageIds[i]
            const [level, globalId] = this.getGridInfoByStorageId(storageId)
            levels[i] = level
            globalIds[i] = globalId
            this._gridDeletedCache[storageId] = UNDELETED_FLAG
        }
        // Recover provided grids
        this._dispatcher.actor.send('recoverGrids', { levels, globalIds }, () => {
            callback && callback()
        })
    }

    /**
     * Subdivide the grids by subdivideInfos  
     * Reason for use subdivideInfos instead of storageIds:  
     * Info stored in cache (indexed by storageIds) of the subdividable grids is replaced because of the previous delete operation,
     * use storageIds to get info of subdividable grids is incorrect.
     */
    subdivideGrids(subdivideInfos: {levels: Uint8Array, globalIds: Uint32Array}, callback?: Function): void {

        // Dispatch a worker to subdivide the grids
        this._dispatcher.actor.send('subdivideGrids', subdivideInfos, (_, baseInfo: MultiGridBaseInfo) => {
            baseInfo.deleted = new Uint8Array(baseInfo.levels.length).fill(UNDELETED_FLAG)
            this.updateMultiGridRenderInfo(baseInfo, callback)
        })
    }

    mergeGrids(mergeableStorageIds: number[], callback?: Function): void {
        const levels = new Uint8Array(mergeableStorageIds.length)
        const globalIds = new Uint32Array(mergeableStorageIds.length)
        for (let i = 0; i < mergeableStorageIds.length; i++) {
            const storageId = mergeableStorageIds[i]
            const [level, globalId] = this.getGridInfoByStorageId(storageId)
            levels[i] = level
            globalIds[i] = globalId
        }
        // Merge provided grids
        this._dispatcher.actor.send('mergeGrids', { levels, globalIds }, (_: any, parentInfo: MultiGridBaseInfo) => {
            // Get storageIds of all child grids
            const childStorageIds: number[] = []
            const parentNum = parentInfo.levels.length
            for (let i = 0; i < parentNum; i++) {
                const parentLevel = parentInfo.levels[i]
                const parentGlobalId = parentInfo.globalIds[i]
                const children = this.getGridChildren(parentLevel, parentGlobalId)
                if (children) {
                    children.forEach((childGlobalId) => {
                        const childStorageId = this._gridKey_storageId_dict.get(parentLevel + 1, childGlobalId)! // ! ensured by backend
                        childStorageIds.push(childStorageId)
                    })
                }
            }
            callback && callback({childStorageIds, parentInfo})
        })
    }

    getGridInfoByFeature(path: string, callback?: Function) {
        this._dispatcher.actor.send('getGridInfoByFeature', path, (_, gridInfo: {levels: Uint8Array, globalIds: Uint32Array}) => {
            const { levels, globalIds } = gridInfo
            const gridNum = levels.length
            const storageIds: number[] = new Array(gridNum)
            for (let i = 0; i < gridNum; i++) {
                const id = this._gridKey_storageId_dict.get(levels[i], globalIds[i])! // ! ensured because all active grids are stored in the cache
                storageIds[i] = id
            }
            callback && callback(storageIds)
        })
    }

    getGridChildren(level: number, globalId: number): number[] | null {
        if (level >= this.levelInfos.length || level < 0) return null;

        const { width: levelWidth } = this.levelInfos[level];
        const globalU = globalId % levelWidth;
        const globalV = Math.floor(globalId / levelWidth);

        const [subWidth, subHeight] = this.context.rules[level];
        const subCount = subWidth * subHeight;

        const children = new Array<number>(subCount);
        const baseGlobalWidth = levelWidth * subWidth;
        for (let localId = 0; localId < subCount; localId++) {
            const subU = localId % subWidth;
            const subV = Math.floor(localId / subWidth);

            const subGlobalU = globalU * subWidth + subU;
            const subGlobalV = globalV * subHeight + subV;
            const subGlobalId = subGlobalV * baseGlobalWidth + subGlobalU;
            children[localId] = subGlobalId;
        }

        return children;
    }

    getGridInfoByStorageId(storageId: number): [level: number, globalId: number] {
        return [
            this._gridLevelCache[storageId],
            this._gridGlobalIdCache[storageId]
        ]
    }

    isGridDeleted(storageId: number): boolean {
        return this._gridDeletedCache[storageId] === DELETED_FLAG
    }

    getGridLocalId(level: number, globalId: number) {
        if (level === 0) return 0

        const { width } = this.levelInfos[level]
        const [subWidth, subHeight] = this.context.rules[level - 1]

        const u = globalId % width
        const v = Math.floor(globalId / width)

        return ((v % subHeight) * subWidth) + (u % subWidth)
    }

    checkGrid(storageId: number): GridCheckingInfo {
        const level = this._gridLevelCache[storageId]
        const globalId = this._gridGlobalIdCache[storageId]
        const localId = this.getGridLocalId(level, globalId)
        const deleted = this._gridDeletedCache[storageId] === DELETED_FLAG

        return {
            storageId,
            level,
            globalId,
            localId,
            deleted
        }
    }

    save(callback: Function) {
        this._dispatcher.actor.send('saveGrids', null, (_: any, gridInfo: GridSaveInfo) => {
            callback && callback(gridInfo)
        })
    }
}

// Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////

function encodeFloatToDouble(value: number) {
    const result = new Float32Array(2);
    result[0] = value;
  
    const delta = value - result[0];
    result[1] = delta;
    return result;
}
