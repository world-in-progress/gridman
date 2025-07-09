import { DropResult } from '@hello-pangea/dnd'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { SceneNode, SceneTree } from '../resourceScene/scene'

export interface Tab {
    name: string
    node: ISceneNode
    isActive: boolean
    isPreview?: boolean
    resourceTree?: ISceneTree
}

export interface TabBarProps{
    focusNode: SceneNode | null
    triggerFocus: number
    tabs: Tab[]
    localTree?: SceneTree | null
    remoteTree?: SceneTree | null
    onTabDragEnd: (result: DropResult) => void
    onTabClick: (tab: Tab) => void
    width?: number
}

export interface renderNodeTabProps {
    focusNode: ISceneNode | null
    node: SceneNode,
    index: number,
    triggerFocus: number,
    onTabClick: (tab: Tab) => void
}



