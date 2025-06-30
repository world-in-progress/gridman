import { LucideProps } from "lucide-react"
import { ResourceTree } from "@/core/tree/scene";

export interface ActivityBarItem {
    id: string
    icon: React.ComponentType<LucideProps>
    label: string
    tabName: string
    name: string
    path: string
    isActive: boolean
    activityId: string
    isPreview?: boolean
}

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