import { WorkerSelf } from '../types'
import GridManager from './NHGridManager'
import { GridContext, MultiGridBaseInfo, MultiGridInfoParser, StructuredGridRenderVertices } from './types'
import * as apis from '../apis/apis'

const DELETED_FLAG = 1
const UNDELETED_FLAG = 0

export default class GridUtils {
    static async subdivideGrids(
        worker: WorkerSelf & Record<"gridManager", GridManager>,
        gridInfo: MultiGridBaseInfo
    ): Promise<MultiGridBaseInfo> {
        return await apis.grid.operation.subdivideGrids.fetch(gridInfo)
    }

    static async mergeGrids(
        worker: WorkerSelf & Record<"gridManager", GridManager>,
        gridInfo: MultiGridBaseInfo
    ) {
        return await apis.grid.operation.mergeGrids.fetch(gridInfo)
    }

    static async removeGrids(gridInfo: MultiGridBaseInfo) {
        await apis.grid.operation.removeGrids.fetch(gridInfo)
    }

    static async recoverGrids(gridInfo: MultiGridBaseInfo) {
        await apis.grid.operation.recoverGrids.fetch(gridInfo)
    }

    static async getGridInfoByFeature(path: string) {
        return await apis.grid.operation.pickGridsByFeature.fetch(path)
    }

    static async saveGrids() {
        return await apis.grid.operation.saveGrids.fetch()
    }

    static getMultiGridRenderVertices(
        worker: WorkerSelf & Record<"gridManager", GridManager>,
        levels: Uint8Array, globalIds: Uint32Array
    ): StructuredGridRenderVertices {
        return worker.gridManager.createStructuredGridRenderVertices(levels, globalIds)
    }

    static setGridManager(
        worker: WorkerSelf & Record<'gridManager', GridManager>,
        context: GridContext
    ) {
        worker.gridManager = new GridManager(context)
    }

    static async getGridInfo(
        worker: WorkerSelf & Record<'gridManager', GridManager>
    ): Promise<MultiGridBaseInfo> {
        const [activateInfoResponse, deletedInfoResponse] = await Promise.all([
            apis.grid.operation.getActivateGridInfo.fetch(),
            apis.grid.operation.getDeletedGridInfo.fetch()
        ])

        // Create combined levels for activate and deleted grids
        const combinedLevels = new Uint8Array(activateInfoResponse.levels.length + deletedInfoResponse.levels.length)
        combinedLevels.set(activateInfoResponse.levels, 0)
        combinedLevels.set(deletedInfoResponse.levels, activateInfoResponse.levels.length)

        // Create combined global IDs for activate and deleted grids
        const combinedGlobalIds = new Uint32Array(activateInfoResponse.globalIds.length + deletedInfoResponse.globalIds.length)
        combinedGlobalIds.set(activateInfoResponse.globalIds, 0)
        combinedGlobalIds.set(deletedInfoResponse.globalIds, activateInfoResponse.globalIds.length)

        // Create a combined deleted flags array
        const combinedDeleted = new Uint8Array(combinedLevels.length)
        combinedDeleted.fill(UNDELETED_FLAG, 0, activateInfoResponse.levels.length)
        combinedDeleted.fill(DELETED_FLAG, activateInfoResponse.levels.length)

        return {
            levels: combinedLevels,
            globalIds: combinedGlobalIds,
            deleted: combinedDeleted,
        }
    }
}
