import getPrefix from './prefix'
import IAPI, { BaseResponse, CreateRasterMeta, RasterMeta, UpdateRasterMeta, SamplingMeta, SamplingValueMeta } from './types'

const API_PREFIX = '/api/raster'

export const createRaster: IAPI<CreateRasterMeta, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (rasterInfo: CreateRasterMeta, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + createRaster.api + '/create'
            const response = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: rasterInfo.name,
                    type: rasterInfo.type,
                    original_tif_path: rasterInfo.original_tif_path,
                })
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to check patch readiness: ${error}`)
        }
    }
}

export const getCogTif: IAPI<string, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + getCogTif.api + `/cog_tif/${node_key}`
            const response = await fetch(api, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to check patch readiness: ${error}`)
        }
    }
}

export const getRasterMetaData: IAPI<string, RasterMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isRemote: boolean): Promise<RasterMeta> => {
        try {
            const api = getPrefix(isRemote) + getRasterMetaData.api + `/metadata/${node_key}`
            const response = await fetch(api, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: RasterMeta = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to check patch readiness: ${error}`)
        }
    }
}

export const updateRasterByFeature: IAPI<{ node_key: string, updateRasterMeta: UpdateRasterMeta }, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { node_key: string, updateRasterMeta: UpdateRasterMeta }, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + updateRasterByFeature.api + `/update_by_features/${query.node_key}`
            const response = await fetch(api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(query.updateRasterMeta)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to check patch readiness: ${error}`)
        }
    }
}

export const getSamplingValue: IAPI<SamplingMeta, SamplingValueMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (samplingInfo: SamplingMeta, isRemote: boolean): Promise<SamplingValueMeta> => {
        try {
            const { node_key, x, y, epsg } = samplingInfo
            const api = getPrefix(isRemote) + getSamplingValue.api + `/sampling/${node_key}/${x}/${y}/${epsg}`
            const response = await fetch(api, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const { success, message, data } = await response.json()
            const responseData: SamplingValueMeta = { success, message, data }
            return responseData

        } catch (error) {
            throw new Error(`Failed to check pixel value: ${error}`)
        }
    }
}

export const getTileUrl = (isRemote: boolean, node_key: string, encoding: string, timeStamp: string) => {
    return getPrefix(isRemote) + `${API_PREFIX}/tile/${node_key}/${encoding}/${timeStamp}/{z}/{x}/{y}.png`
}

export const deleteRaster: IAPI<string, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (node_key: string, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const api = getPrefix(isRemote) + deleteRaster.api + `/${node_key}`
            const response = await fetch(api, { method: 'DELETE' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to delete raster: ${error}`)
        }
    }
}