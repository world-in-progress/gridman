import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react'
import {
    Folder,
    FileText,
    CloudCheck,
    FolderOpen,
    ChevronDown,
    ChevronRight,
    CloudDownload,
} from 'lucide-react'
import { cn } from '@/utils/utils'
import { SceneTree } from './scene'
import { useTranslation } from 'react-i18next'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { ContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'



interface TreeNodeProps {
    node: ISceneNode
    privateTree: ISceneTree
    publicTree: ISceneTree
    depth: number
    triggerFocus: number
}

interface SceneTreeProps {
    triggerFocus: number
    focusNode: ISceneNode | null
    publicTree: SceneTree | null
    privateTree: SceneTree | null
    onOpenFile: (fileName: string, filePath: string) => void
    onPinFile: (fileName: string, filePath: string) => void
    onNodeMenuOpen: (node: ISceneNode, menuItem: any) => void
    onNodeStartEditing: (node: ISceneNode) => void
    onNodeStopEditing: (node: ISceneNode) => void
    onNodeDoubleClick: (node: ISceneNode) => void
    onNodeClick: (node: ISceneNode) => void
    onNodeRemove: (node: ISceneNode) => void
}

interface TreeRendererProps {
    privateTree: SceneTree | null
    publicTree: SceneTree | null
    title: string
    isPublic: boolean
    triggerFocus: number
}

export const NodeRenderer: React.FC<TreeNodeProps> = ({ node, privateTree, publicTree, depth, triggerFocus }) => {
    const tree = node.tree as SceneTree
    const isFolder = node.scenarioNode.degree > 0
    const isExpanded = tree.isNodeExpanded(node.id)
    const isSelected = tree.selectedNode?.id === node.id
    const { t } = useTranslation("resourceScene");

    const nodeRef = useRef<HTMLDivElement>(null)
    const [isDownloaded, setIsDownloaded] = useState(false)
    const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleClick = useCallback((e: React.MouseEvent) => {
        // Clear any existing timeout to prevent single click when double clicking
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current)
            clickTimeoutRef.current = null
            return
        }

        // Delay single click execution to allow double click detection
        clickTimeoutRef.current = setTimeout(() => {
            (node.tree as SceneTree).clickNode(node)
            clickTimeoutRef.current = null
        }, 150)
    }, [node])

    const handleDoubleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        // Clear single click timeout
        if (clickTimeoutRef.current) {
            clearTimeout(clickTimeoutRef.current)
            clickTimeoutRef.current = null
        }

        // Prevent text selection
        if (window.getSelection) {
            window.getSelection()?.removeAllRanges()
        }

        (node.tree as SceneTree).doubleClickNode(node)
    }, [node])

    const handleNodeMenu = useCallback((node: ISceneNode, menuItem: any) => {
        return (node.tree as SceneTree).getNodeMenuHandler()(node, menuItem)
    }, [])

    const renderNodeMenu = useCallback(() => {
        return node.scenarioNode.renderMenu(node, handleNodeMenu)
    }, [node, handleNodeMenu])

    const handleClickPublicDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        setIsDownloaded(true)
    }

    useEffect(() => {
        if (isSelected && nodeRef.current) {
            nodeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    }, [isSelected, triggerFocus])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (clickTimeoutRef.current) {
                clearTimeout(clickTimeoutRef.current)
            }
        }
    }, [])

    return (
        <div>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        ref={nodeRef}
                        className={cn(
                            'flex items-center py-0.5 px-2 hover:bg-gray-700 cursor-pointer text-sm w-full select-none',
                            isSelected ? 'bg-gray-600 text-white' : 'text-gray-300',
                            !isFolder && 'cursor-grab active:cursor-grabbing', // Add cursor style for draggable items
                        )}
                        style={{ paddingLeft: `${depth * 16 + 2}px` }}
                        onClick={handleClick}
                        onDoubleClick={handleDoubleClick}
                        draggable={!isFolder} // Only allow dragging files, not folders
                        onDragStart={(e) => {
                            if (!isFolder) {
                                e.dataTransfer.setData('text/plain', node.key);
                                e.dataTransfer.effectAllowed = 'copy';
                            }
                        }}
                    >
                        <div className='ml-2 flex'>
                            {isFolder ? (
                                <>
                                    {isExpanded ? (
                                        <ChevronDown className='w-4 h-4 mr-1' />
                                    ) : (
                                        <ChevronRight className='w-4 h-4 mr-1' />
                                    )}
                                    {isExpanded ? (
                                        <FolderOpen className='w-4 h-4 mr-2 text-blue-400' />
                                    ) : (
                                        <Folder className='w-4 h-4 mr-2 text-blue-400' />
                                    )}
                                </>
                            ) : (
                                <FileText className='w-4 h-4 mr-2 ml-3 text-gray-400' />
                            )}
                        </div>
                        <span>{node.name}</span>
                        {!isFolder && tree.isPublic &&
                            <button
                                type='button'
                                className={`flex rounded-md w-6 h-6 ${!isDownloaded && 'hover:bg-gray-500'} items-center justify-center mr-4 ml-auto cursor-pointer`}
                                title={t('download')}
                                onClick={handleClickPublicDownload}
                            >
                                {isDownloaded ? <CloudCheck className='w-4 h-4 text-green-500' /> : <CloudDownload className='w-4 h-4 text-white' />}
                            </button>}
                    </div>
                </ContextMenuTrigger>
                {renderNodeMenu()}
            </ContextMenu>

            {/* Render child nodes */}
            {isFolder && isExpanded && node.children && (
                <div>
                    {Array.from(node.children.values()).map(childNode => (
                        <NodeRenderer
                            key={childNode.id}
                            node={childNode}
                            privateTree={privateTree}
                            publicTree={publicTree}
                            depth={depth + 1}
                            triggerFocus={triggerFocus}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const TreeRenderer: React.FC<TreeRendererProps> = ({ privateTree, publicTree, title, isPublic, triggerFocus }) => {
    if (!privateTree && !publicTree) return null
    const tree = isPublic ? publicTree : privateTree
    const { t } = useTranslation("resourceScene");

    return (
        <>
            <div className='z-10 bg-[#2A2C33] py-1 pl-1 text-sm font-semibold text-gray-200'>
                <span className='ml-2'>{t(title)}</span>
            </div>
            <NodeRenderer key={tree!.root.id} node={tree!.root} privateTree={privateTree!} publicTree={publicTree!} depth={0} triggerFocus={triggerFocus} />
        </>
    )
}

export default function ResourceTreeComponent({
    focusNode,
    triggerFocus,
    privateTree,
    publicTree,
    onOpenFile,
    onPinFile,
    onNodeMenuOpen,
    onNodeStartEditing,
    onNodeStopEditing,
    onNodeDoubleClick,
    onNodeClick,
    onNodeRemove,
}: SceneTreeProps) {
    //i18
    const { t } = useTranslation("resourceScene");

    // Force focusing on the focused node 
    // to ensure focus again when the component re-renders
    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    // Bind handlers to private tree
    useEffect(() => {
        if (privateTree) {
            privateTree.bindHandlers({
                openFile: onOpenFile,
                pinFile: onPinFile,
                handleNodeMenuOpen: onNodeMenuOpen,
                handleNodeStartEditing: onNodeStartEditing,
                handleNodeStopEditing: onNodeStopEditing,
                handleNodeDoubleClick: onNodeDoubleClick,
                handleNodeClick: onNodeClick,
                handleNodeRemove: onNodeRemove,
            })

            const unsubscribe = privateTree.subscribe(triggerRepaint)
            return () => {
                unsubscribe()
            }
        }
    }, [privateTree, onOpenFile, onPinFile, onNodeMenuOpen, onNodeStartEditing, onNodeStopEditing, onNodeDoubleClick, onNodeClick, onNodeRemove])

    // Bind handlers to public tree
    useEffect(() => {
        if (publicTree) {
            publicTree.bindHandlers({
                openFile: onOpenFile,
                pinFile: onPinFile,
                handleNodeMenuOpen: onNodeMenuOpen,
                handleNodeStartEditing: onNodeStartEditing,
                handleNodeStopEditing: onNodeStopEditing,
                handleNodeDoubleClick: onNodeDoubleClick,
                handleNodeClick: onNodeClick,
                handleNodeRemove: onNodeRemove,
            })

            const unsubscribe = publicTree.subscribe(triggerRepaint)
            return () => {
                unsubscribe()
            }
        }
    }, [publicTree, onOpenFile, onPinFile, onNodeMenuOpen, onNodeStartEditing, onNodeStopEditing, onNodeDoubleClick, onNodeClick, onNodeRemove])

    useEffect(() => {
        if (focusNode) {
            const tree = focusNode.tree as SceneTree
            const expand = async () => {
                const success = await tree.expandNode(focusNode)
                if (success) triggerRepaint()
            }
            expand()
        }
    }, [focusNode, triggerFocus])

    return (
        <ScrollArea className='h-full bg-[#252526] overflow-hidden'>
            <div className='w-full bg-[#252526]'>
                <div className='text-sm font-semibold text-gray-400 py-2 ml-2 uppercase tracking-wide'>
                    {t('EXPLORER')}
                </div>
                {privateTree && (
                    <TreeRenderer privateTree={privateTree} publicTree={publicTree} title='Private' isPublic={false} triggerFocus={triggerFocus} />
                )}
                <Separator className='my-2 bg-[#585858] w-full' />
                {publicTree && (
                    <TreeRenderer privateTree={privateTree} publicTree={publicTree} title='Public' isPublic={true} triggerFocus={triggerFocus} />
                )}
            </div>
        </ScrollArea>
    )
}