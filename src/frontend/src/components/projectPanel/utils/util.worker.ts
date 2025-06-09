import * as api from '@/core/apis/apis'
import { MultiProjectMeta } from '../types/types'
import { Callback, WorkerSelf } from '@/core/types'

export async function fetchProjects(
    this: WorkerSelf,
    params: { startIndex: number; endIndex: number },
    callback: Callback<any>
) {
    const { startIndex, endIndex } = params
    try {
        // Step 1: Get number of projects
        const numResponse = (await api.projects.getProjectsNum.fetch()).number
        
        // Step 2: Get multi-project meta
        const response = await api.projects.getMultiProjectMeta.fetch({ startIndex, endIndex })

        callback(
            null,
            {
                project_metas: response.project_metas,
                total_count: numResponse,
            } as MultiProjectMeta
        )
    } catch (error) {
        callback(new Error(`获取项目列表失败! 错误信息: ${error}`), null)
    }
}

export async function getProjectByName(
    this: WorkerSelf,
    projectName: string,
    callback: Callback<any>
) {
    try {
        const response = await api.project.getProject.fetch(projectName)
        if (response.project_meta === null || response.project_meta === undefined) {
            throw new Error(
                `项目 ${projectName} 不存在或未找到`
            )
        }
        callback(null, response)
    } catch (error) {
        callback(new Error(`获取项目失败! 错误信息: ${error}`), null)
    }
}

export async function updateProjectStarred(
    this: WorkerSelf,
    params: { name: string; starred: boolean },
    callback: Callback<any>
) {
    const { name: projectName, starred } = params;
    try {
        // Step 1: Get project
        const projectMeta = (await api.project.getProject.fetch(projectName)).project_meta
        if (!projectMeta) {
            throw new Error(`项目 ${projectName} 不存在或未找到`)
        }

        // Step 2: Update project starred status
        projectMeta.starred = starred

        // Step 3: Update project
        const response = await api.project.updateProject.fetch({
            projectName,
            projectMeta,
        })
        callback(null, response)

    } catch (error) {
        callback(new Error(`更新项目星标状态失败! 错误信息: ${error}`), null)
    }
}

export async function updateProjectDescription(
    this: WorkerSelf,
    params: { name: string; description: string },
    callback: Callback<any>
) {
    const { name: projectName, description } = params;
    try {
        // Step 1: Get project
        const projectMeta = (await api.project.getProject.fetch(projectName)).project_meta
        if (!projectMeta) {
            throw new Error(`项目 ${projectName} 不存在或未找到`)
        }

        // Step 2: Update project description
        projectMeta.description = description

        // Step 3: Update project
        const response = await api.project.updateProject.fetch({
            projectName,
            projectMeta,
        })
        callback(null, response)

    } catch (error) {
        callback(new Error(`更新项目描述失败! 错误信息: ${error}`), null)
    }
}

export async function createProject(
    this: WorkerSelf,
    projectData: any,
    callback: Callback<any>
) {
    try {
        const response = await api.project.createProject.fetch(projectData)
        callback(null, response)

    } catch (error) {
        callback(new Error(`创建项目失败! 错误信息: ${error}`), null)
    }
}

export async function deleteProject(
    this: WorkerSelf,
    projectName: string,
    callback: Callback<any>
) {
    try {
        const response = await api.project.deleteProject.fetch(projectName)
        callback(null, response)

    } catch (error) {
        callback(new Error(`删除项目失败! 错误信息: ${error}`), null)
    }
}

export async function fetchPatches(
    this: WorkerSelf,
    params: { projectName: string },
    callback: Callback<any>
) {
    const { projectName } = params
    try {
        const multiPatchMeta = await api.patches.getMultiPatchMeta.fetch(projectName)
        if (!multiPatchMeta.patch_metas) {
            callback(new Error(`补丁列表为空`), null)
        }
        
        callback(null, multiPatchMeta)

    } catch (error) {
        callback(new Error(`获取补丁列表失败! 错误信息: ${error}`), null)
    }
}

export async function createPatch(
    this: WorkerSelf,
    PatchData: any,
    callback: Callback<any>
) {
    try {
        const response = await api.patch.createPatch.fetch(PatchData)
        callback(null, response)

    } catch (error) {
        callback(new Error(`创建补丁失败! 错误信息: ${error}`), null)
    }
}

export async function updatePatchStarred(
    this: WorkerSelf,
    params: { projectName: string; patchName: string; starred: boolean },
    callback: Callback<any>
) {
    const { projectName, patchName, starred } = params
    try {
        // Step 1: Get patch list
        const multiPatchMeta = await api.patches.getMultiPatchMeta.fetch(projectName)

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
        const response = await api.patch.updatePatch.fetch({
            projectName,
            patchName,
            meta: patchToUpdate,
        })
        callback(null, response)

    } catch (error) {
        callback(new Error(`更新补丁星标状态失败! 错误信息: ${error}`), null)
    }
}

export async function updatePatchDescription(
    this: WorkerSelf,
    params: { projectName: string; patchName: string; description: string },
    callback: Callback<any>
) {
    const { projectName, patchName, description } = params
    try {
        // Step 1: Get patch list
        const multiPatchMeta = await api.patches.getMultiPatchMeta.fetch(projectName)

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
        const response = await api.patch.updatePatch.fetch({
            projectName,
            patchName,
            meta: patchToUpdate,
        })
        callback(null, response)

    } catch (error) {
        callback(new Error(`更新补丁描述失败! 错误信息: ${error}`), null)
    }
}

export async function setPatch(
    this: WorkerSelf,
    {
        projectName,
        patchName,
    }: { projectName: string; patchName: string },
    callback: Callback<any>
) {
    try {
        // Step 1: Set current patch
        await api.topo.setCurrentPatchTopo.fetch({ projectName, patchName })

        // Step 2: Poll until patch is ready
        while (true) {
            const isReady = await api.topo.isPatchTopoReady.fetch()
            if (isReady) break
            setTimeout(() => {}, 1000)
        }

        // Step 3: Get patch info
        const patchMeta = await api.topo.getGridMeta.fetch()
        callback(null, patchMeta)

    } catch (error) {
        callback(new Error(`设置补丁失败! 错误信息: ${error}`), null)
    }
}
