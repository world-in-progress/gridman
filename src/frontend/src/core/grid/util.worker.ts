import { Callback, WorkerSelf } from '../types'
import GridManager from './NHGridManager'
import { GridContext, MultiGridBaseInfo } from './types'
import * as apis from '../apis/apis'

const DELETED_FLAG = 1
const UNDELETED_FLAG = 0

type WorkerContext = WorkerSelf & Record<'gridManager', GridManager>

export function setGridManager(
    this: WorkerContext,
    context: GridContext,
    callback: Callback<any>
) {
    this.gridManager = new GridManager(context)
    callback()
}

export async function subdivideGrids(
    this: WorkerContext,
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array },
    callback: Callback<any>
) {
    const renderInfo = await apis.grid.operation.subdivideGrids.fetch(gridInfo)
    callback(null, renderInfo)
}

export async function mergeGrids(
    this: WorkerContext,
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array },
    callback: Callback<any>
) {
    const renderInfo = await apis.grid.operation.mergeGrids.fetch(gridInfo)
    callback(null, renderInfo)
}

export async function removeGrids(
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array },
    callback: Callback<any>
) {
    await apis.grid.operation.removeGrids.fetch(gridInfo)
    callback()
}

export async function recoverGrids(
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array },
    callback: Callback<any>
) {
    await apis.grid.operation.recoverGrids.fetch(gridInfo)
    callback()
}

export async function getGridInfoByFeature(
    path: string,
    callback: Callback<any>
) {
    const result = await apis.grid.operation.pickGridsByFeature.fetch(path)
    callback(null, {
        levels: result.levels,
        globalIds: result.globalIds
    })
}

export async function saveGrids(_: any, callback: Callback<any>) {
    const result = await apis.grid.operation.saveGrids.fetch()
    callback(null, result)
}

export async function getMultiGridRenderVertices(
    this: WorkerSelf & Record<"gridManager", GridManager>,
    gridInfo: MultiGridBaseInfo, 
    callback: Callback<any>
) {
    const result = this.gridManager.createStructuredGridRenderVertices(gridInfo.levels, gridInfo.globalIds)
    callback(null, result)
}

export async function getGridInfo(
    this: WorkerSelf & Record<"gridManager", GridManager>,
    _: any,
    callback: Callback<any>
) {
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

    const renderInfo = {
        levels: combinedLevels,
        globalIds: combinedGlobalIds,
        deleted: combinedDeleted,
    }
    callback(null, renderInfo);
}

// export default class GridUtils extends WorkerContext{
    // static setGridManager(
    //     this: WorkerSelf & Record<'gridManager', GridManager>,
    //     context: GridContext,
    //     callback: Callback<any>
    // ) {
    //     this.gridManager = new GridManager(context)
    //     callback()
    // }

    // static async subdivideGrids(
    //     worker: WorkerSelf & Record<"gridManager", GridManager>,
    //     gridInfo: MultiGridBaseInfo
    // ): Promise<MultiGridBaseInfo> {
    //     return await apis.grid.operation.subdivideGrids.fetch(gridInfo)
    // }

    // static async mergeGrids(
    //     worker: WorkerSelf & Record<"gridManager", GridManager>,
    //     gridInfo: MultiGridBaseInfo
    // ) {
    //     return await apis.grid.operation.mergeGrids.fetch(gridInfo)
    // }

    // static async removeGrids(gridInfo: MultiGridBaseInfo) {
    //     await apis.grid.operation.removeGrids.fetch(gridInfo)
    // }

    // static async recoverGrids(gridInfo: MultiGridBaseInfo) {
    //     await apis.grid.operation.recoverGrids.fetch(gridInfo)
    // }

    // static async getGridInfoByFeature(path: string) {
    //     return await apis.grid.operation.pickGridsByFeature.fetch(path)
    // }

    // static async saveGrids() {
    //     return await apis.grid.operation.saveGrids.fetch()
    // }

    // static getMultiGridRenderVertices(
    //     worker: WorkerSelf & Record<"gridManager", GridManager>,
    //     levels: Uint8Array, globalIds: Uint32Array
    // ): StructuredGridRenderVertices {
    //     return worker.gridManager.createStructuredGridRenderVertices(levels, globalIds)
    // }

    // static async getGridInfo(
    //     worker: WorkerSelf & Record<'gridManager', GridManager>
    // ): Promise<MultiGridBaseInfo> {
    //     const [activateInfoResponse, deletedInfoResponse] = await Promise.all([
    //         apis.grid.operation.getActivateGridInfo.fetch(),
    //         apis.grid.operation.getDeletedGridInfo.fetch()
    //     ])

    //     // Create combined levels for activate and deleted grids
    //     const combinedLevels = new Uint8Array(activateInfoResponse.levels.length + deletedInfoResponse.levels.length)
    //     combinedLevels.set(activateInfoResponse.levels, 0)
    //     combinedLevels.set(deletedInfoResponse.levels, activateInfoResponse.levels.length)

    //     // Create combined global IDs for activate and deleted grids
    //     const combinedGlobalIds = new Uint32Array(activateInfoResponse.globalIds.length + deletedInfoResponse.globalIds.length)
    //     combinedGlobalIds.set(activateInfoResponse.globalIds, 0)
    //     combinedGlobalIds.set(deletedInfoResponse.globalIds, activateInfoResponse.globalIds.length)

    //     // Create a combined deleted flags array
    //     const combinedDeleted = new Uint8Array(combinedLevels.length)
    //     combinedDeleted.fill(UNDELETED_FLAG, 0, activateInfoResponse.levels.length)
    //     combinedDeleted.fill(DELETED_FLAG, activateInfoResponse.levels.length)

    //     return {
    //         levels: combinedLevels,
    //         globalIds: combinedGlobalIds,
    //         deleted: combinedDeleted,
    //     }
    // }
// }
