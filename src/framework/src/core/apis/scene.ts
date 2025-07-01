import getPrefix from './prefix'
import IAPI, { SceneMeta } from './types'
import { ScenarioNodeDescription } from '../scenario/iscenario'

const API_PREFIX = '/api/scene'

export const getSceneNodeInfo: IAPI<{ node_key: string, child_start_index?: number, child_end_index?: number }, SceneMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { node_key: string, child_start_index?: number, child_end_index?: number }, isRemote: boolean): Promise<SceneMeta> => {
        try {
            const api = getPrefix(isRemote) + getSceneNodeInfo.api
            let url = `${api}?node_key=${query.node_key}&child_start_index=${query.child_start_index || 0}`
            if (query.child_end_index !== undefined) url += `&child_end_index=${query.child_end_index}`

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

export const getScenarioDescription: IAPI<void, ScenarioNodeDescription[]> = {
    api: `${API_PREFIX}/scenario`,
    fetch: async (params: void, isRemote: boolean): Promise<ScenarioNodeDescription[]> => {
        try {
            const api = getPrefix(isRemote) + getScenarioDescription.api
            const response = await fetch(api, { method: 'GET' })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: ScenarioNodeDescription[] = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to get scenario description: ${error}`)
        }
    }
}