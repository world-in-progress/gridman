import IAPI, { SceneMeta } from './types'

const API_PREFIX = '/server/api/scene'

export const getSceneMeta: IAPI<{ node_key: string, child_start_index: number, child_end_index: number }, SceneMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { node_key: string, child_start_index: number, child_end_index: number }): Promise<SceneMeta> => {
        try {
            const url = `${getSceneMeta.api}?node_key=${query.node_key}&child_start_index=${query.child_start_index}&child_end_index=${query.child_end_index}`
            const response = await fetch(url, { method: "GET" })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: SceneMeta = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to get scene meta: ${error}`)
        }
    }
}