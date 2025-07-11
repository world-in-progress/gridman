import { ISceneNode } from "@/core/scene/iscene";

export interface PatchPageProps {
    node: ISceneNode
}

export type TopologyOperationType =
    | 'subdivide'
    | 'merge'
    | 'delete'
    | 'recover'
    | null;