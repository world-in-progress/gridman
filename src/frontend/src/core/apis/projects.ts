import IAPI, { ResponseWithMultiProjectMeta, ResponseWithNum, ResponseWithProjectMeta } from '@/core/apis/types'

const API_PREFIX = '/local/api/projects'

export const getProjectsNum: IAPI<void, ResponseWithNum> = {
    api: `${API_PREFIX}/num`,
    fetch: async (): Promise<ResponseWithNum> => {
        try {
            const response = await fetch(getProjectsNum.api, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: ResponseWithNum = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to get projects number: ${error}`)
        }
    }
}

export const getMultiProjectMeta: IAPI<{ startIndex: number, endIndex: number }, ResponseWithMultiProjectMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { startIndex: number, endIndex: number }): Promise<ResponseWithMultiProjectMeta> => {
        try {
            const response = await fetch(`${getMultiProjectMeta.api}?startIndex=${query.startIndex}&endIndex=${query.endIndex}`, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: ResponseWithMultiProjectMeta = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to get project list: ${error}`)
        }
    }
}
