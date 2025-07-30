import getPrefix from "./prefix";
import IAPI, { BaseResponse, CommonMeta } from "./types";

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