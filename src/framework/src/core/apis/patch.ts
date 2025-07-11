import getPrefix from './prefix'
import IAPI, { BaseResponse, CRMStatus, GridMeta, PatchMeta } from './types'

const API_PREFIX = '/api/patch'

export const checkPatchReady: IAPI<void, boolean> = {
    api: `${API_PREFIX}`,
    fetch: async (_: void, isRemote: boolean): Promise<boolean> => {
        try {
            const api = getPrefix(isRemote) + checkPatchReady.api
            const response = await fetch(api, { method: 'GET' })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: CRMStatus = await response.json()
            return responseData.is_ready

        } catch (error) {
            throw new Error(`Failed to check patch readiness: ${error}`)
        }
    }
}

export const setPatch: IAPI<{ schemaName: string, patchName: string }, void> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { schemaName: string, patchName: string }, isRemote: boolean): Promise<void> => {
        try {
            const { schemaName, patchName } = query
            const api = getPrefix(isRemote) + setPatch.api + `/${schemaName}/${patchName}`
            const response = await fetch(api, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            if (!responseData.success) {
                throw new Error(`Failed to set current patch: ${responseData.message}`)
            }

        } catch (error) {
            throw new Error(`Failed to set current patch: ${error}`)
        }
    }
}

export const getPatchMeta: IAPI<{ schemaName: string, patchName: string}, GridMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { schemaName: string, patchName: string}, isRemote: boolean): Promise<GridMeta> => {
        try {
            const { schemaName, patchName } = query
            const api = getPrefix(isRemote) + getPatchMeta.api + `/${schemaName}/${patchName}/meta`
            const response = await fetch(api, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const patchMeta: GridMeta = await response.json()
            return patchMeta
        } catch (error) {
            throw new Error(`Failed to get patch: ${error}`)
        }
    }
}

export const createPatch: IAPI<{schemaName: string, patchMeta: PatchMeta}, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (query: {schemaName: string, patchMeta: PatchMeta}, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const {schemaName, patchMeta} = query
            const api = getPrefix(isRemote) + createPatch.api + `/${schemaName}`
            const response = await fetch(api, {
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

export const updatePatch: IAPI<{ schemaName: string, patchName: string, meta: PatchMeta }, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { schemaName: string; patchName: string; meta: PatchMeta }, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const { schemaName, patchName, meta } = query
            const api = getPrefix(isRemote) + updatePatch.api + `/${schemaName}/${patchName}`
            const response = await fetch(api, {
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

export const deletePatch: IAPI<{ schemaName: string, patchName: string }, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { schemaName: string, patchName: string }, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const { schemaName, patchName } = query
            const api = getPrefix(isRemote) + deletePatch.api + `/${schemaName}/${patchName}`
            const response = await fetch(api, { method: 'DELETE' })

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