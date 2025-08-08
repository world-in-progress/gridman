import { ISceneNode } from "@/core/scene/iscene";

export interface InpPageProps {
    node: ISceneNode
}

export interface SwmmNode {
    id: string
    x: number
    y: number
}

export interface SwmmConduit {
    id: string
    fromId: string
    toId: string
    vertices?: Array<[number, number]>
}

export interface SwmmSubcatchment {
    id: string
    polygon?: Array<[number, number]>
}

export interface SwmmParseResult {
    nodes: SwmmNode[]
    conduits: SwmmConduit[]
    subcatchments?: SwmmSubcatchment[]
}