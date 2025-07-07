import { ISceneNode } from "@/core/scene/iscene"
import { GridLayerInfo } from "../schemas/types"

export interface SchemaInfo {
    name: string
    epsg: number
    starred: boolean
    description: string
    base_point: [number, number]
    grid_info: [number, number][]
}

export type SchemaPageProps = {
    node: ISceneNode
}
