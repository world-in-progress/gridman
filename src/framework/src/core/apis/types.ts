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
    model_type: string
    env: {
        [key: string]: string
    }
    action_types: string[]
}

export interface SolutionMetaResponse {
    success: boolean
    data: SolutionMeta
}

export interface DiscoverBaseResponse {
    success: boolean
    message: string
    address: string
}

export interface SimulationEnv {
    solution_node_key: string
    solution_address: string
}

export interface ProcessGroupMeta {
    solution_node_key: string
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
    solution_node_key: string
    simulation_name: string
}

export interface StopSimulationMeta {
    solution_node_key: string
    simulation_node_key: string
}

export interface GetSimulationResultBaseRequest {
    simulation_name: string
    simulation_address: string
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
    name: string
    type: string
    color: string
    epsg: string
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

export interface CreateRasterMeta {
    name: string
    type: string
    original_tif_path: string
}

export interface RasterMeta {
    success: boolean,
    message: string,
    data: {
        bbox: [number, number, number, number],
        epsg: number,
        min_value: number,
        max_value: number,
        nodata_value: number,
        width: number,
        height: number,
        dtype: string,
        transform: [number, number, number, number, number, number],
        crs: string
    }
}

export type RasterOperation = "set" | "add" | "subtract" | "max_fill"

export interface UpdateRasterData {
    feature_node_key: string,
    operation: RasterOperation,
    value: number | null
}

export interface UpdateRasterMeta {
    updates: UpdateRasterData[]
}

export interface SamplingMeta {
    node_key: string,
    x: number,
    y: number,
    epsg: string
}

export interface SamplingValueMeta {
    success: boolean
    message: string
    data: {
        x: number,
        y: number,
        value: number
    }
}

export interface CommonMeta {
    name: string
    type: string
    src_path: string
}

export interface HumanActionMeta {
    node_key: string
    action_type: string
    params: {
        elevation_delta: number
        landuse_type: number
        feature: Record<string, any>
    }
}

export interface CommonData {
    success: boolean
    message: string
    data: Record<string, any>
}


export interface AddHumanActionMeta {
    node_key: string
    action_type: string
    params: Record<string, any>
}

export interface DeleteHumanActionMeta {
    node_key: string
    action_id: string
}

export interface UpdateHumanActionMeta {
    node_key: string
    action_id: string
    action_type: string
    params: Record<string, any>
}

// 定义不同动作的参数类型
interface AddFenceParams {
    elevation_delta: number;
    landuse_type: number;
    feature: Record<string, any>;
}

interface TransferWaterParams {
    from_grid: [number, number];
    to_grid: [number, number];
    q: number;
}

interface AddGateParams {
    up_stream: [number, number];
    down_stream: [number, number];
    gate_height: number;
    feature: Record<string, any>;
}

// 使用联合类型定义 HumanAction
export type HumanAction =
    | {
        action_type: 'add_fence';
        action_id: string;
        params: AddFenceParams;
    }
    | {
        action_type: 'transfer_water';
        action_id: string;
        params: TransferWaterParams;
    }
    | {
        action_type: 'add_gate';
        action_id: string;
        params: AddGateParams;
    }

export interface HumanActionsMeta {
    success: boolean
    data: HumanAction[]
}

export interface TerrainDataResponse {
    success: boolean
    data: {
        terrainMap: string;
        terrainMapSize: [number, number];
        terrainHeightMin: number;
        terrainHeightMax: number;
        lower_left: [number, number];
        lower_right: [number, number];
        upper_right: [number, number];
        upper_left: [number, number];
    };
}


export interface WaterDataResponse {
    success: boolean
    data: {
        durationTime: number;
        waterHuvMaps: string;
        waterHuvMapsSize: [number, number];
        waterHeightMin: number;
        waterHeightMax: number;
        velocityUMin: number;
        velocityUMax: number;
        velocityVMin: number;
        velocityVMax: number;
        lower_left: [number, number];
        lower_right: [number, number];
        upper_right: [number, number];
        upper_left: [number, number];
    };
}

export interface GetWaterDataMeta {
    simulation_name: string
    step: number
}