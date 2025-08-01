import getPrefix from "./prefix"
import IAPI, { BaseResponse, HumanAction, SolutionMeta, SolutionMetaResponse } from "./types"

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

export const addHumanAction: IAPI<HumanAction, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (humanAction: HumanAction, isRemote: boolean): Promise<BaseResponse> => {
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

// export const deleteHumanAction: IAPI<string, BaseResponse> = {