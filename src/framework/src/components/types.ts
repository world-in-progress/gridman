import { ISceneTree } from '@/core/scene/iscene'

export interface Tab {
    id: string
    name: string
    path: string
    isActive: boolean
    activityId: string
    isPreview?: boolean
    resourceTree?: ISceneTree
}

export interface FileNode {
    name: string
    type: "file" | "folder"
    scenarioNodeName: string
    children?: FileNode[]
    path: string
}