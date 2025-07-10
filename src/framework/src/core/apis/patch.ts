import getPrefix from './prefix'
import IAPI, { BaseResponse, PatchMeta, ResponseWithPatchMeta } from './types'

const API_PREFIX = '/local/api/patch'


// TODO：Change input param [projectName] to [SchemaName]
export const createPatch: IAPI<{ projectName: string, patchMeta: PatchMeta }, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (patchData: { projectName: string, patchMeta: PatchMeta }): Promise<BaseResponse> => {
        try {
            const { projectName, patchMeta } = patchData
            const response = await fetch(`${createPatch.api}/${projectName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(patchMeta)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to create patch: ${error}`)
        }
    }
}

export const updatePatch: IAPI<{ projectName: string, patchName: string, meta: PatchMeta }, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { projectName: string; patchName: string; meta: PatchMeta }): Promise<BaseResponse> => {
        try {
            const { projectName, patchName, meta } = query

            const response = await fetch(`${updatePatch.api}/${projectName}/${patchName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(meta)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to update patch: ${error}`)
        }
    }
}

export const getPatch: IAPI<{ schemaName: string, patchName: string}, ResponseWithPatchMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { schemaName: string, patchName: string}, isRemote: boolean): Promise<ResponseWithPatchMeta> => {
        try {
            const { schemaName, patchName } = query
            const api = getPrefix(isRemote) + getPatch.api
            const response = await fetch(`${api}/${schemaName}/${patchName}`, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const patch: ResponseWithPatchMeta = await response.json()
            return patch
        } catch (error) {
            throw new Error(`Failed to get patch: ${error}`)
        }
    }
}

export const deletePatch: IAPI<{ schemaName: string, patchName: string }, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { schemaName: string, patchName: string }, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const { schemaName, patchName } = query
            const api = getPrefix(isRemote) + deletePatch.api
            const response = await fetch(`${api}/${schemaName}/${patchName}`, { method: 'DELETE' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to delete patch: ${error}`)
        }
    }
}