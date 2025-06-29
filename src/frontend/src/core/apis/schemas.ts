import IAPI, { MultiGridSchema, ResponseWithNum } from './types'

const API_PREFIX = '/local/api/schemas'

export const getSchemas: IAPI<{ startIndex: number, endIndex: number }, MultiGridSchema> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { startIndex: number, endIndex: number }): Promise<MultiGridSchema> => {
        try {
            const response = await fetch(`${getSchemas.api}?startIndex=${query.startIndex}&endIndex=${query.endIndex}`, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const schemas: MultiGridSchema = await response.json()
            return schemas

        } catch (error) {
            throw new Error(`Failed to get schemas: ${error}`)
        }
    }
}

export const getSchemasNum: IAPI<void, ResponseWithNum> = {
    api: `${API_PREFIX}/num`,
    fetch: async (): Promise<ResponseWithNum> => {
        try {
            const response = await fetch(getSchemasNum.api, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: ResponseWithNum = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to get schemas number: ${error}`)
        }
    }
}