import getPrefix from "./prefix"
import IAPI, { AddHumanActionMeta, BaseResponse, DeleteHumanActionMeta, HumanAction, HumanActionMeta, HumanActionsMeta, SolutionMeta, SolutionMetaResponse, TerrainDataResponse, UpdateHumanActionMeta } from "./types"

const API_PREFIX = '/api/solution/'

export const createSolution: IAPI<SolutionMeta, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (solution: SolutionMeta, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + 'create'
            const response = await fetch(api, {
                method: 'POST',
                body: JSON.stringify(solution),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to create solution: ${error}`)
        }
    }
}

export const packageSolution: IAPI<string, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + 'package' + `/${node_key}`
            const response = await fetch(api, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to package solution: ${error}`)
        }
    }
}

export const deleteSolution: IAPI<string, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + `/${node_key}`
            const response = await fetch(api, { method: 'DELETE' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to delete solution: ${error}`)
        }
    }
}

export const getSolutionByNodeKey: IAPI<string, SolutionMetaResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isRemote: boolean): Promise<SolutionMetaResponse> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + `/${node_key}`
            const response = await fetch(api, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: SolutionMetaResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to get solution by node key: ${error}`)
        }
    }
}

// export const getModelTypeList: IAPI<string , BaseResponse>

export const addHumanAction: IAPI<AddHumanActionMeta, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (humanAction: AddHumanActionMeta, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + 'add_human_action'
            const response = await fetch(api, {
                method: 'POST',
                body: JSON.stringify(humanAction),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to add human action: ${error}`)
        }
    }
}

export const deleteHumanAction: IAPI<DeleteHumanActionMeta, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (params: DeleteHumanActionMeta, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + 'delete_human_action'
            const response = await fetch(api, {
                method: 'DELETE',
                body: JSON.stringify(params),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to delete human action: ${error}`)
        }
    }
}

export const getHumanActions: IAPI<string, HumanActionsMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isRemote: boolean): Promise<HumanActionsMeta> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + `get_human_actions/${node_key}`
            const response = await fetch(api, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: HumanActionsMeta = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to get human actions: ${error}`)
        }
    }
}

export const updateHumanAction: IAPI<UpdateHumanActionMeta, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (humanAction: UpdateHumanActionMeta, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + 'update_human_action'
            const response = await fetch(api, {
                method: 'PUT',
                body: JSON.stringify(humanAction),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to update human action: ${error}`)
        }
    }
}


export const getTerrainData: IAPI<string, TerrainDataResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isResource: boolean): Promise<TerrainDataResponse> => {
        try {
            const api = getPrefix(isResource) + getTerrainData.api + 'get_terrain_data/' + node_key
            const response = await fetch(api, {
                method: 'GET',
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: TerrainDataResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to get terrain data: ${error}`)
        }
    }
}
