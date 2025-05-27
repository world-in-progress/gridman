import IAPI, { BaseResponse, PatchMeta, PatchStatus } from '../types'

const API_PREFIX = '/api/grid/patch'

export const setCurrentPatch: IAPI<{ projectName: string, patchName: string }, void> = {
    api: `${API_PREFIX}/`,
    fetch: async (query: { projectName: string; patchName: string }): Promise<void> => {
        try {
            const { projectName, patchName } = query

            const response = await fetch(`${setCurrentPatch.api}/${projectName}/${patchName}`, { method: 'GET' })
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

export const isPatchReady: IAPI<void, boolean> = {
    api: `${API_PREFIX}`,
    fetch: async (): Promise<boolean> => {
        try {
            const response = await fetch(isPatchReady.api, { method: 'GET' })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: PatchStatus = await response.json()
            return responseData.is_ready

        } catch (error) {
            throw new Error(`Failed to check patch readiness: ${error}`)
        }
    }
}

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