import { Callback } from '../types'

export default interface IAPI<Q, R> {
    api: string
    fetch: (query: Q) => Promise<R>
    fetchWithCallback?: (query: Q, callback: Callback<R>) => void
}

export interface BaseResponse {
    success: boolean
    message: string
}

export interface ResponseWithNum {
    number: number
}

export interface ProjectSchema {
    name: string
    epsg: number
    starred: boolean
    description: string
    base_point: [ number, number ]
    grid_info: [number, number][]
}

export interface ResponseWithProjectSchema {
    project_schema: ProjectSchema | null
}

export interface MultiProjectSchema {
    project_schemas: ProjectSchema[] | null
}

export interface PatchStatus {
    is_ready: boolean
    status: 'ACTIVATED' | 'DEACTIVATED'
}

export interface PatchMeta {
    name: string
    starred: boolean
    description: string
    bounds: [ number, number, number, number ]
}

export interface MultiPatchMeta {
    patch_metas: PatchMeta[] | null
}

export interface GridMeta {
    name: string
    epsg: number
    subdivide_rules: [ number, number ][]
    bounds: [ number, number, number, number ]
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