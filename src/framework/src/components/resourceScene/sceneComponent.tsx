import React, { useState, useEffect, useCallback, useMemo, use, useRef } from 'react'
import { SceneTree, SceneNode } from './scene'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
    ChevronDown,
    ChevronRight,
    Folder,
    FolderOpen,
    FileText,
    FilePlus2,
    FileType2,
    CloudDownload,
    CloudCheck,
} from 'lucide-react'
import { cn } from '@/utils/utils'
import store from '@/store'

interface TreeNodeProps {
    node: ISceneNode
    privateTree: ISceneTree
    publicTree: ISceneTree
    depth: number
    scrollTrigger: number
}

interface SceneTreeProps {
    localTree: SceneTree | null
    remoteTree: SceneTree | null
    getLocalTree: boolean
    getRemoteTree: boolean
    focusNode?: ISceneNode
    onOpenFile: (fileName: string, filePath: string) => void
    onPinFile: (fileName: string, filePath: string) => void
    onDropDownMenuOpen: (node: ISceneNode) => void
    onNodeStartEditing: (node: ISceneNode) => void
    onNodeStopEditing: (node: ISceneNode) => void
    onNodeClickEnd: (node: ISceneNode) => void
    onNodeFocused: (node: ISceneNode) => void 
}

interface TreeRendererProps {
    privateTree: SceneTree | null
    publicTree: SceneTree | null
    title: string
    isPublic: boolean
    scrollTrigger: number
}

export const NodeRenderer: React.FC<TreeNodeProps> = ({ node, privateTree, publicTree, depth, scrollTrigger }) => {
    const _privateTree = privateTree as SceneTree
    const _publicTree = publicTree as SceneTree

    const tree = node.tree as SceneTree
    const isSelected = tree.selectedNode?.key === node.key
    const isExpanded = tree.isNodeExpanded(node.key)
    const isFolder = node.scenarioNode.degree > 0

    const nodeRef = useRef<HTMLDivElement>(null)
    const [isDownloaded, setIsDownloaded] = useState(false)

    const handleClick = useCallback(() => {
        // Set the selected node in the other tree as null
        tree.isRemote ? (_privateTree.selectedNode = null) : (_publicTree.selectedNode = null)
        tree.handleNodeClick(node)
    }, [tree, node, _privateTree, _publicTree])

    const handleDoubleClick = useCallback(() => {
        tree.handleNodeDoubleClick(node)
    }, [tree, node])

    const handleNodeMenu = useCallback((node: ISceneNode) => {
        return tree.getNodeMenuHandler()(node)
    }, [tree])

    const renderNodeMenu = useCallback(() => {
        return node.scenarioNode.renderMenu(node, handleNodeMenu)
    }, [node, handleNodeMenu])

    const handleClickPublicDownload = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault()
        setIsDownloaded(true)
        console.log('Download public resource')
    }

    useEffect(() => {
        if (isSelected && nodeRef.current) {
            nodeRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            })
        }
    }, [isSelected, scrollTrigger])

    return (
        <div>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
                        ref={nodeRef}
                        className={cn(
                            'flex items-center py-0.5 px-2 hover:bg-gray-700 cursor-pointer text-sm w-full',
                            isSelected ? 'bg-gray-600 text-white' : 'text-gray-300',
                        )}
                        style={{ paddingLeft: `${depth * 16 + 2}px` }}
                        onClick={handleClick}
                        onDoubleClick={handleDoubleClick}
                    >
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
                        <span>{node.name}</span>
                        {!isFolder && tree.isRemote &&
                            <button
                                className={`flex rounded-md w-6 h-6 ${!isDownloaded && 'hover:bg-gray-500'} items-center justify-center mr-4 ml-auto cursor-pointer`}
                                title='download'
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
                            key={childNode.key}
                            node={childNode}
                            privateTree={privateTree}
                            publicTree={publicTree}
                            depth={depth + 1}
                            scrollTrigger={scrollTrigger}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const TreeRenderer: React.FC<TreeRendererProps> = ({ privateTree, publicTree, title, isPublic, scrollTrigger }) => {
    if (!privateTree && !publicTree) return null
    const tree = isPublic ? publicTree : privateTree

    return (
        <div>
            <div className='sticky top-0 z-10 bg-gray-800 text-sm font-semibold text-gray-200 mb-1 ml-1'>
                {title}
            </div>
            <NodeRenderer node={tree!.root} privateTree={privateTree!} publicTree={publicTree!} depth={0} scrollTrigger={scrollTrigger} />
        </div>
    )
}

export default function ResourceTreeComponent({
    localTree,
    remoteTree,
    getLocalTree,
    getRemoteTree,
    focusNode,
    onOpenFile,
    onPinFile,
    onDropDownMenuOpen,
    onNodeStartEditing,
    onNodeStopEditing,
    onNodeClickEnd,
    onNodeFocused,
}: SceneTreeProps) {
    // Force focusing on the focused node 
    // to ensure focus again when the component re-renders
    const [scrollTrigger, setScrollTrigger] = useState(0)

    // Bind handlers to local tree
    useEffect(() => {
        if (localTree) {
            localTree.bindHandlers({
                openFile: onOpenFile,
                pinFile: onPinFile,
                handleNodeMenuOpen: onDropDownMenuOpen,
                handleNodeStartEditing: onNodeStartEditing,
                handleNodeStopEditing: onNodeStopEditing,
                handleNodeClickEnd: onNodeClickEnd,
            })
        }
    }, [localTree, onOpenFile, onPinFile, onDropDownMenuOpen, onNodeStartEditing, onNodeStopEditing, onNodeClickEnd])

    // Bind handlers to remote tree
    useEffect(() => {
        if (remoteTree) {
            remoteTree.bindHandlers({
                openFile: onOpenFile,
                pinFile: onPinFile,
                handleNodeMenuOpen: onDropDownMenuOpen,
                handleNodeStartEditing: onNodeStartEditing,
                handleNodeStopEditing: onNodeStopEditing,
                handleNodeClickEnd: onNodeClickEnd,
            })
        }
    }, [remoteTree, onOpenFile, onPinFile, onDropDownMenuOpen, onNodeStartEditing, onNodeStopEditing, onNodeClickEnd])

    useEffect(() => {
        if (focusNode) {
            const tree = focusNode.tree as SceneTree
            const focus = async () => {
                const success = await tree.focusToNode(focusNode)
                if (success) {
                    setScrollTrigger(prev => prev + 1)
                    onNodeFocused(focusNode)
                }
            }
            focus()
        }
    }, [focusNode, onNodeFocused])

    return (
        <ScrollArea className='h-full bg-gray-800'>
            <div className='w-[12.5vw] bg-gray-800 border-r border-gray-700'>
                <div className='p-2'>
                    <div className='text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide'>
                        Explorer
                    </div>

                    {getLocalTree && (
                        <TreeRenderer privateTree={localTree} publicTree={remoteTree} title='Private' isPublic={false} scrollTrigger={scrollTrigger} />
                    )}

                    <Separator className='my-2 bg-gray-700 w-full' />

                    {getRemoteTree && (
                        <TreeRenderer privateTree={localTree} publicTree={remoteTree} title='Public' isPublic={true} scrollTrigger={scrollTrigger} />
                    )}
                </div>
            </div>
        </ScrollArea>
    )
}