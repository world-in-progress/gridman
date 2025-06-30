import * as api from '@/core/apis/apis'
import { SceneMeta } from '@/core/apis/types'
import { Callback, WorkerSelf } from '@/core/types'

export async function getSceneMeta(
    this: WorkerSelf,
    params: { node_key: string, child_start_index: number, child_end_index: number },
    callback: Callback<any>
) {
    const { node_key, child_start_index, child_end_index } = params
    try {
        const response = await api.scene.getSceneNodeInfo.fetch({ node_key, child_start_index, child_end_index }, false)
        callback(null, response as SceneMeta)
    } catch (error) {
        callback(new Error(`Failed to get scene meta: ${error}`), null)
    }
}