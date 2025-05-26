import { Callback, WorkerSelf } from '../../../core/types'
import GridManager from '../../../core/grid/NHGridManager';
import { MultiGridRenderInfo, GridContext, MultiGridInfoParser, MultiGridBaseInfo } from '../../../core/grid/types'

const DELETED_FLAG = 1
const UNDELETED_FLAG = 0

type ReturnType = {
    err: Error | null;
    result: any;
};

type AsyncReturnType = Promise<ReturnType>;

export default class ProjectUtils {
    static async setPatch(
        projectName: string,
        patchName: string
    ): AsyncReturnType {
        const setAPI = `/api/grid/patch/${projectName}/${patchName}`;
        const pollAPI = `/api/grid/patch`;
        const metaAPI = `/api/grid/operation/meta`;

        // Step 1: Set current patch
        const response = await fetch(setAPI, { method: 'GET' });
        if (!response.ok) {
            return {
                err: new Error(`获取补丁失败! 状态码: ${response.status}`),
                result: null,
            };
        }
        // Get setting result
        const responseData = await response.json();
        if (!responseData.success)
            return {
                err: new Error(
                    `设置补丁失败! 状态码: ${responseData.message}`
                ),
                result: null,
            };

        // Step 2: Poll until patch is ready
        while (true) {
            const response = await fetch(pollAPI, { method: 'GET' });
            const isReady = (await response.json()).is_ready;
            if (isReady) break;
            setTimeout(() => {}, 1000);
        }



        // Step 3: Get patch info
        const metaResponse = await fetch(metaAPI, { method: 'GET' });
        if (!metaResponse.ok) {
            return {
                err: new Error(`获取补丁失败! 状态码: ${response.status}`),
                result: null,
            };
        }
        const metaResponseData = await metaResponse.json();
        return {
            err: null,
            result: metaResponseData,
        };
    }

