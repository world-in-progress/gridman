import { ISceneNode } from "@/core/scene/iscene"

export interface TidePageProps {
    node: ISceneNode
}

export interface TideData {
    date: string,
    time: string,
    chaowei: number
}