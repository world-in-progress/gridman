import GridManager from '../grid/NHGridManager'
import { Callback, WorkerSelf } from '../types'

export async function parseTopology(
    this: WorkerSelf & Record<"nodeManager", GridManager>,
    storageId_gridInfo_cache: Array<number>,
    callback: Callback<any>
) {
    callback(null, this.nodeManager.parseTopology(storageId_gridInfo_cache))
}

export async function calcEdgeRenderInfos(
    this: WorkerSelf & Record<"nodeManager", GridManager>,
    edgeInfos: { index: number; keys: string[] },
    callback: Callback<any>
) {
    const { index: actorIndex, keys: edgeKeys } = edgeInfos;
    callback(null, {
    actorIndex,
    vertexBuffer: this.nodeManager.getEdgeRenderInfos(edgeKeys),
    })
}
