import proj4 from 'proj4'

import WorkerPool from '../worker/workerPool'
import Dispatcher from '../message/dispatcher'
import { createDB, deleteDB } from '../database/db'
import { MercatorCoordinate } from '../math/mercatorCoordinate'
import UndoRedoManager, { UndoRedoOperation } from '../util/undoRedoManager'
import { EdgeRenderInfoPack, GridNodeRenderInfoPack, GridTopologyInfo, SubdivideRules } from './NHGrid'

proj4.defs('EPSG:2326',"+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.243649,-1.158827,-1.094246 +units=m +no_defs")

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

export interface UndoRedoRecordOperation extends UndoRedoOperation {
    action: 'RemoveGrid' | 'RemoveGrids' | 'SubdivideGrid' | 'SubdivideGrids'
}

export interface GridRecordOptions {

    workerCount?: number
    dispatcher?: Dispatcher
    operationCapacity?: number
    autoDeleteIndexedDB?: boolean
    projectLoadCallback?: (infos: [fromStorageId: number, levels: Uint8Array, vertexBuffer: Float32Array]) => void
}

export default class GridRecorder extends UndoRedoManager {

    private _nextStorageId = 0
    private _projConverter: proj4.Converter

    isReady = false
    dispatcher: Dispatcher
    levelInfos: GridLevelInfo[]
    projectLoadCallback: undefined | ((infos: [fromStorageId: number, levels: Uint8Array, vertexBuffer: Float32Array]) => void)

    // Grid containers
    storageId_gridInfo_cache: Array<number> // [ level_0, globalId_0, level_1, globalId_1, ... , level_n, globalId_n ]
    grid_attribute_cache: Array<Record<string, any>> = [] // { height: number [-9999], type: number [ 0, 0-10 ] }
    storageId_edgeId_set: Array<[Set<number>, Set<number>, Set<number>, Set<number>]> = []

    // Edge containers
    edgeKeys_cache: string[] = []
    adjGrids_cache: number[][] = []
    edge_attribute_cache: Array<Record<string, any>> = [] // { height: number [-9999], type: number [ 0, 0-10 ] }

