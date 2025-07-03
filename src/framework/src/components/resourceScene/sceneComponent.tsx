import React, { useState, useEffect, useCallback, useMemo, use } from 'react'
import { SceneTree, SceneNode } from './scene'
import { ISceneNode } from '@/core/scene/iscene'
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
    tree: SceneTree
    depth: number
}

interface ResourceTreeProps {
    localTree: SceneTree | null
    remoteTree: SceneTree | null
    getLocalTree: boolean
    getRemoteTree: boolean
    onOpenFile: (fileName: string, filePath: string) => void
    onPinFile: (fileName: string, filePath: string) => void
    onDropDownMenuOpen: (node: ISceneNode) => void
    onNodeStartEditing: (node: ISceneNode) => void
    onNodeStopEditing: (node: ISceneNode) => void
}

interface TreeRendererProps {
    tree: SceneTree | null
    title: string
}

export const NodeRenderer: React.FC<TreeNodeProps> = ({ node, tree, depth }) => {
    const isSelected = tree.selectedNodeKey === node.key
    const isExpanded = tree.isNodeExpanded(node.key)
    const isFolder = node.scenarioNode.degree > 0

    const [isDownloaded, setIsDownloaded] = useState(false)

    const handleClick = useCallback(() => {
        tree.handleNodeClick(node)
    }, [tree, node])

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

    return (
        <div>
            <ContextMenu>
                <ContextMenuTrigger>
                    <div
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
                            tree={tree}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

const TreeRenderer: React.FC<TreeRendererProps> = ({ tree, title }) => {
    if (!tree) return null

    return (
        <div>
            <div className='sticky top-0 z-10 bg-gray-800 text-sm font-semibold text-gray-200 mb-1 ml-1'>
                {title}
            </div>
            <NodeRenderer node={tree.root} tree={tree} depth={0} />
        </div>
    )
}

export default function ResourceTreeComponent({
    localTree,
    remoteTree,
    getLocalTree,
    getRemoteTree,
    onOpenFile,
    onPinFile,
    onDropDownMenuOpen,
    onNodeStartEditing,
    onNodeStopEditing,
}: ResourceTreeProps) {

    // Bind handlers to local tree
    useEffect(() => {
        if (localTree) {
            localTree.bindHandlers({
                openFile: onOpenFile,
                pinFile: onPinFile,
                handleNodeMenuOpen: onDropDownMenuOpen,
                handleNodeStartEditing: onNodeStartEditing,
                handleNodeStopEditing: onNodeStopEditing,
            })
        }
    }, [localTree, onOpenFile, onPinFile, onDropDownMenuOpen, onNodeStartEditing, onNodeStopEditing])

    // Bind handlers to remote tree
    useEffect(() => {
        if (remoteTree) {
            remoteTree.bindHandlers({
                openFile: onOpenFile,
                pinFile: onPinFile,
                handleNodeMenuOpen: onDropDownMenuOpen,
                handleNodeStartEditing: onNodeStartEditing,
                handleNodeStopEditing: onNodeStopEditing,
            })
        }
    }, [remoteTree, onOpenFile, onPinFile, onDropDownMenuOpen, onNodeStartEditing, onNodeStopEditing])

    return (
        <ScrollArea className='h-full bg-gray-800'>
            <div className='w-64 bg-gray-800 border-r border-gray-700'>
                <div className='p-2'>
                    <div className='text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide'>
                        Explorer
                    </div>

                    {getLocalTree && (
                        <TreeRenderer tree={localTree} title='Local' />
                    )}

                    <Separator className='my-2 bg-gray-700 w-full' />

                    {getRemoteTree && (
                        <TreeRenderer tree={remoteTree} title='Remote' />
                    )}
                </div>
            </div>
        </ScrollArea>
    )
}