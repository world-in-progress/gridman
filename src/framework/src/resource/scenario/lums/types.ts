import { ISceneNode } from "@/core/scene/iscene";

export interface LumsPageProps {
    node: ISceneNode
}

export interface NewLUMData {
    name: string
    epsg: string
    nodeKey: string
    type: string
    original_tif_path: string
}