    static async updatePatchDescription(
        projectName: string,
        patchName: string,
        description: string
    ): AsyncReturnType {
        const listAPI = `/api/grid/patches/${projectName}`;
        const updateAPI = `/api/grid/patch/${projectName}/${patchName}`;

        // Step 1: Get patch list
        const listResponse = await fetch(listAPI);
        if (!listResponse.ok)
            return {
                err: new Error(
                    `获取补丁列表失败! 状态码: ${listResponse.status}`
                ),
                result: null,
            };

        // Update patch description
        const listData = await listResponse.json();
        const patchToUpdate = listData.patch_metas.find(
            (patch: any) => patch.name === patchName
        );
        if (!patchToUpdate)
            return {
                err: new Error(`找不到名为 ${patchName} 的补丁`),
                result: null,
            };

        const updatedPatch = { ...patchToUpdate, description };

        // Step 2: Update patch description
        const putResponse = await fetch(updateAPI, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedPatch),
        });

        if (!putResponse.ok)
            return {
                err: new Error(
                    `更新补丁描述失败! 状态码: ${putResponse.status}`
                ),
                result: null,
            };

        const responseData = await putResponse.json();
        return {
            err: null,
            result: responseData,
        };
    }

    static async updatePatchStarred(
        projectName: string,
        patchName: string,
        starred: boolean
    ): AsyncReturnType {
        const listAPI = `/api/grid/patches/${projectName}`;
        const updateAPI = `/api/grid/patch/${projectName}/${patchName}`;

        // Step 1: Get patch list
        const listResponse = await fetch(listAPI);
        if (!listResponse.ok)
            return {
                err: new Error(
                    `获取补丁列表失败! 状态码: ${listResponse.status}`
                ),
                result: null,
            };

        // Update patch starred status
        const listData = await listResponse.json();
        const patchToUpdate = listData.patch_metas.find(
            (patch: any) => patch.name === patchName
        );
        if (!patchToUpdate)
            return {
                err: new Error(`找不到名为 ${patchName} 的补丁`),
                result: null,
            };
        const updatedPatch = { ...patchToUpdate, starred };

        // Step 2: Update patch starred status
        const putResponse = await fetch(updateAPI, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedPatch),
        });
        if (!putResponse.ok) {
            throw new Error(
                `更新补丁星标状态失败! 状态码: ${putResponse.status}`
            );
        }

        const responseData = await putResponse.json();
        return {
            err: null,
            result: responseData,
        };
    }

    static async fetchPatches(projectName: string): AsyncReturnType {
        const response = await fetch(`/api/grid/patches/${projectName}`);
        if (!response.ok) {
            throw new Error(`获取补丁列表失败! 状态码: ${response.status}`);
        }

        const responseData = await response.json();
        return {
            err: null,
            result: responseData,
        };
    }

    static async createPatch(PatchData: any): AsyncReturnType {
        const { projectName, ...patchData } = PatchData;
        const createAPI = `/api/grid/patch/${projectName}`;
        const response = await fetch(createAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(patchData),
        });
        if (!response.ok)
            return {
                err: new Error(`HTTP错误! 状态码: ${response.status}`),
                result: null,
            };

        const responseData = await response.json();
        return {
            err: null,
            result: responseData,
        };
    }

    static async getPatches(
        projectName: string,
        patchName: string
    ): AsyncReturnType {
        const getAPI = `/api/grid/patch/${projectName}/${patchName}`;
        const response = await fetch(getAPI);
        if (!response.ok)
            return {
                err: new Error(`获取补丁失败! 状态码: ${response.status}`),
                result: null,
            };

        const responseData = await response.json();
        return {
            err: null,
            result: responseData,
        };
    }

    static async deleteProject(projectName: string): AsyncReturnType {
        const deleteAPI = `/api/grid/project/${projectName}`;
        const response = await fetch(deleteAPI, { method: 'DELETE' });
        if (!response.ok) {
            return {
                err: new Error(`删除模板失败! 状态码: ${response.status}`),
                result: null,
            };
        }

        const responseData = await response.json();
        return {
            err: null,
            result: responseData,
        };
    }

    static async createProject(projectData: any): AsyncReturnType {
        const createAPI = `/api/grid/project`;
        const response = await fetch(createAPI, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData),
        });
        if (!response.ok) {
            return {
                err: new Error(`创建项目失败! 状态码: ${response.status}`),
                result: null,
            };
        }

        const responseData = await response.json();
        return {
            err: null,
            result: responseData,
        };
    }

    static async updateProjectDescription(
        projectName: string,
        description: string
    ): AsyncReturnType {
        const getAPI = `/api/grid/project/${projectName}`;
        const updateAPI = `/api/grid/project/${projectName}`;

        // Step 1: Get project
        const response = await fetch(getAPI);
        if (!response.ok) {
            return {
                err: new Error(`获取项目失败! 状态码: ${response.status}`),
                result: null,
            };
        }

        // Update project description
        const responseData = await response.json();
        let projectData;
        if (responseData.project_meta) {
            projectData = { ...responseData.project_meta };
        } else {
            projectData = { ...responseData };
        }
        projectData.description = description;

        // Step 2: Update project description
        const putResponse = await fetch(updateAPI, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData),
        });
        if (!putResponse.ok) {
            return {
                err: new Error(
                    `更新项目描述失败! 状态码: ${putResponse.status}`
                ),
                result: null,
            };
        }

        const updatedData = await putResponse.json();
        return {
            err: null,
            result: updatedData,
        };
    }

    static async updateProjectStarred(
        projectName: string,
        starred: boolean
    ): AsyncReturnType {
        const getAPI = `/api/grid/project/${projectName}`;
        const updateAPI = `/api/grid/project/${projectName}`;

        // Step 1: Get project
        const response = await fetch(getAPI);
        if (!response.ok) {
            return {
                err: new Error(`获取项目失败! 状态码: ${response.status}`),
                result: null,
            };
        }

        // Update project starred status
        const responseData = await response.json();
        let projectData;
        if (responseData.project_meta) {
            projectData = { ...responseData.project_meta };
        } else {
            projectData = { ...responseData };
        }
        projectData.starred = starred;

        // Step 2: Update project starred status
        const putResponse = await fetch(updateAPI, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData),
        });
        if (!putResponse.ok) {
            return {
                err: new Error(
                    `更新项目星标状态失败! 状态码: ${putResponse.status}`
                ),
                result: null,
            };
        }

        const updatedData = await putResponse.json();
        return {
            err: null,
            result: updatedData,
        };
    }

    static async getProjectByName(projectName: string): AsyncReturnType {
        const getAPI = `/api/grid/project/${projectName}`;
        const response = await fetch(getAPI);
        if (!response.ok) {
            return {
                err: new Error(`获取项目失败! 状态码: ${response.status}`),
                result: null,
            };
        }

        const responseData = await response.json();
        return {
            err: null,
            result: responseData,
        };
    }

    static async fetchProjects(
        startIndex: number,
        endIndex: number
    ): AsyncReturnType {
        const getAPI = `/api/grid/projects/?startIndex=${startIndex}&endIndex=${endIndex}`;
        const numAPI = `/api/grid/projects/num`;

        // Step 1: Get projects
        const response = await fetch(getAPI);
        if (!response.ok) {
            return {
                err: new Error(`获取项目列表失败! 状态码: ${response.status}`),
                result: null,
            };
        }

        const responseData = await response.json();

        // Step 2: Get number of projects
        const numResponse = await fetch(numAPI);
        if (numResponse.ok) {
            const countText = await numResponse.text();
            const countData = JSON.parse(countText);
            if (typeof countData.count === 'number') {
                responseData.total_count = countData.count;
            } else if (typeof countData === 'number') {
                responseData.total_count = countData;
            } else if (countData && typeof countData.total === 'number') {
                responseData.total_count = countData.total;
            } else {
                const possibleCountFields = Object.entries(countData).find(
                    ([key, value]) =>
                        typeof value === 'number' &&
                        (key.includes('count') ||
                            key.includes('total') ||
                            key.includes('num'))
                );
                if (possibleCountFields) {
                    responseData.total_count = possibleCountFields[1] as number;
                } else {
                    const numericValue = parseInt(countText.trim(), 10);
                    if (!isNaN(numericValue)) {
                        responseData.total_count = numericValue;
                    } else {
                        responseData.total_count =
                            responseData.project_metas.length;
                    }
                }
            }
        } else {
            responseData.total_count = responseData.project_metas.length;
        }
        if (responseData.total_count < responseData.project_metas.length) {
            responseData.total_count = responseData.project_metas.length;
        }

        return {
            err: null,
            result: responseData,
        };
    }

    static setGridManager(
        worker: WorkerSelf & Record<'gridManager', GridManager>,
        context: GridContext
    ) {
        worker.gridManager = new GridManager(context);
    }

    static async getGridInfo(
        worker: WorkerSelf & Record<'gridManager', GridManager>
    ): Promise<MultiGridBaseInfo> {
        const activateInfoAPI = '/api/grid/operation/activate-info'
        const deletedInfoAPI = '/api/grid/operation/deleted-info'
        const [activateInfoResponse, deletedInfoResponse] = await Promise.all([
            MultiGridInfoParser.fromGetUrl(activateInfoAPI),
            MultiGridInfoParser.fromGetUrl(deletedInfoAPI)
        ]);

        // Create combined levels for activate and deleted grids
        const combinedLevels = new Uint8Array(activateInfoResponse.levels.length + deletedInfoResponse.levels.length);
        combinedLevels.set(activateInfoResponse.levels, 0);
        combinedLevels.set(deletedInfoResponse.levels, activateInfoResponse.levels.length);

        // // Create combined global IDs for activate and deleted grids
        const combinedGlobalIds = new Uint32Array(activateInfoResponse.globalIds.length + deletedInfoResponse.globalIds.length);
        combinedGlobalIds.set(activateInfoResponse.globalIds, 0);
        combinedGlobalIds.set(deletedInfoResponse.globalIds, activateInfoResponse.globalIds.length);
        
        // // Create combined vertices for activate and deleted grids
        // const combinedVertices = worker.gridManager.createMultiGridRenderVertices(combinedLevels, combinedGlobalIds);

        // // Create a combined deleted flags array
        const combinedDeleted = new Uint8Array(combinedLevels.length);
        combinedDeleted.fill(UNDELETED_FLAG, 0, activateInfoResponse.levels.length);
        combinedDeleted.fill(DELETED_FLAG, activateInfoResponse.levels.length);

        return {
            levels: combinedLevels,
            globalIds: combinedGlobalIds,
            deleted: combinedDeleted,
        }

        // return {
        //     levels: combinedLevels,
        //     globalIds: combinedGlobalIds,
        //     vertices: combinedVertices[0],
        //     verticesLow: combinedVertices[1],
        //     deleted: combinedDeleted,
        // }
    }
}


