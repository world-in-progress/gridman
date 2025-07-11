import IAPI from './types'
import getPrefix from './prefix'
import { GridSaveInfo, MultiGridBaseInfo, MultiGridInfoParser } from '../grid/types'

const DELETED_FLAG = 1
const UNDELETED_FLAG = 0
const API_PREFIX = '/api/topo'

export const getActivateGridInfo: IAPI<void, MultiGridBaseInfo> = {
    api: `${API_PREFIX}/activate-info`,
    fetch: async (_: void, isRemote: boolean): Promise<MultiGridBaseInfo> => {
        try {
            const api = getPrefix(isRemote) + getActivateGridInfo.api
            const response = await fetch(api, { method: 'GET' })
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
    fetch: async (_: void, isRemote: boolean): Promise<MultiGridBaseInfo> => {
        try {
            const api = getPrefix(isRemote) + getDeletedGridInfo.api
            const response = await fetch(api, { method: 'GET' })
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

export const subdivideGrids: IAPI<MultiGridBaseInfo, MultiGridBaseInfo> = {
    api: `${API_PREFIX}/subdivide`,
    fetch: async (query: MultiGridBaseInfo, isRemote: boolean): Promise<MultiGridBaseInfo> => {
        try {
            const api = getPrefix(isRemote) + subdivideGrids.api
            const buffer = MultiGridInfoParser.toBuffer(query)
            const response = await fetch(api, {
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
    fetch: async (query: MultiGridBaseInfo, isRemote: boolean): Promise<MultiGridBaseInfo> => {
        try {
            const api = getPrefix(isRemote) + mergeGrids.api
            const buffer = MultiGridInfoParser.toBuffer(query)
            const response = await fetch(api, {
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

export const deleteGrids: IAPI<MultiGridBaseInfo, void> = {
    api: `${API_PREFIX}/delete`,
    fetch: async (query: MultiGridBaseInfo, isRemote: boolean): Promise<void> => {
        try {
            const api = getPrefix(isRemote) + deleteGrids.api
            const buffer = MultiGridInfoParser.toBuffer(query)
            const response = await fetch(api, {
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
    fetch: async (query: MultiGridBaseInfo, isRemote: boolean): Promise<void> => {
        try {
            const api = getPrefix(isRemote) + recoverGrids.api
            const buffer = MultiGridInfoParser.toBuffer(query)
            const response = await fetch(api, {
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
    fetch: async (featureDir: string, isRemote: boolean): Promise<MultiGridBaseInfo> => {

        try {
            const api = getPrefix(isRemote) + pickGridsByFeature.api
            const response = await fetch(`${api}?feature_dir=${featureDir}`, { method: 'GET' })

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
    fetch: async (_: void, isRemote: boolean): Promise<GridSaveInfo> => {
        try {
            const api = getPrefix(isRemote) + saveGrids.api
            const response = await fetch(api, { method: 'GET' })
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