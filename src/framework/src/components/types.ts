import { LucideProps } from "lucide-react"

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
}

export interface FileNode {
    name: string
    type: "file" | "folder"
    scenarioNodeName: string
    children?: FileNode[]
    path: string
}