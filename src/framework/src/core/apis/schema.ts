import IAPI, { BaseResponse, ProjectSchema, ResponseWithProjectSchema } from './types'

const API_PREFIX = '/server/api/schema'

export const createSchema: IAPI<ProjectSchema, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (schema: ProjectSchema): Promise<BaseResponse> => {
        try {
            const response = await fetch(createSchema.api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(schema)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to create schema: ${error}`)
        }
    }
}

export const getSchema: IAPI<string, ResponseWithProjectSchema> = {
    api: `${API_PREFIX}`,
    fetch: async (schemaName: string): Promise<ResponseWithProjectSchema> => {
        try {
            const response = await fetch(`${getSchema.api}/${schemaName}`, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const schema: ResponseWithProjectSchema = await response.json()
            return schema

        } catch (error) {
            throw new Error(`Failed to get schema: ${error}`)
        }
    }
}

export const updateSchema: IAPI<{ schemaName: string, schema: ProjectSchema }, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { schemaName: string; schema: ProjectSchema }): Promise<BaseResponse> => {
        try {
            const { schemaName, schema } = query
            const response = await fetch(`${updateSchema.api}/${schemaName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(schema)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to update schema: ${error}`)
        }
    }
}

export const deleteSchema: IAPI<string, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (schemaName: string): Promise<BaseResponse> => {
        try {
            const response = await fetch(`${deleteSchema.api}/${schemaName}`, { method: 'DELETE' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to delete schema: ${error}`)
        }
    }
}
