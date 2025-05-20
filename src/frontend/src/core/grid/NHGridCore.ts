import proj4 from 'proj4'
import Dispatcher from '../message/dispatcher'
import { MercatorCoordinate } from '../math/mercatorCoordinate'
import { EdgeRenderInfoPack, GridContext, GridInfo, GridNodeRenderInfoPack, GridSaveInfo, GridTopologyInfo, MultiGridRenderInfo } from './NHGrid'
import BoundingBox2D from '../util/boundingBox2D'
import { Callback } from '../types'

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

    private _nextStorageId = 0
    bBoxCenterF32: Float32Array

    dispatcher: Dispatcher
    projConverter: proj4.Converter

    maxGridNum: number

    // Grid cache
    levelInfos: GridLevelInfo[]
    gridLevelCache: Float32Array
    gridDeletedCache: Uint8Array
    gridGlobalIdCache: Uint32Array
    gridKey_storageId_dict: Map<string, number>
    grid_attribute_cache: Array<Record<string, any>> = [] // { height: number [-9999], type: number [ 0, 0-10 ] }
    storageId_edgeId_set: Array<[Set<number>, Set<number>, Set<number>, Set<number>]> = []

    // Edge cache
    edgeKeys_cache: string[] = []
    adjGrids_cache: number[][] = []
    edge_attribute_cache: Array<Record<string, any>> = [] // { height: number [-9999], type: number [ 0, 0-10 ] }

    constructor(public context: GridContext, options: GridRecordOptions = {}) {

        this.maxGridNum = options.maxGridNum ?? 4096 * 4096
        this.dispatcher = new Dispatcher(this, Math.min(options.workerCount ?? 4, 4))
        this.projConverter = proj4(this.context.srcCS, this.context.targetCS)

        // Init levelInfos
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

        // Init grid cache
        this.gridKey_storageId_dict = new Map()
        this.gridLevelCache = new Float32Array(this.maxGridNum)
        this.gridGlobalIdCache = new Uint32Array(this.maxGridNum)
        this.gridDeletedCache = new Uint8Array(this.maxGridNum).fill(UNDELETED_FLAG)
        this.grid_attribute_cache = Array.from({ length: this.maxGridNum }, () => { return { height: -9999, type: 0 } })

        // Calculate bounding box center in mercator coordinates for high-precision rendering
        const bBoxCenter: [number, number] = this.projConverter.forward(this.context.bBox.center)
        const mercatorCenter = MercatorCoordinate.fromLonLat(bBoxCenter)
        const centerX = encodeFloatToDouble(mercatorCenter[0])
        const centerY = encodeFloatToDouble(mercatorCenter[1])
        this.bBoxCenterF32 = new Float32Array([...centerX, ...centerY])
    }

    init(callback?: Function): void {
        // Brodcast actors to init grid manager and initialize grid cache
        this.dispatcher.broadcast('setGridManager', this.context, () => {
            // Get activate grid information
            this._actor.send('getGridInfo', null, (error: any, renderInfo: MultiGridRenderInfo) => {
                // Initialize grid cache
                const gridNum = renderInfo.levels.length
                this._nextStorageId = gridNum
                for (let storageId = 0; storageId < gridNum; storageId++) {
                    this.updateDict(storageId, renderInfo.levels[storageId], renderInfo.globalIds[storageId])
                    this.gridLevelCache[storageId] = renderInfo.levels[storageId]
                    this.gridDeletedCache[storageId] = renderInfo.deleted![storageId]
                    this.gridGlobalIdCache[storageId] = renderInfo.globalIds[storageId]
                }

                callback && callback([0, renderInfo.levels, renderInfo.vertices, renderInfo.verticesLow, renderInfo.deleted])

            })
        })
    }

    private get _actor() {
        return this.dispatcher.actor
    }

    get edgeNum(): number {
        return this.edgeKeys_cache.length
    }

    get gridNum(): number {
        return this._nextStorageId
    }

    get maxLevel() {
        return this.levelInfos.length - 1
    }

    get bBox() {
        return this.context.bBox
    }

    get srcCRS() {
        return this.context.srcCS
    }

    updateDict(storageId: number, level: number, globalId: number) {
        this.gridKey_storageId_dict.set(`${level}-${globalId}`, storageId)
    }

    addGrids(levels: Uint8Array, globalIds: Uint32Array, deleted: Uint8Array, callback?: Function): void {
        const gridNum = levels.length
        for (let i = 0; i < gridNum; i++) {
            const storageId = this._nextStorageId + i
            this.updateDict(storageId, levels[i], globalIds[i])
            this.gridLevelCache[storageId] = levels[i]
            this.gridDeletedCache[storageId] = deleted[i]
            this.gridGlobalIdCache[storageId] = globalIds[i]
        }

        callback && callback(this._nextStorageId)
        this._nextStorageId += gridNum
    }

    deleteGridLocally(storageId: number, callback?: Function): void {
        const lastStorageId = this._nextStorageId - 1

        // Get render info of this removable grid and the grid having the last storageId
        const lastDeleted = this.gridDeletedCache[lastStorageId]
        const [lastLevel, lastGlobalId] = this.getGridInfoByStorageId(lastStorageId)
        this.gridKey_storageId_dict.delete(`${lastLevel}-${lastGlobalId}`)
        this._nextStorageId -= 1

        // Do nothing if the removable grid is the grid having the last storageId
        if (this._nextStorageId === storageId) return

        // Replace removable render info with the last render info in the cache
        this.updateDict(storageId, lastLevel, lastGlobalId)
        this.gridLevelCache[storageId] = lastLevel
        this.gridDeletedCache[storageId] = lastDeleted
        this.gridGlobalIdCache[storageId] = lastGlobalId
        const [vertices, verticesLow] = this._createNodeRenderVertices(lastLevel, lastGlobalId)
        callback && callback([storageId, lastLevel, vertices, verticesLow, lastDeleted])
    }

    deleteGridsLocally(storageIds: number[], callback?: Function): void {
        // Convert removableStorageIds to ascending order and record grids' levels and globalIds which point to
        const removableGridNum = storageIds.length
        const removableLevels = new Array<number>(removableGridNum)
        const removableGlobalIds = new Array<number>(removableGridNum)

       for (let i = 0; i < removableGridNum; i++) {
            this.gridKey_storageId_dict.delete(`${removableLevels[i]}-${removableGlobalIds[i]}`)
       } 

        storageIds.sort((a, b) => a - b).forEach((storageId, index) => {
            const [level, globalId] = this.getGridInfoByStorageId(storageId)
            removableLevels[index] = level
            removableGlobalIds[index] = globalId
        })

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
                const lastDeleted = this.gridDeletedCache[replacedStorageId]
                replacedGridInfo.push([replacedStorageId, lastLevel, lastGlobalId, lastDeleted])
            }
            replacedStorageId--
        }

        this._nextStorageId -= removableGridNum

        const replacedLevels: number[] = []
        const replacedDeleteds: number[] = []
        const replacedStorageIds: number[] = []
        const replacedVertices: Float32Array[] = []
        const replacedVerticesLow: Float32Array[] = []
        storageIds.forEach((storageId, index) => {
            if (index > replacedGridInfo.length - 1) return
            
            // Replace removable render info with the last render info in the cache
            const [_, replacedLevel, replacedGlobalId, replacedDeleted] = replacedGridInfo[index]
            this.gridLevelCache[storageId] = replacedLevel
            this.gridDeletedCache[storageId] = replacedDeleted
            this.gridGlobalIdCache[storageId] = replacedGlobalId
            this.updateDict(storageId, replacedLevel, replacedGlobalId)

            const [vertices, verticesLow] = this._createNodeRenderVertices(replacedLevel, replacedGlobalId)


            replacedStorageIds.push(storageId)
            replacedLevels.push(replacedLevel)
            replacedVertices.push(vertices)
            replacedVerticesLow.push(verticesLow)
            replacedDeleteds.push(replacedDeleted)
        })
        callback && callback([
            replacedStorageIds,
            replacedLevels, 
            replacedVertices, 
            replacedVerticesLow,
            replacedDeleteds
        ])
    }

    /**
     * Mark the specified grids as deleted
     * @description: Marks the specified grids as deleted in the grid system.  
     * Not really deleted, but marked as deleted.  
     * For recover operation, the deleted grids must still can be picked up.
     */
    markAsDeletedGrids(removableStorageIds: number[], callback?: Function): void {
        const levels = new Uint8Array(removableStorageIds.length)
        const globalIds = new Uint32Array(removableStorageIds.length)
        for (let i = 0; i < removableStorageIds.length; i++) {
            const storageId = removableStorageIds[i]
            const [level, globalId] = this.getGridInfoByStorageId(storageId)
            levels[i] = level
            globalIds[i] = globalId
            this.gridDeletedCache[storageId] = DELETED_FLAG
        }
        // Mark provided grids as deleted
        this._actor.send('removeGrids', { levels, globalIds }, () => {
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
            this.gridDeletedCache[storageId] = UNDELETED_FLAG
        }
        // Recover provided grids
        this._actor.send('recoverGrids', { levels, globalIds }, () => {
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
        this._actor.send('subdivideGrids', subdivideInfos, (_, renderInfos: MultiGridRenderInfo) => {

            renderInfos.globalIds.forEach((globalId, index) => {
                
                const storageId = this._nextStorageId + index
                const level = renderInfos.levels[index]
                this.gridLevelCache[storageId] = level
                this.gridGlobalIdCache[storageId] = globalId
                this.gridDeletedCache[storageId] = UNDELETED_FLAG
                this.updateDict(storageId, level, globalId)
            })

            const { levels, vertices, verticesLow, deleted } = renderInfos
            callback && callback([this._nextStorageId, levels, vertices, verticesLow, deleted])
            this._nextStorageId += renderInfos.globalIds.length
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
        this._actor.send('mergeGrids', { levels, globalIds }, (_: any, parentRenderInfo: MultiGridRenderInfo) => {
            // Get storageIds of all child grids
            const childStorageIds: number[] = []
            const parentNum = parentRenderInfo.levels.length
            for (let i = 0; i < parentNum; i++) {
                const parentLevel = parentRenderInfo.levels[i]
                const parentGlobalId = parentRenderInfo.globalIds[i]
                const children = this.getGridChildren(parentLevel, parentGlobalId)
                if (children) {
                    children.forEach((childGlobalId) => {
                        const childStorageId = this.gridKey_storageId_dict.get(`${parentLevel + 1}-${childGlobalId}`)
                        if (childStorageId !== undefined) {
                            childStorageIds.push(childStorageId)
                        }
                    })
                }
            }
            callback && callback({childStorageIds, parentRenderInfo})
        })
    }

    getGridInfoByFeature(path: string, callback?: Function) {
        this._actor.send('getGridInfoByFeature', path, (error: any, gridInfo: {levels: Uint8Array, globalIds: Uint32Array}) => {
            const { levels, globalIds } = gridInfo
            const gridNum = levels.length
            const storageIds: number[] = new Array(gridNum)
            for (let i = 0; i < gridNum; i++) {
                const gridKey = `${levels[i]}-${globalIds[i]}`
                if (this.gridKey_storageId_dict.has(gridKey)) {
                    storageIds[i] = this.gridKey_storageId_dict.get(gridKey)!
                }
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
            this.gridLevelCache[storageId],
            this.gridGlobalIdCache[storageId]
        ]
    }

    isGridDeleted(storageId: number): boolean {
        return this.gridDeletedCache[storageId] === DELETED_FLAG
    }

    getEdgeInfoByStorageId(storageId: number) {

        return this.storageId_edgeId_set[storageId].map(edgeSet => {
            return Array.from(edgeSet).sort((edgeA, edgeB) => {
                const keyA = this.edgeKeys_cache[edgeA]
                const keyB = this.edgeKeys_cache[edgeB]
                const dir = keyA.slice(0, 1)
                const posA = keyA.slice(1).split('-')
                const posB = keyB.slice(1).split('-')

                const minA = (+posA[0]) / (+posA[1])
                const minB = (+posB[0]) / (+posB[1])
                return dir === 'h' ? minA - minB : minB - minA
            })
        })
    }

    setGridAttributeByStorageId(storageId: number, attr: { height: number, type: number }) {
        this.grid_attribute_cache[storageId].height = attr.height
        this.grid_attribute_cache[storageId].type = attr.type
    }

    setEdgeAttributeByStorageId(storageId: number, attr: { height: number, type: number }) {
        this.edge_attribute_cache[storageId].height = attr.height
        this.edge_attribute_cache[storageId].type = attr.type
    }

    getGridLocalId(level: number, globalId: number) {
        if (level === 0) return 0

        const { width } = this.levelInfos[level]
        const [subWidth, subHeight] = this.context.rules[level - 1]

        const u = globalId % width
        const v = Math.floor(globalId / width)

        return ((v % subHeight) * subWidth) + (u % subWidth)
    }

    getParentGlobalId(level: number, globalId: number): number {
        if (level === 0) return 0

        const { width } = this.levelInfos[level]
        const [subWidth, subHeight] = this.context.rules[level - 1]

        const u = globalId % width
        const v = Math.floor(globalId / width)

        return Math.floor(v / subHeight) * this.levelInfos[level - 1].width + Math.floor(u / subWidth)
    }

    checkGrid(storageId: number): GridInfo {
        const level = this.gridLevelCache[storageId]
        const globalId = this.gridGlobalIdCache[storageId]
        const localId = this.getGridLocalId(level, globalId)
        const deleted = this.gridDeletedCache[storageId] === DELETED_FLAG

        return {
            storageId,
            level,
            globalId,
            localId,
            deleted
        }
    }

    save(callback: Function) {
        this._actor.send('saveGrids', null, (_: any, gridInfo: GridSaveInfo) => {
            callback && callback(gridInfo)
        })
    }

    private _createNodeRenderVertices(level: number, globalId: number, vertices?: Float32Array, verticesLow?: Float32Array): [Float32Array, Float32Array] {

        const bBox = this.context.bBox
        const { width, height } = this.levelInfos[level]

        const globalU = globalId % width
        const globalV = Math.floor(globalId / width)

        const xMin = lerp(bBox.xMin, bBox.xMax, globalU / width)
        const yMin = lerp(bBox.yMin, bBox.yMax, globalV / height)
        const xMax = lerp(bBox.xMin, bBox.xMax, (globalU + 1) / width)
        const yMax = lerp(bBox.yMin, bBox.yMax, (globalV + 1) / height)

        const targetCoords = [
            this.projConverter.forward([xMin, yMax]),  // srcTL
            this.projConverter.forward([xMax, yMax]),  // srcTR
            this.projConverter.forward([xMin, yMin]),  // srcBL
            this.projConverter.forward([xMax, yMin]),  // srcBR
        ]
        
        const centerX = this.bBoxCenterF32.subarray(0, 2)
        const centerY = this.bBoxCenterF32.subarray(2, 4)

        const renderCoords: number[] = []
        const renderCoordsLow: number[] = []
        targetCoords.forEach((coord) => {
            const mercatorCoord = MercatorCoordinate.fromLonLat(coord as [number, number])
            const mercatorCoordX = encodeFloatToDouble(mercatorCoord[0])
            const mercatorCoordY = encodeFloatToDouble(mercatorCoord[1])
            renderCoords.push(mercatorCoordX[0] - centerX[0])
            renderCoordsLow.push(mercatorCoordX[1] - centerX[1])
            renderCoords.push(mercatorCoordY[0] - centerY[0])
            renderCoordsLow.push(mercatorCoordY[1] - centerY[1])
        })

        if (!vertices) vertices = new Float32Array(renderCoords.flat());
        else vertices.set(renderCoords.flat(), 0);
        if (!verticesLow) verticesLow = new Float32Array(renderCoordsLow.flat());
        else verticesLow.set(renderCoordsLow.flat(), 0);
        return [vertices, verticesLow];
    }

    // parseGridTopology(callback?: (isCompleted: boolean, fromStorageId: number, vertexBuffer: Float32Array) => any): void {
    //     // Dispatch a worker to parse the topology about all grids
    //     this._actor.send('parseTopology', this.storageId_gridInfo_cache.slice(0, this._nextStorageId * 2), (_, topologyInfo: GridTopologyInfo) => {
    //         this.edgeKeys_cache = topologyInfo[0]
    //         this.adjGrids_cache = topologyInfo[1]
    //         this.storageId_edgeId_set = topologyInfo[2]

    //         // Init attribute cache 
    //         this.edge_attribute_cache = Array.from({ length: this.edgeNum }, () => { return { height: -9999, type: 0 } })

    //         let preparedChunkNum = 0
    //         const actorNum = WorkerPool.workerCount - 1
    //         const edgeChunk = Math.ceil(this.edgeKeys_cache.length / actorNum)
    //         for (let actorIndex = 0; actorIndex < actorNum; actorIndex++) {
    //             this._actor.send(
    //                 'calcEdgeRenderInfos',
    //                 { index: actorIndex, keys: this.edgeKeys_cache.slice(actorIndex * edgeChunk, Math.min(this.edgeKeys_cache.length, (actorIndex + 1) * edgeChunk)) },
    //                 (_, edgeRenderInfos: EdgeRenderInfoPack) => {

    //                     preparedChunkNum += 1
    //                     const fromStorageId = edgeRenderInfos.actorIndex * edgeChunk
    //                     callback && callback(preparedChunkNum === actorNum, fromStorageId, edgeRenderInfos.vertexBuffer)
    //                 }
    //             )
    //         }
    //     })
    // }
}

// Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////

function lerp(a: number, b: number, t: number): number {
    return (1.0 - t) * a + t * b
}

function encodeFloatToDouble(value: number) {
    const result = new Float32Array(2);
    result[0] = value;
  
    const delta = value - result[0];
    result[1] = delta;
    return result;
}