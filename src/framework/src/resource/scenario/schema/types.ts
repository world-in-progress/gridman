import { ISceneNode } from "@/core/scene/iscene"
import { GridLayerInfo } from "../schemas/types"

export interface SchemaInfo {
    name: string
    epsg: number
    description: string
    gridLayers: GridLayerInfo
    basePoint: [number, number]
}

export type SchemaPageProps = {
    node: ISceneNode
}
