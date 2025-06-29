import IAPI, { MultiPatchMeta } from './types'

const API_PREFIX = '/local/api/patches'

export const getMultiPatchMeta: IAPI<string, MultiPatchMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (projectName: string): Promise<MultiPatchMeta> => {
        try {
            const response = await fetch(`${getMultiPatchMeta.api}/${projectName}`, { method: 'GET' })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: MultiPatchMeta = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to get patch list: ${error}`)
        }
    }
}