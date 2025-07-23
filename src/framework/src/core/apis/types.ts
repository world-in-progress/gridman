import { Callback } from '../types'

export default interface IAPI<Q, R> {
    api: string
    fetch: (query: Q, isRemote: boolean) => Promise<R>
    fetchWithCallback?: (query: Q, callback: Callback<R>) => void
}

export interface BaseResponse {
    success: boolean
    message: string
}


export interface SolutionMeta {
    name: string
    env: {
        [key: string]: string
    }
}

export interface DiscoverBaseResponse {
    success: boolean
    message: string
    address: string
}

export interface SimulationEnv {
    solution_name: string
    solution_address: string
}

export interface ProcessGroupMeta {
    solution_name: string
    simulation_name: string
    group_type: string
    solution_address: string
}

export interface ProcessGroupResponse {
    result: string
    group_id: string
}

export interface CreateSimulationMeta {
    name: string
    solution_name: string
}

export interface StartSimulationMeta {
    solution_name: string
    simulation_name: string
    simulation_address: string
}

export interface StopSimulationMeta {
    solution_name: string
    simulation_name: string
}

export interface GetSimulationResultBaseRequest {
    simulation_name: string
    step: number
}

export interface SimulationResultMeta {
    success: boolean;
    message: string;
    is_ready: boolean;
    files: {
        [key: string]: {
            filename: string;
            content: string;
            is_binary: boolean;
            size: number;
        }
    }
}

export interface ResponseWithNum {
    number: number
}

export interface GridSchema {
    name: string
    epsg: number
    starred: boolean
    description: string
    base_point: [number, number]
    grid_info: [number, number][]
}

export interface ResponseWithGridSchema {
    grid_schema: GridSchema | null
}

export interface MultiGridSchema {
    project_schemas: GridSchema[] | null
}

export interface CRMStatus {
    is_ready: boolean
    status: "ACTIVATED" | "DEACTIVATED"
}

export interface FeatureStatus {
    is_ready: boolean
    status: "ACTIVATED" | "DEACTIVATED"
}

export interface PatchMeta {
    name: string
    starred: boolean
    description: string
    bounds: [number, number, number, number]
}

export interface FeatureMeta {
    resource_path: string
}

export interface MultiPatchMeta {
    patch_metas: PatchMeta[] | null
}

export interface GridMeta {
    name: string
    epsg: number
    description?: string
    subdivide_rules: [number, number][]
    bounds: [number, number, number, number]
}

export interface ProjectMeta {
    name: string
    starred: boolean
    description: string
    schema_name: string
}

export interface ResponseWithProjectMeta {
    project_meta: ProjectMeta | null
}

export interface ResponseWithMultiProjectMeta {
    project_metas: ProjectMeta[] | null
}

export interface SceneMeta {
    node_key: string
    scenario_path: string
    children: SceneMeta[] | null
}

export interface ResponseWithPatchMeta {
    patch_meta: PatchMeta | null
}

export interface GridInfo {
    patches: {
        node_key: string,
        treeger_address: string
    }[]
}

