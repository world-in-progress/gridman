import { DropResult } from '@hello-pangea/dnd'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '../resourceScene/scene'

export interface Tab {
    name: string
    // id: string
    node: ISceneNode
    isActive: boolean
    isPreview?: boolean
    resourceTree?: ISceneTree
}

export interface TabBarProps{
    tabs: Set<Tab>
    localTree?: SceneTree | null
    remoteTree?: SceneTree | null
    onTabDragEnd: (result: DropResult) => void
    onTabClick: (tab: Tab) => void
}

export interface renderNodeTabProps {
    node: SceneNode,
    index: number,
    onTabClick: (tab: Tab) => void
}



