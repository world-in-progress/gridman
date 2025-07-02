import { DropResult } from '@hello-pangea/dnd'
import { ISceneTree } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '../resourceScene/scene'

export interface Tab {
    name: string
    path: string
    isActive: boolean
    isPreview?: boolean
    resourceTree?: ISceneTree
}

export interface TabBarProps{
    tabNames: string[]
    localTree?: SceneTree | null
    remoteTree?: SceneTree | null
    onTabDragEnd: (result: DropResult) => void
}

export interface renderNodeTabProps {
    node: SceneNode,
    index: number,
}