    constructor(public subdivideRules: SubdivideRules, maxGridNum: number, options: GridRecordOptions = {}) {
        super(options.operationCapacity || 50)

        this.dispatcher = options.dispatcher || new Dispatcher(this, options.workerCount || 4)

        this.projectLoadCallback = options.projectLoadCallback

        // Init projConverter
        this._projConverter = proj4(this.subdivideRules.srcCS, this.subdivideRules.targetCS)

        // Init levelInfos
        this.levelInfos = new Array<GridLevelInfo>(this.subdivideRules.rules.length)
        this.subdivideRules.rules.forEach((_, level, rules) => {

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
        this.storageId_gridInfo_cache = new Array<number>(maxGridNum * 2)
        this.grid_attribute_cache = Array.from({ length: maxGridNum }, () => { return { height: -9999, type: 0 } })

        // Create IndexedDB
        createDB('GridDB', 'GridNode', 'uuId')
        if (options.autoDeleteIndexedDB === undefined ? true : options.autoDeleteIndexedDB) {
            window.onbeforeunload = () => deleteDB('GridDB')
        }
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
        return this.subdivideRules.bBox
    }

    get srcCRS() {
        return this.subdivideRules.srcCS
    }

    init(callback?: Function) {

        this.dispatcher.broadcast('init', this.subdivideRules, () => {
            this.isReady = true

            // Create root node in indexedDB
            this._dbActor.send('createGrids', ['0-0'], () => {
                callback && callback()
            })
        })
    }

    removeGrid(storageId: number, callback?: Function): void {

        const removeOperation = this._generateRemoveGridOperation(storageId, callback)
        this.execute(removeOperation)
    }

    removeGrids(storageIds: number[], callback?: Function): void {

        const removeOperation = this._generateRemoveGridsOperation(storageIds, callback)
        this.execute(removeOperation)
    }

    subdivideGrid(level: number, globalId: number, callback?: Function): void {

        // Dispatch a worker to subdivide the grid
        this._actor.send('subdivideGrid', [level, globalId], (_, renderInfos: GridNodeRenderInfoPack) => {

            const subdivideOperation = this._generateSubdivideGridOperation(level + 1, renderInfos, callback)
            this.execute(subdivideOperation)

            // this._dbActor.send('createGrids', renderInfos.uuIds)
        })
    }

    subdivideGrids(subdivideInfos: Array<[level: number, globalId: number]>, callback?: Function): void {

        const actorNum = WorkerPool.workerCount - 1
        const subdivideChunk = Math.ceil(subdivideInfos.length / actorNum)
        const renderInfoPacks = new Array<GridNodeRenderInfoPack>(actorNum)

        let preparedChunkNum = 0
        for (let actorIndex = 0; actorIndex < actorNum; actorIndex++) {
            this._actor.send(
                'subdivideGrids',
                subdivideInfos.slice(actorIndex * subdivideChunk, Math.min(subdivideInfos.length, (actorIndex + 1) * subdivideChunk)),
                (_, renderInfoPack: GridNodeRenderInfoPack) => {

                    renderInfoPacks[preparedChunkNum++] = renderInfoPack
                    if (preparedChunkNum === actorNum) {
                        const multiSubdivideOperation = this._generateSubdivideGridsOperation(renderInfoPacks, callback)
                        this.execute(multiSubdivideOperation)
                    }
                }
            )
        }
    }

    parseGridTopology(callback?: (isCompleted: boolean, fromStorageId: number, vertexBuffer: Float32Array) => any): void {

        // Dispatch a worker to parse the topology about all grids
        this._actor.send('parseTopology', this.storageId_gridInfo_cache.slice(0, this._nextStorageId * 2), (_, topologyInfo: GridTopologyInfo) => {
            this.edgeKeys_cache = topologyInfo[0]
            this.adjGrids_cache = topologyInfo[1]
            this.storageId_edgeId_set = topologyInfo[2]

            // Init attribute cache 
            this.edge_attribute_cache = Array.from({ length: this.edgeNum }, () => { return { height: -9999, type: 0 } })

            let preparedChunkNum = 0
            const actorNum = WorkerPool.workerCount - 1
            const edgeChunk = Math.ceil(this.edgeKeys_cache.length / actorNum)
            for (let actorIndex = 0; actorIndex < actorNum; actorIndex++) {
                this._actor.send(
                    'calcEdgeRenderInfos',
                    { index: actorIndex, keys: this.edgeKeys_cache.slice(actorIndex * edgeChunk, Math.min(this.edgeKeys_cache.length, (actorIndex + 1) * edgeChunk)) },
                    (_, edgeRenderInfos: EdgeRenderInfoPack) => {

                        preparedChunkNum += 1
                        const fromStorageId = edgeRenderInfos.actorIndex * edgeChunk
                        callback && callback(preparedChunkNum === actorNum, fromStorageId, edgeRenderInfos.vertexBuffer)
                    }
                )
            }
        })
    }

    // Fix offset in ESRI:102140
    wrap(storageId_gridInfo_cache: number[]) {

        if (this.srcCRS !== "ESRI:102140") return

        const bBox = this.subdivideRules.bBox
        const converter2326 = proj4("EPSG:2326", this.subdivideRules.targetCS)
        for (let i = 0; i < this.gridNum; i++) {
            const level = storageId_gridInfo_cache[i * 2 + 0]
            const globalId_102140 = storageId_gridInfo_cache[i * 2 + 1]
            
            const width = this.levelInfos[level].width
            const height = this.levelInfos[level].height

            const globalU = globalId_102140 % width
            const globalV = Math.floor(globalId_102140 / width)

            const xMin = lerp(bBox.xMin, bBox.xMax, globalU / width)
            const yMin = lerp(bBox.yMin, bBox.yMax, globalV / height)
            const xMax = lerp(bBox.xMin, bBox.xMax, (globalU + 1) / width)
            const yMax = lerp(bBox.yMin, bBox.yMax, (globalV + 1) / height)
            const center_102140 = [(xMin + xMax) / 2.0, (yMin + yMax) / 2.0]
            const [ lon, lat ] = this._projConverter.forward(center_102140)
            const [ x, y ] = converter2326.inverse([lon, lat])

            const normalizedX = (x - this.bBox.xMin) / (this.bBox.xMax - this.bBox.xMin)
            const normalizedY = (y - this.bBox.yMin) / (this.bBox.yMax - this.bBox.yMin)
            if (normalizedX < 0 || normalizedX > 1 || normalizedY < 0 || normalizedY > 1) continue

            const col = Math.floor(normalizedX * width)
            const row = Math.floor(normalizedY * height)
            const globalID = row * width + col
            if (globalID !== globalId_102140) {
                console.log('Error GlobalId Fixed: ', globalID, globalId_102140)
            }
            storageId_gridInfo_cache[i * 2 + 1] = globalID
        }
    }

    serialize(): GridLayerSerializedInfo {

        return {
            levelInfos: this.levelInfos,
            CRS: this.subdivideRules.srcCS,
            extent: this.subdivideRules.bBox.boundary,
            subdivideRules: this.subdivideRules.rules,
            grids: this.storageId_edgeId_set.slice(0, this.gridNum).map((edgeIdSets, index) => {
                return {
                    index,
                    type: this.grid_attribute_cache[index]['type'],
                    height: this.grid_attribute_cache[index]['height'],
                    edges: edgeIdSets.map(edgeIdSet => [...edgeIdSet]),
                    level: this.storageId_gridInfo_cache[index * 2 + 0],
                    globalId: this.storageId_gridInfo_cache[index * 2 + 1],
                }
            }),
            edges: this.edgeKeys_cache.slice(0, this.edgeNum).map((key, index) => {
                return {
                    key,
                    index,
                    adjGrids: this.adjGrids_cache[index],
                    type: this.edge_attribute_cache[index]['type'],
                    height: this.edge_attribute_cache[index]['height'],
                }
            })
        }
    }

    deserialize(data: any) {

        if (!isDataValid(data)) return

        this.edgeKeys_cache = []
        this.adjGrids_cache = []
        this.edge_attribute_cache = []
        this.storageId_edgeId_set = []

        const projectInfo = data as GridLayerSerializedInfo
        this._projConverter = proj4(projectInfo.CRS, 'EPSG:4326')

        this._nextStorageId = 0
        this.levelInfos = projectInfo.levelInfos
        this.subdivideRules.srcCS = projectInfo.CRS
        this.subdivideRules.bBox.reset(...projectInfo.extent)
        this.subdivideRules.rules = projectInfo.subdivideRules
        projectInfo.grids.forEach((grid, storageId) => {
            this.storageId_gridInfo_cache[storageId * 2 + 0] = grid.level
            this.storageId_gridInfo_cache[storageId * 2 + 1] = grid.globalId
        })

        // Update subdivideRules in all workers
        this.dispatcher.broadcast('updateSubdividerules', this.subdivideRules, () => {

            // Generate grid render infos
            if (this.projectLoadCallback) {
                const grids = projectInfo.grids
                const gridNum = grids.length
                const vertices = new Float32Array(8)
                const vertexBuffer = new Float32Array(gridNum * 8)
                const levels = new Uint8Array(grids.map(grid => grid.level))
                grids.forEach((grid, storageId) => {
                    this._createNodeRenderVertices(grid.level, grid.globalId, vertices)
                    vertexBuffer[gridNum * 2 * 0 + storageId * 2 + 0] = vertices[0]
                    vertexBuffer[gridNum * 2 * 0 + storageId * 2 + 1] = vertices[1]
                    vertexBuffer[gridNum * 2 * 1 + storageId * 2 + 0] = vertices[2]
                    vertexBuffer[gridNum * 2 * 1 + storageId * 2 + 1] = vertices[3]
                    vertexBuffer[gridNum * 2 * 2 + storageId * 2 + 0] = vertices[4]
                    vertexBuffer[gridNum * 2 * 2 + storageId * 2 + 1] = vertices[5]
                    vertexBuffer[gridNum * 2 * 3 + storageId * 2 + 0] = vertices[6]
                    vertexBuffer[gridNum * 2 * 3 + storageId * 2 + 1] = vertices[7]
                })
    
                // Ready to render
                this._nextStorageId = gridNum
                this.projectLoadCallback([0, levels, vertexBuffer])
            }
        })

        // Local helper //////////////////////////////////////////////////

        function isDataValid(data: any): boolean {

            if (!data || typeof data !== 'object') return false
            const requiredFields = ['CRS', 'extent', 'levelInfos', 'subdivideRules', 'grids', 'edges']
            return requiredFields.every(field => !!data[field])
        }
    }

    getGridInfoByStorageId(storageId: number): [level: number, globalId: number] {

        return this.storageId_gridInfo_cache.slice(storageId * 2, (storageId + 1) * 2) as [level: number, globalId: number]
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

    resetEdges() {
        if (this.edgeNum) {
            this.edgeKeys_cache = []
            this.adjGrids_cache = []
            this.edge_attribute_cache = []
        }
    }

    resetGrids() {
        // Better than forEach
        for (let i = 0; i < this.gridNum; i++) {
            this.grid_attribute_cache[i].height = -9999
            this.grid_attribute_cache[i].type = 0
        }
    }

    getGridLocalId(level: number, globalId: number) {
        if (level === 0) return 0

        const { width } = this.levelInfos[level]
        const [subWidth, subHeight] = this.subdivideRules.rules[level - 1]

        const u = globalId % width
        const v = Math.floor(globalId / width)

        return ((v % subHeight) * subWidth) + (u % subWidth)
    }

    getParentGlobalId(level: number, globalId: number): number {
        if (level === 0) return 0

        const { width } = this.levelInfos[level]
        const [subWidth, subHeight] = this.subdivideRules.rules[level - 1]

        const u = globalId % width
        const v = Math.floor(globalId / width)

        return Math.floor(v / subHeight) * this.levelInfos[level - 1].width + Math.floor(u / subWidth)
    }

    checkGrid(storageId: number) {

        const level = this.storageId_gridInfo_cache[storageId * 2 + 0]
        const globalId = this.storageId_gridInfo_cache[storageId * 2 + 1]
        const localId = this.getGridLocalId(level, globalId)
        const edges = this.storageId_edgeId_set[storageId]

        return {
            storageId,
            level,
            globalId,
            localId,
            edges
        }
    }

    private get _actor() {
        return this.dispatcher.actor
    }

    private get _dbActor() {
        return this.dispatcher.dbActor
    }

    private _createNodeRenderVertices(level: number, globalId: number, vertices?: Float32Array): Float32Array {

        const bBox = this.subdivideRules.bBox
        const { width, height } = this.levelInfos[level]

        const globalU = globalId % width
        const globalV = Math.floor(globalId / width)

        const xMin = lerp(bBox.xMin, bBox.xMax, globalU / width)
        const yMin = lerp(bBox.yMin, bBox.yMax, globalV / height)
        const xMax = lerp(bBox.xMin, bBox.xMax, (globalU + 1) / width)
        const yMax = lerp(bBox.yMin, bBox.yMax, (globalV + 1) / height)

        const targetCoords = [
            this._projConverter.forward([xMin, yMax]),  // srcTL
            this._projConverter.forward([xMax, yMax]),  // srcTR
            this._projConverter.forward([xMin, yMin]),  // srcBL
            this._projConverter.forward([xMax, yMin]),  // srcBR
        ]

        const center = this._projConverter.forward([
            (bBox.xMin + bBox.xMax) / 2.0,
            (bBox.yMin + bBox.yMax) / 2.0,
        ])
        const mercatorCenter = MercatorCoordinate.fromLonLat(center as [number, number])
        const renderCoords = targetCoords.map(coord => MercatorCoordinate.fromLonLat(coord as [number, number]))
        const relativeCoords = renderCoords.map(renderCoord => {
            return [
                renderCoord[0] - mercatorCenter[0],
                renderCoord[1] - mercatorCenter[1],
            ] as [ number, number ]
        })

        if (!vertices) vertices = new Float32Array(relativeCoords.flat())
        else vertices.set(relativeCoords.flat(), 0)
        return vertices
    }

    // Fast function for removing single grid
    private _generateRemoveGridOperation(storageId: number, callback?: Function): UndoRedoRecordOperation {

        const lastStorageId = this._nextStorageId - 1

        // Get render info of this removable grid and the grid having the last storageId
        const [lastLevel, lastGlobalId] = this.getGridInfoByStorageId(lastStorageId)
        const [removableLevel, removableGlobalId] = this.getGridInfoByStorageId(storageId)

        const removeOperation: UndoRedoRecordOperation = {
            action: 'RemoveGrid',
            apply: () => {
                this._nextStorageId -= 1

                // Do nothing if the removable grid is the grid having the last storageId
                if (this._nextStorageId === storageId) return

                // Replace removable render info with the last render info in the cache
                this.storageId_gridInfo_cache[storageId * 2 + 0] = lastLevel
                this.storageId_gridInfo_cache[storageId * 2 + 1] = lastGlobalId
                callback && callback([storageId, lastLevel, this._createNodeRenderVertices(lastLevel, lastGlobalId)])
            },
            inverse: () => {
                this._nextStorageId += 1

                // Revert info about the removable grid
                this.storageId_gridInfo_cache[storageId * 2 + 0] = removableLevel
                this.storageId_gridInfo_cache[storageId * 2 + 1] = removableGlobalId

                // Revert info about the grid having the last storageId
                this.storageId_gridInfo_cache[lastStorageId * 2 + 0] = lastLevel
                this.storageId_gridInfo_cache[lastStorageId * 2 + 1] = lastGlobalId

                // Revert callback
                if (callback) {
                    callback([lastStorageId, lastLevel, this._createNodeRenderVertices(lastLevel, lastGlobalId)])
                    callback([storageId, removableLevel, this._createNodeRenderVertices(removableLevel, removableGlobalId)])
                }
            }
        }

        return removeOperation
    }

    // Optimized function for removing multi grids
    private _generateRemoveGridsOperation(removableStorageIds: number[], callback?: Function): UndoRedoRecordOperation {

        // Convert removableStorageIds to ascending order and record grids' levels and globalIds which point to
        const removableGridNum = removableStorageIds.length
        const removableLevels = new Array<number>(removableGridNum)
        const removableGlobalIds = new Array<number>(removableGridNum)
        removableStorageIds.sort((a, b) => a - b).forEach((storageId, index) => {
            const [level, globalId] = this.getGridInfoByStorageId(storageId)
            removableLevels[index] = level
            removableGlobalIds[index] = globalId
        })

        const maintainedGridNum = this.gridNum - removableGridNum
        const replacedGridNum = maintainedGridNum > removableGridNum ? removableGridNum : maintainedGridNum

        // Generate info cache about replaced grids having last valid storageIds 
        // Note: storageId not pointing to any removable grids is valid
        let replacedStorageId = this._nextStorageId - 1
        const removableIdStack = removableStorageIds.slice()
        const replacedGridInfo = new Array<[storageId: number, level: number, globalId: number]>()
        while (replacedGridInfo.length !== replacedGridNum) {

            // No need to replace removable grids by valid grid infos since they are never be used
            if (removableStorageIds[replacedGridInfo.length] >= this.gridNum) break

            // Check if lastStorageId is one of removable storageIds
            if (removableIdStack.length && removableIdStack[removableIdStack.length - 1] === replacedStorageId) {
                removableIdStack.pop()
            } else {

                // If replacedStorageId is less than removableStorageId, break for replacement not necessary
                if (replacedStorageId <= removableStorageIds[replacedGridInfo.length]) break
                const [lastLevel, lastGlobalId] = this.getGridInfoByStorageId(replacedStorageId)
                replacedGridInfo.push([replacedStorageId, lastLevel, lastGlobalId])
            }
            replacedStorageId--
        }

        const multiRemoveOperation: UndoRedoRecordOperation = {
            action: 'RemoveGrids',
            apply: () => {

                this._nextStorageId -= removableGridNum

                removableStorageIds.forEach((storageId, index) => {
                    if (index > replacedGridInfo.length - 1) return

                    // Replace removable render info with the last render info in the cache
                    const [_, replacedLevel, replacedGlobalId] = replacedGridInfo[index]
                    this.storageId_gridInfo_cache[storageId * 2 + 0] = replacedLevel
                    this.storageId_gridInfo_cache[storageId * 2 + 1] = replacedGlobalId

                    callback && callback([storageId, new Uint8Array([replacedLevel]), this._createNodeRenderVertices(replacedLevel, replacedGlobalId)])
                })
            },
            inverse: () => {

                this._nextStorageId += removableGridNum

                removableStorageIds.forEach((storageId, index) => {

                    // Revert info about the removable grid
                    const removableLevel = removableLevels[index]
                    const removableGlobalId = removableGlobalIds[index]
                    this.storageId_gridInfo_cache[storageId * 2 + 0] = removableLevel
                    this.storageId_gridInfo_cache[storageId * 2 + 1] = removableGlobalId
                    callback && callback([storageId, new Uint8Array([removableLevel]), this._createNodeRenderVertices(removableLevel, removableGlobalId)])

                    // Revert info about the grid having the replaced storageId
                    if (index <= replacedGridInfo.length - 1) {

                        const [replacedStorageId, replacedLevel, replacedGlobalId] = replacedGridInfo[index]
                        this.storageId_gridInfo_cache[replacedStorageId * 2 + 0] = replacedLevel
                        this.storageId_gridInfo_cache[replacedStorageId * 2 + 1] = replacedGlobalId
                        callback && callback([replacedStorageId, new Uint8Array([replacedLevel]), this._createNodeRenderVertices(replacedLevel, replacedGlobalId)])
                    }
                })
            }
        }

        return multiRemoveOperation
    }

    private _generateSubdivideGridOperation(level: number, renderInfos: GridNodeRenderInfoPack, callback?: Function): UndoRedoRecordOperation {

        const subdivideOperation: UndoRedoRecordOperation = {
            action: 'SubdivideGrid',
            apply: () => {

                const fromStorageId = this._nextStorageId
                const infoLength = renderInfos.uuIds.length

                renderInfos.uuIds.forEach(uuId => {

                    const storageId = this._nextStorageId++
                    const [level, globalId] = uuId.split('-').map(key => +key)

                    this.storageId_gridInfo_cache[storageId * 2 + 0] = level
                    this.storageId_gridInfo_cache[storageId * 2 + 1] = globalId

                })
                const levels = new Uint8Array(infoLength).fill(level)
                callback && callback([fromStorageId, levels, renderInfos.vertexBuffer])
            },
            inverse: () => {

                const fromStorageId = this._nextStorageId
                const infoLength = renderInfos.uuIds.length
                const toStorageId = fromStorageId + infoLength - 1

                // Remove info in cache
                for (let i = fromStorageId; i <= toStorageId; i++) {

                    this._nextStorageId--
                    this.storageId_gridInfo_cache[i * 2 + 0] = -1
                    this.storageId_gridInfo_cache[i * 2 + 1] = -1
                }
                callback && callback(null)
            }
        }

        return subdivideOperation
    }

    private _generateSubdivideGridsOperation(infoPacks: Array<GridNodeRenderInfoPack>, callback?: Function): UndoRedoRecordOperation {

        const multiSubdivideOperation: UndoRedoRecordOperation = {
            action: 'SubdivideGrids',
            apply: () => {

                for (const pack of infoPacks) {

                    const packLength = pack.uuIds.length
                    const levels = new Uint8Array(packLength)
                    pack.uuIds.forEach((uuId, index) => {

                        const storageId = this._nextStorageId + index
                        const [level, globalId] = uuId.split('-').map(key => +key)
    
                        levels[index] = level
                        this.storageId_gridInfo_cache[storageId * 2 + 0] = level
                        this.storageId_gridInfo_cache[storageId * 2 + 1] = globalId
                    })

                    callback && callback([this._nextStorageId, levels, pack.vertexBuffer])
                    this._nextStorageId += packLength
                }
            },
            inverse: () => {

                for (const pack of infoPacks) {

                    this._nextStorageId -= pack.uuIds.length
                    callback && callback(null)
                }
            }
        }

        return multiSubdivideOperation
    }
}

// Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////

function lerp(a: number, b: number, t: number): number {
    return (1.0 - t) * a + t * b
}
