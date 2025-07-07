import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/utils/utils'
import { useEffect, useReducer } from 'react'
import { Cloudy, FileText, User, X } from 'lucide-react'
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

const renderNodeTab = ({
    node,
    index,
    onTabClick,
}: renderNodeTabProps) => {
    const tab = node.tab
    const tabId = node.id
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
                >
                    <ContextMenu>
                        <ContextMenuTrigger asChild>
                            <div
                                className={cn(
                                    'flex items-center px-4 py-2 border-r border-gray-700 cursor-pointer',
                                    'hover:bg-gray-700 h-[4vh]',
                                    tab.isActive && 'bg-gray-900',
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

const renderNodeTabs = (
    tabs: Set<Tab>,
    localTree: SceneTree | null | undefined,
    remoteTree: SceneTree | null | undefined,
    onTabClick: (tab: Tab) => void,
) => {
    console.debug('Rendering tabs:', Array.from(tabs).map(tab => tab.name))

    const elements = Array.from(tabs).map((tab, index) => {
        const [domain, path] = tab.node.id.split(':')
        const isPublic = domain === 'public'
        const node = isPublic ? (remoteTree?.scene.get(path)) : (localTree?.scene.get(path))

        if (!node) return null

        return renderNodeTab({
            node: (node as SceneNode),
            index,
            onTabClick,
        })
    })

    return elements
}

export default function TabBar({
    tabs,
    focusNode,
    localTree,
    remoteTree,
    onTabDragEnd,
    onTabClick,
}: TabBarProps) {
    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    // Subscribe trigger repaint to local and remote trees
    useEffect(() => {
        const unSubscribe: [() => void, () => void] = [() => {}, () => {}]
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

    // Handle focus node changes
    useEffect(() => {
        if (focusNode) {
            for (let i = 0; i < tabs.size; i++) {
                const tab = Array.from(tabs)[i]
                if (tab.node.id === focusNode.id) {
                    tab.isActive = true
                    break
                }
            }
        }

        return () => {
            if (focusNode) {
                for (let i = 0; i < tabs.size; i++) {
                    const tab = Array.from(tabs)[i]
                    if (tab.node.id === focusNode.id) {
                        tab.isActive = false
                        break
                    }
                }
            }
        }
    }, [tabs, focusNode])

    const handleDragStart = (start: DragStart) => {
        const index = start.source.index
        const tab = Array.from(tabs)[index]
        onTabClick(tab)
    }

    return (
        <>
            <div className='bg-gray-800 border-b border-gray-700 flex h-[4vh] w-[85vw]'>
                <ScrollArea className='w-full'>
                    <DragDropContext onDragStart={handleDragStart} onDragEnd={onTabDragEnd}>
                        <Droppable droppableId='tabs' direction='horizontal'>
                            {(provided) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className='bg-gray-800 border-b border-gray-700 flex h-full min-w-max'
                                >
                                    {renderNodeTabs(tabs, localTree, remoteTree, onTabClick)}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                    <ScrollBar orientation='horizontal' />
                </ScrollArea>
            </div>
        </>
    )
}
