import * as api from '@/core/apis/apis'
import { PatchMeta } from '@/core/apis/types'
import { MultiProjectMeta } from '../types/types'

type ReturnType = {
    err: Error | null
    result: any
}

type AsyncReturnType = Promise<ReturnType>;

export default class ProjectUtils {
    static async setPatch(
        projectName: string,
        patchName: string
    ): AsyncReturnType {
        try {
            // Step 1: Set current patch
            await api.grid.patch.setCurrentPatch.fetch({ projectName, patchName })

            // Step 2: Poll until patch is ready
            while (true) {
                const isReady = await api.grid.patch.isPatchReady.fetch()
                if (isReady) break
                setTimeout(() => {}, 1000)
            }

            // Step 3: Get patch info
            const patchMeta = await api.grid.operation.getGridMeta.fetch()
            return {
                err: null,
                result: patchMeta,
            }

        } catch (error) {
            return {
                err: new Error(`设置补丁失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async createPatch(PatchData: { projectName: string, patchMeta: PatchMeta }): AsyncReturnType {
        try {
            const response = await api.grid.patch.createPatch.fetch(PatchData)
            return {
                err: null,
                result: response,
            }

        } catch (error) {
            return {
                err: new Error(`创建补丁失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async updatePatchDescription(
        projectName: string,
        patchName: string,
        description: string
    ): AsyncReturnType {
        try {
            // Step 1: Get patch list
            const multiPatchMeta = await api.grid.patches.getMultiPatchMeta.fetch(projectName)

            // Step 2: Find the patch to update
            if (!multiPatchMeta.patch_metas) {
                throw new Error(
                    `补丁列表为空`
                )
            }
            const patchToUpdate = multiPatchMeta.patch_metas.find(
                patch => patch.name === patchName
            )
            if (!patchToUpdate) {
                throw new Error(`找不到名为 ${patchName} 的补丁`)
            }

            // Step 2: Update patch description
            patchToUpdate.description = description
            const response = await api.grid.patch.updatePatch.fetch({
                projectName,
                patchName,
                meta: patchToUpdate,
            })
            return {
                err: null,
                result: response,
            }

        } catch (error) {
            return {
                err: new Error(`更新补丁描述失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async updatePatchStarred(
        projectName: string,
        patchName: string,
        starred: boolean
    ): AsyncReturnType {
        try {
            // Step 1: Get patch list
            const multiPatchMeta = await api.grid.patches.getMultiPatchMeta.fetch(projectName)

            // Step 2: Find the patch to update
            if (!multiPatchMeta.patch_metas) {
                throw new Error(
                    `补丁列表为空`
                )
            }
            const patchToUpdate = multiPatchMeta.patch_metas.find(
                patch => patch.name === patchName
            )
            if (!patchToUpdate) {
                throw new Error(`找不到名为 ${patchName} 的补丁`)
            }

            // Step 2: Update patch starred status
            patchToUpdate.starred = starred
            const response = await api.grid.patch.updatePatch.fetch({
                projectName,
                patchName,
                meta: patchToUpdate,
            })
            return {
                err: null,
                result: response,
            }

        } catch (error) {
            return {
                err: new Error(`更新补丁星标状态失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async fetchPatches(projectName: string): AsyncReturnType {
        try {
            const multiPatchMeta = await api.grid.patches.getMultiPatchMeta.fetch(projectName)
            if (!multiPatchMeta.patch_metas) {
                return {
                    err: new Error(`补丁列表为空`),
                    result: null,
                }
            }
            return {
                err: null,
                result: multiPatchMeta,
            }

        } catch (error) {
            return {
                err: new Error(`获取补丁列表失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async createProject(projectData: any): AsyncReturnType {
        try {
            const response = await api.grid.project.createProject.fetch(projectData)
            return {
                err: null,
                result: response,
            }
        } catch (error) {
            return {
                err: new Error(`创建项目失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async getProjectByName(projectName: string): AsyncReturnType {
        try {
            const response = await api.grid.project.getProject.fetch(projectName)
            if (response.project_meta === null || response.project_meta === undefined) {
                throw new Error(
                    `项目 ${projectName} 不存在或未找到`
                )
            }
            return {
                err: null,
                result: response,
            }
        } catch (error) {
            return {
                err: new Error(`获取项目失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async updateProjectDescription(
        projectName: string,
        description: string
    ): AsyncReturnType {
        try {
            // Step 1: Get project
            const projectMeta = (await api.grid.project.getProject.fetch(projectName)).project_meta
            if (!projectMeta) {
                throw new Error(`项目 ${projectName} 不存在或未找到`);
            }

            // Step 2: Update project description
            projectMeta.description = description

            // Step 3: Update project
            const response = await api.grid.project.updateProject.fetch({
                projectName,
                projectMeta,
            })
            return {
                err: null,
                result: response,
            }

        } catch (error) {
            return {
                err: new Error(`更新项目描述失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async updateProjectStarred(
        projectName: string,
        starred: boolean
    ): AsyncReturnType {
        try {
            // Step 1: Get project
            const projectMeta = (await api.grid.project.getProject.fetch(projectName)).project_meta
            if (!projectMeta) {
                throw new Error(`项目 ${projectName} 不存在或未找到`);
            }

            // Step 2: Update project starred status
            projectMeta.starred = starred

            // Step 3: Update project
            const response = await api.grid.project.updateProject.fetch({
                projectName,
                projectMeta,
            })
            return {
                err: null,
                result: response,
            }

        } catch (error) {
            return {
                err: new Error(`更新项目星标状态失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async deleteProject(projectName: string): AsyncReturnType {
        try {
            const response = await api.grid.project.deleteProject.fetch(projectName)
            return {
                err: null,
                result: response,
            }
        } catch (error) {
            return {
                err: new Error(`删除项目失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }

    static async fetchProjects(
        startIndex: number,
        endIndex: number
    ): AsyncReturnType {
        try {
            // Step 1: Get number of projects
            const numResponse = (await api.grid.projects.getProjectsNum.fetch()).number
            
            // Step 2: Get multi-project meta
            const response = await api.grid.projects.getMultiProjectMeta.fetch({ startIndex, endIndex })

            return {
                err: null,
                result: {
                    project_metas: response.project_metas,
                    total_count: numResponse,
                } as MultiProjectMeta
            }
        } catch (error) {
            return {
                err: new Error(`获取项目列表失败! 错误信息: ${error}`),
                result: null,
            }
        }
    }
}


