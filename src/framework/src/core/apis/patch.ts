import IAPI, { BaseResponse, PatchMeta } from './types'

const API_PREFIX = '/local/api/patch'

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