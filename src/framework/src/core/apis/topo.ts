import { BaseResponse, PatchTopoStatus } from './types'
import IAPI, { GridMeta } from './types'
import { GridSaveInfo, MultiGridBaseInfo, MultiGridInfoParser } from '../grid/types'

const DELETED_FLAG = 1
const UNDELETED_FLAG = 0
const API_PREFIX = '/local/api/topo'

export const isPatchTopoReady: IAPI<void, boolean> = {
    api: `${API_PREFIX}`,
    fetch: async (): Promise<boolean> => {
        try {
            const response = await fetch(isPatchTopoReady.api, { method: 'GET' })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: PatchTopoStatus = await response.json()
            return responseData.is_ready

        } catch (error) {
            throw new Error(`Failed to check patch readiness: ${error}`)
        }
    }
}

export const setCurrentPatchTopo: IAPI<{ projectName: string, patchName: string }, void> = {
    api: `${API_PREFIX}/`,
    fetch: async (query: { projectName: string; patchName: string }): Promise<void> => {
        try {
            const { projectName, patchName } = query

            const response = await fetch(`${setCurrentPatchTopo.api}/${projectName}/${patchName}`, { method: 'GET' })
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

export const subdivideGrids: IAPI<MultiGridBaseInfo, MultiGridBaseInfo> = {
    api: `${API_PREFIX}/subdivide`,
    fetch: async (query: MultiGridBaseInfo): Promise<MultiGridBaseInfo> => {
        try {
            const buffer = MultiGridInfoParser.toBuffer(query)
            const response = await fetch(subdivideGrids.api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: buffer,
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const resBuffer = await response.arrayBuffer()
            return MultiGridInfoParser.fromBuffer(resBuffer)

        } catch (error) {
            throw new Error(`Failed to subdivide grids: ${error}`)
        }
    }
}

export const mergeGrids: IAPI<MultiGridBaseInfo, MultiGridBaseInfo> = {
    api: `${API_PREFIX}/merge`,
    fetch: async (query: MultiGridBaseInfo): Promise<MultiGridBaseInfo> => {
        try {
            const buffer = MultiGridInfoParser.toBuffer(query)
            const response = await fetch(mergeGrids.api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: buffer,
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const resBuffer = await response.arrayBuffer()
            const parentInfo = MultiGridInfoParser.fromBuffer(resBuffer)
            parentInfo.deleted = new Uint8Array(parentInfo.levels.length).fill(UNDELETED_FLAG)
            return parentInfo

        } catch (error) {
            throw new Error(`Failed to merge grids: ${error}`)
        }
    }
}

export const removeGrids: IAPI<MultiGridBaseInfo, void> = {
    api: `${API_PREFIX}/delete`,
    fetch: async (query: MultiGridBaseInfo): Promise<void> => {
        try {
            const buffer = MultiGridInfoParser.toBuffer(query)
            const response = await fetch(removeGrids.api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: buffer,
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

        } catch (error) {
            throw new Error(`Failed to remove grids: ${error}`)
        }
    }
}

export const recoverGrids: IAPI<MultiGridBaseInfo, void> = {
    api: `${API_PREFIX}/recover`,
    fetch: async (query: MultiGridBaseInfo): Promise<void> => {
        try {
            const buffer = MultiGridInfoParser.toBuffer(query)
            const response = await fetch(recoverGrids.api, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: buffer,
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
        } catch (error) {
            throw new Error(`Failed to recover grids: ${error}`)
        }
    }
}

export const pickGridsByFeature: IAPI<string, MultiGridBaseInfo> = {
    api: `${API_PREFIX}/pick`,
    fetch: async (featureDir: string): Promise<MultiGridBaseInfo> => {

        try {
            const response = await fetch(`${pickGridsByFeature.api}?feature_dir=${featureDir}`, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const buffer = await response.arrayBuffer()
            return MultiGridInfoParser.fromBuffer(buffer)

        } catch (error) {
            throw new Error(`Failed to pick grids by feature: ${error}`)
        }
    }
}

export const saveGrids: IAPI<void, GridSaveInfo> = {
    api: `${API_PREFIX}/save`,
    fetch: async (): Promise<GridSaveInfo> => {
        try {
            const response = await fetch(saveGrids.api, { method: 'GET' })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            const gridInfo = await response.json()
            return gridInfo

        } catch (error) {
            throw new Error(`Failed to save grids: ${error}`)
        }
    }
}

export const getGridMeta: IAPI<void, GridMeta> = {
    api: `${API_PREFIX}/meta`,
    fetch: async (): Promise<GridMeta> => {
        const response = await fetch(getGridMeta.api, { method: 'GET' })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const responseData: GridMeta = await response.json()
        return responseData
    }
}

export const getActivateGridInfo: IAPI<void, MultiGridBaseInfo> = {
    api: `${API_PREFIX}/activate-info`,
    fetch: async (): Promise<MultiGridBaseInfo> => {
        try {
            const response = await fetch(getActivateGridInfo.api, { method: 'GET' })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            const buffer = await response.arrayBuffer()
            return MultiGridInfoParser.fromBuffer(buffer)

        } catch (error) {
            throw new Error(`Failed to get activated grid info: ${error}`)
        }
    }
}

export const getDeletedGridInfo: IAPI<void, MultiGridBaseInfo> = {
    api: `${API_PREFIX}/deleted-info`,
    fetch: async (): Promise<MultiGridBaseInfo> => {
        try {
            const response = await fetch(getDeletedGridInfo.api, { method: 'GET' })
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            const buffer = await response.arrayBuffer()
            const deletedInfo = MultiGridInfoParser.fromBuffer(buffer)
            return deletedInfo

        } catch (error) {
            throw new Error(`Failed to get deleted grid info: ${error}`)
        }
    }
}
