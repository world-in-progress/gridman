import IAPI, { ResponseWithProjectMeta } from '@/core/apis/types'
import { BaseResponse, ProjectMeta } from './types'

const API_PREFIX = '/local/api/project'

export const createProject: IAPI<ProjectMeta, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (projectMeta: ProjectMeta): Promise<BaseResponse> => {
        try {
            const response = await fetch(createProject.api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectMeta)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to create project: ${error}`)
        }
    }
}

export const getProject: IAPI<string, ResponseWithProjectMeta> = {
    api: `${API_PREFIX}`,
    fetch: async (projectName: string): Promise<ResponseWithProjectMeta> => {
        try {
            const response = await fetch(`${getProject.api}/${projectName}`, { method: 'GET' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: ResponseWithProjectMeta = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to get project: ${error}`)
        }
    }
}

export const updateProject: IAPI<{ projectName: string, projectMeta: ProjectMeta }, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (query: { projectName: string; projectMeta: ProjectMeta }): Promise<BaseResponse> => {
        try {
            const { projectName, projectMeta } = query
            const response = await fetch(`${updateProject.api}/${projectName}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectMeta)
            })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to update project: ${error}`)
        }
    }
}

export const deleteProject: IAPI<string, BaseResponse> = {
    api: `${API_PREFIX}`,
    fetch: async (projectName: string): Promise<BaseResponse> => {
        try {
            const response = await fetch(`${deleteProject.api}/${projectName}`, { method: 'DELETE' })

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`)
            }

            const responseData: BaseResponse = await response.json()
            return responseData

        } catch (error) {
            throw new Error(`Failed to delete project: ${error}`)
        }
    }
}
