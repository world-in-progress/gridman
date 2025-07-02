import React, { useEffect, useState } from 'react'
import { FileText, User, X } from "lucide-react"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { TabBarProps, Tab, renderNodeTabProps } from "./types"
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { cn } from "@/utils/utils"
import { SceneNode, SceneTree } from '../resourceScene/scene'


const getTabContextMenu = (tab: Tab) => (
    <ContextMenuContent className='bg-white border-gray-50'>
        <ContextMenuItem>复制路径</ContextMenuItem>
        <ContextMenuItem>在文件管理器中显示</ContextMenuItem>
        <ContextMenuItem>重命名</ContextMenuItem>
        <ContextMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-50">
            删除
        </ContextMenuItem>
    </ContextMenuContent>
)

export const renderNodeTab = (
    { 
        node,
        index,
        // onPinFile,
        // setActiveTab,
    }: renderNodeTabProps
) => {
    if (!node || node.tab === null) return null
    const tab = node.tab
    return (
        <Draggable key={tab.name} draggableId={tab.name} index={index}>
            {(providedDraggable, snapshot) => (
                <div
                    ref={providedDraggable.innerRef}
                    {...providedDraggable.draggableProps}
                    {...providedDraggable.dragHandleProps}
                >
                    <ContextMenu>
                        <ContextMenuTrigger asChild>
                            <div
                                className={cn(
                                    "flex items-center px-4 py-2 border-r border-gray-700 cursor-pointer",
                                    "hover:bg-gray-700 min-w-0 max-w-48",
                                    tab.isActive && "bg-gray-900",
                                    snapshot.isDragging && "bg-gray-600"
                                )}
                                // onClick={() => setActiveTab(tab.name)}
                                // onDoubleClick={() => {
                                //     onPinFile(tab.name, tab.path)
                                // }}
                            >
                                {tab.name === "user" ? (
                                    <User className="w-4 h-4 mr-2 flex-shrink-0 text-blue-400" />
                                ) : (
                                    <FileText className="w-4 h-4 mr-2 flex-shrink-0 text-blue-400" />
                                )}
                                <span
                                    className={cn(
                                        "text-sm truncate text-gray-300 px-0.5",
                                        tab.isPreview && "italic"
                                    )}
                                >
                                    {tab.name}
                                </span>
                                <X
                                    className="w-4 h-4 ml-2 text-gray-500 hover:text-white"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        node.tree.closeEditingNode(node)
                                    }}
                                />
                            </div>
                        </ContextMenuTrigger>
                        {getTabContextMenu(tab)}
                    </ContextMenu>
                </div>
            )}
        </Draggable>
    )
}

const renderNodeTabs = (tabNames: string[] | null, localTree: SceneTree | null | undefined, remoteTree: SceneTree | null | undefined) => {

    if (tabNames && tabNames.length !== 0) {
        return tabNames.map((tabName, index) => {
            const partialParts = tabName.split(':')
            const isPublic = partialParts[0] === 'public'
            const _tabName = partialParts[1]
            const node = isPublic ? (remoteTree?.scene.get(_tabName)!) : (localTree?.scene.get(_tabName)!)
            return renderNodeTab({
                node: (node as SceneNode), index
            })
        })

    } else {
        const nodes = Array.from(localTree?.editingNodes || []).concat(Array.from(remoteTree?.editingNodes || []))
        return nodes.map((node, index) => {
            if (!node || !(node as SceneNode).tab) return null
            return renderNodeTab({
                node: (node as SceneNode), index
            })
        })
    }
}

export default function TabBar({
    tabNames,
    localTree,
    remoteTree,
    onTabDragEnd
}: TabBarProps) {
    const [triggerTabBar, setTriggerTabBar] = useState(0)
    const [localUnsubscribe, setLocalUnsubscribe] = useState<(() => void) | undefined>()
    const [remoteUnsubscribe, setRemoteUnsubscribe] = useState<(() => void) | undefined>()

    
    useEffect(() => {
        const initTree = async () => {
            try {
                if (!localTree || !remoteTree) return

                // 取消之前的订阅
                if (localUnsubscribe) localUnsubscribe()
                if (remoteUnsubscribe) remoteUnsubscribe()

                // Subscribe to tree update
                localUnsubscribe && setLocalUnsubscribe(
                    localTree.subscribe(() => {
                        setTriggerTabBar(prev => prev + 1)
                    })
                )
                remoteUnsubscribe && setRemoteUnsubscribe(
                    remoteTree.subscribe(() => {
                        setTriggerTabBar(prev => prev + 1)
                    })
                )

            } catch (error) {
                console.error('Failed to initialize resource trees:', error)
            }
        }
        initTree()
        
        // 组件卸载时取消订阅
        return () => {
            if (localUnsubscribe) localUnsubscribe()
            if (remoteUnsubscribe) remoteUnsubscribe()
        }
    }, [localTree, remoteTree])

    // 当tabNames变化时，也触发重新渲染
    useEffect(() => {
        setTriggerTabBar(prev => prev + 1)
    }, [tabNames])

    return (
        <>
            <DragDropContext onDragEnd={onTabDragEnd}>
                <Droppable droppableId="tabs" direction="horizontal">
                    {(provided) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="bg-gray-800 border-b border-gray-700 flex h-[37px]"
                        >
                            {
                                renderNodeTabs(tabNames, localTree, remoteTree)
                                // Array.from(localTree?.editingNodes || []).concat(Array.from(remoteTree?.editingNodes || []))
                                // tabNames.map((tabName, index) => {
                                //     const isPublic = tabName.split(':')[0] === 'public'
                                //     const node = isPublic ? (remoteTree?.scene.get(tabName)!) : (localTree?.scene.get(tabName)!)
                                //     return renderNodeTab({
                                //         node: (node as SceneNode), index
                                //     })
                                // })
                                // tabs.map((tab, index) => {
                                //     const isPublic = tab.name.split(':')[0] === 'public'
                                //     const node = isPublic ? (remoteTree?.scene.get(tab.path)!) : (localTree?.scene.get(tab.path)!)
                                //     return renderNodeTab({
                                //         node: (node as SceneNode), index
                                //     })
                                // })
                            }
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

        </>

    )
}
