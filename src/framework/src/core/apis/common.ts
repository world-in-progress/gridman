import getPrefix from "./prefix";
import IAPI, { BaseResponse, CommonData, CommonMeta } from "./types";

const API_PREFIX = '/api/common/'

export const createCommon: IAPI<CommonMeta, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (commonData: CommonMeta, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + 'create_common'
            const response = await fetch(api, {
                method: 'POST',
                body: JSON.stringify(commonData),
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
            throw new Error(`Failed to create common: ${error}`)
        }
    }
}

export const getCommonData: IAPI<string, CommonData> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isRemote: boolean): Promise<CommonData> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + `get_data/${node_key}`
            const response = await fetch(api, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: CommonData = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to get common data: ${error}`)
        }
    }
}

export const deleteCommonData: IAPI<string, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + API_PREFIX + `delete/${node_key}`
            const response = await fetch(api, { method: 'DELETE' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to delete common data: ${error}`)
        }
    }
}