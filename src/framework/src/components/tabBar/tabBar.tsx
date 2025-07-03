import { useEffect, useState } from 'react'
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

const renderNodeTab = (
    { 
        node,
        index,
        // onPinFile,
        // setActiveTab,
    }: renderNodeTabProps
) => {
    const tab = node.tab
    return (
        <Draggable key={tab.id} draggableId={tab.id} index={index}>
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
                                        node.tree.stopEditingNode(node)
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

const renderNodeTabs = (tabs: Set<Tab>, localTree: SceneTree | null | undefined, remoteTree: SceneTree | null | undefined) => {
    console.debug('Rendering tabs:', Array.from(tabs).map(tab => tab.name))
    
    const elements =  Array.from(tabs).map((tab, index) => {
        const [domain, path] = tab.id.split(':')
        const isPublic = domain === 'public'
        const node = isPublic ? (remoteTree?.scene.get(path)) : (localTree?.scene.get(path))
        
        if (!node) return null

        return renderNodeTab({
            node: (node as SceneNode), index
        })
    })

    return elements
}

export default function TabBar({
    tabs,
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

                // Subscribe to tree update
                if (localUnsubscribe === undefined) {
                    setLocalUnsubscribe(
                        localTree.subscribe(() => {
                            setTriggerTabBar(prev => prev + 1)
                        })
                    )
                }
                if (remoteUnsubscribe === undefined) {
                    setRemoteUnsubscribe(
                        remoteTree.subscribe(() => {
                            setTriggerTabBar(prev => prev + 1)
                        })
                    )
                }

            } catch (error) {
                console.error('Failed to initialize resource trees:', error)
            }
        }
        initTree()
        
        return () => {
            if (localUnsubscribe) localUnsubscribe()
            if (remoteUnsubscribe) remoteUnsubscribe()
        }
    }, [localTree, remoteTree, localUnsubscribe, remoteUnsubscribe])

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
                                renderNodeTabs(tabs, localTree, remoteTree)
                            }
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

        </>

    )
}
