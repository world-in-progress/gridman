import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/utils/utils'
import { ISceneNode } from '@/core/scene/iscene'
import { Cloudy, FileText, User, X } from 'lucide-react'
import React, { useEffect, useReducer, useRef } from 'react'
import { SceneNode, SceneTree } from '../resourceScene/scene'
import { TabBarProps, Tab, renderNodeTabProps } from './types'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { DragDropContext, Droppable, Draggable, DragStart } from '@hello-pangea/dnd'


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

const RenderNodeTab: React.FC<renderNodeTabProps> = ({
    focusNode,
    node,
    index,
    onTabClick,
}: renderNodeTabProps) => {
    const tab = node.tab
    const tabId = node.id
    const isFocused = focusNode && focusNode.id === node.id

    return (
        <Draggable key={tabId} draggableId={tabId} index={index}>
            {(providedDraggable, snapshot) => (
                <div
                    onClick={() => {
                        onTabClick(tab)
                    }}
                    ref={providedDraggable.innerRef}
                    {...providedDraggable.draggableProps}
                    {...providedDraggable.dragHandleProps}
                    tab-id={node.id}
                >
                    <ContextMenu>
                        <ContextMenuTrigger asChild>
                            <div
                                title={`${node.key} · ${node.tree.isPublic ? 'PUBLIC' : 'PRIVATE'}`}
                                className={cn(
                                    'group flex items-center px-4 bg-[#2D2D2D] border-r border-[#252526] cursor-pointer h-[4vh]',
                                    isFocused && 'bg-[#1E1E1E]',
                                    snapshot.isDragging && 'bg-gray-600'
                                )}
                            >
                                {tab.name === "user" ? (
                                    <User className="w-4 h-4 mr-2 flex-shrink-0 text-blue-400" />
                                ) : (
                                    <FileText className="w-4 h-4 mr-2 flex-shrink-0 text-blue-400" />
                                )}
                                <span
                                    className={cn(
                                        "text-sm truncate text-gray-300 px-0.5 flex items-center",
                                        tab.isPreview && "italic"
                                    )}
                                >
                                    {tab.name}
                                    {node.tree.isPublic && <Cloudy className='w-4 h-4 ml-2 text-gray-300' />}
                                </span>

                                <X
                                    className={cn(
                                        'w-4 h-4 ml-2',
                                        isFocused 
                                        ? 'text-white hover:text-amber-400' 
                                        : 'text-gray-500 hover:text-white invisible group-hover:visible'
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        node.tree.stopEditingNode(node)
                                    }}
                                />
                            </div>
                        </ContextMenuTrigger>
                    </ContextMenu>
                </div>
            )}
        </Draggable>
    )
}

const RenderNodeTabs: React.FC<{focusNode: ISceneNode | null, tabs: Tab[], onTabClick: (tab: Tab) => void, triggerFocus: number}> = ({
    focusNode,
    tabs,
    onTabClick,
    triggerFocus
}) => {
    const elements = tabs.map((tab, index) => {
        const node = tab.node

        return RenderNodeTab({
            focusNode,
            node: (node as SceneNode),
            index,
            onTabClick,
            triggerFocus
        })
    })

    return <>{elements}</>
}

export default function TabBar({
    focusNode,
    triggerFocus,
    tabs,
    localTree,
    remoteTree,
    onTabDragEnd,
    onTabClick,
    width,
}: TabBarProps) {
    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const scrollAreaRef = useRef<HTMLDivElement>(null)

    // Subscribe trigger repaint to local and remote trees
    useEffect(() => {
        const unSubscribe: [() => void, () => void] = [() => { }, () => { }]
        const initTree = async () => {
            try {
                if (!localTree || !remoteTree) return

                // Subscribe to tree update
                unSubscribe[0] = localTree.subscribe(triggerRepaint)
                unSubscribe[1] = remoteTree.subscribe(triggerRepaint)

            } catch (error) {
                console.error('Failed to initialize resource trees:', error)
            }
        }
        initTree()

        return () => {
            unSubscribe[0]()
            unSubscribe[1]()
        }
    }, [localTree, remoteTree])

    useEffect(() => {
        if (!focusNode) return

        const activeTab = scrollAreaRef.current?.querySelector(`[tab-id='${focusNode.id}']`)
        if (activeTab) {
            console.debug('Scrolling to active tab:', focusNode.id)
            activeTab.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
            })
        }
    }, [focusNode, triggerFocus])

    const handleDragStart = (start: DragStart) => {
        const index = start.source.index
        const tab = Array.from(tabs)[index]
        onTabClick(tab)
    }

    return (
        <div 
            className='bg-[#252526] flex shrink-0 h-[4vh]'
            style={{ width: width ? `${width}px` : '[84.5%]' }}
        >
            <ScrollArea ref={scrollAreaRef} className='w-full h-full'>
                <DragDropContext onDragStart={handleDragStart} onDragEnd={onTabDragEnd}>
                    <Droppable droppableId='tabs' direction='horizontal'>
                        {(provided) => (
                            <div
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                className='flex'
                            >
                                <RenderNodeTabs focusNode={focusNode} tabs={tabs} onTabClick={onTabClick} triggerFocus={triggerFocus} />
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                <ScrollBar orientation='horizontal' />
            </ScrollArea>
        </div>
    )
}
