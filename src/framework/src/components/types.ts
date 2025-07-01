import { ResourceTree } from '@/core/tree/scene'

export interface Tab {
    id: string
    name: string
    path: string
    isActive: boolean
    activityId: string
    isPreview?: boolean
    resourceTree?: ResourceTree
}

export interface FileNode {
    name: string
    type: "file" | "folder"
    scenarioNodeName: string
    children?: FileNode[]
    path: string
}