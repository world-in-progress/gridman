import { ISceneNode } from "@/core/scene/iscene";

export interface VectorsPageProps {
    node: ISceneNode
}

export interface VectorsInformationProps {
    node: ISceneNode
}

export interface FeatureData {
    type: "point" | "line" | "polygon"
    name: string
    epsg: string    
    color: string
}