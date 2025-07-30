import getPrefix from "./prefix"
import IAPI, { BaseResponse, SolutionMeta } from "./types"

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

