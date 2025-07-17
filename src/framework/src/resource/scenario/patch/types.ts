import { ISceneNode } from "@/core/scene/iscene";

export interface TopologyEditorProps {
    node: ISceneNode
}

export interface PatchInfoProps {
    node: ISceneNode
}

export type TopologyOperationType =
    | 'subdivide'
    | 'merge'
    | 'delete'
    | 'recover'
    | null

export interface GridCheckingInfo {
    storageId: number;
    level: number;
    globalId: number;
    localId: number;
    deleted: boolean;
}