import { ISceneNode } from "@/core/scene/iscene"

export interface RainfallPageProps {
    node: ISceneNode
}

export interface RainfallData {
    DateTime: string
    Station: string
    rainfall: number
    DateAndTime: string
}