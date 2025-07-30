import getPrefix from './prefix'
import IAPI, { BaseResponse, GridInfo } from './types'


const API_PREFIX = '/api/grids'

export const createGrid: IAPI<{schemaName: string, gridName: string, gridInfo: GridInfo}, string> = {
    api: `${API_PREFIX}`,
    fetch: async (query: {schemaName: string, gridName: string, gridInfo: GridInfo}, isRemote: boolean): Promise<string> => {
        try {
            const {schemaName, gridName, gridInfo} = query
            const api = getPrefix(isRemote) + createGrid.api + `/${schemaName}/${gridName}`
            const response = await fetch(api, { 
                method: 'POST', 
                body: JSON.stringify(gridInfo),
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }
            
            const responseData: string = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to create grid: ${error}`)
        }
    }
}

export const deleteGrid: IAPI<{schemaName: string, gridName: string}, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (query: {schemaName: string, gridName: string}, isRemote: boolean): Promise<BaseResponse> => {
        try {
            const {schemaName, gridName} = query
            const api = getPrefix(isRemote) + deleteGrid.api + `/${schemaName}/${gridName}`
            const response = await fetch(api, { method: 'DELETE' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData
        } catch (error) {
            throw new Error(`Failed to delete grid: ${error}`)  
        }
    }
}