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
          original_tif_path: rasterInfo.path,
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
  fetch: async (rasterName: string, isRemote: boolean): Promise<BaseResponse> => {
    try {
      const api = getPrefix(isRemote) + getCogTif.api + `/cog_tif/${rasterName}`
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
  fetch: async (rasterName: string, isRemote: boolean): Promise<RasterMeta> => {
    try {
      const api = getPrefix(isRemote) + getRasterMetaData.api + `/metadata/${rasterName}`
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

export const updateRasterByFeature: IAPI<UpdateRasterMeta, BaseResponse> = {
  api: `${API_PREFIX}`,
  fetch: async (updateRasterInfo: UpdateRasterMeta, isRemote: boolean): Promise<BaseResponse> => {
    try {
      const api = getPrefix(isRemote) + updateRasterByFeature.api + `/update_by_feature/${updateRasterInfo.rasterName}`
      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateRasterInfo)
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
      const { rasterName, x, y } = samplingInfo
      const api = getPrefix(isRemote) + getSamplingValue.api + `/sampling/${rasterName}/${x}/${y}`
      const response = await fetch(api, { method: 'GET' })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const { success, message } = await response.json()
      const responseData: SamplingValueMeta = { success, value: Number(message) }
      return responseData

    } catch (error) {
      throw new Error(`Failed to check patch readiness: ${error}`)
    }
  }
}
