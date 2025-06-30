import React, { useEffect, useState, useCallback } from "react"
import { ChevronDown, ChevronRight, FolderOpen, Folder, FileText, FilePlus2, FileType2 } from "lucide-react"
import { cn } from "@/utils/utils"
import { ResourceFolderProps } from "./types"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ResourceTree, SceneNode } from "@/core/tree/scene"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "../ui/separator"

export default function ResourceFolder({
    localFileTree,
    remoteFileTree,
    localExpandedFolders,
    remoteExpandedFolders,
    getLocalTree,
    openFile,
    pinFile,
    handleFolderClick,
    handleDropDownMenuOpen,
}: ResourceFolderProps) {

    // Local File Tree
    const localDropDownMenuComponent = useCallback((node: SceneNode) => {
        if (node.scenarioNode.name === "schemas") {
            return (
                <ContextMenuContent className="w-50 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem className="cursor-pointer" onClick={() => handleDropDownMenuOpen(node, false)}>
                        <FilePlus2 className="w-4 h-4 ml-2" />Create New Schema
                    </ContextMenuItem>
                </ContextMenuContent>
            )

        }
        else if (node.scenarioNode.name === "schema") {
            return (
                <ContextMenuContent className="w-50 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem className="cursor-pointer" onClick={() => handleDropDownMenuOpen(node, false)}>
                        <FileType2 className="w-4 h-4 ml-2" />Check Schema Info
                    </ContextMenuItem>
                </ContextMenuContent>
            )
        }
        else if (node.scenarioNode.name === "patches") {
            return (
                <ContextMenuContent className="w-50 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem className="cursor-pointer" onClick={() => handleDropDownMenuOpen(node, false)}>
                        <FileType2 className="w-4 h-4 ml-2" />Create New Patch
                    </ContextMenuItem>
                </ContextMenuContent>
            )
        }
        else {
            return (
                <ContextMenuContent className="w-52 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem inset>
                        Back
                    </ContextMenuItem>
                    <ContextMenuItem inset disabled>
                        Forward
                    </ContextMenuItem>
                    <ContextMenuItem inset>
                        Reload
                    </ContextMenuItem>
                    <ContextMenuSub>
                        <ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-44">
                            <ContextMenuItem>Save Page...</ContextMenuItem>
                            <ContextMenuItem>Create Shortcut...</ContextMenuItem>
                            <ContextMenuItem>Name Window...</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem>Developer Tools</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
                        </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                </ContextMenuContent>
            )
        }
    }, [handleDropDownMenuOpen])
    const renderLocalFileTree = useCallback(() => {
        if (!localFileTree) return null

        const tree = localFileTree
        const renderTree = (nodes: SceneNode[], depth: number): React.ReactNode => {
            return nodes!.map(node => (
                <div key={node.key}>
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div
                                className={cn("flex items-center py-0.5 px-2 hover:bg-gray-700 cursor-pointer text-sm", "text-gray-300")}
                                style={{ paddingLeft: `${depth * 16 + 2}px` }}
                                onClick={() => {
                                    if (node.scenarioNode.degree > 0) {
                                        handleFolderClick(tree, node)
                                    } else {
                                        openFile(node.name, node.key)
                                    }
                                }}
                                onDoubleClick={() => {
                                    if (node.scenarioNode.degree > 0) {
                                        handleFolderClick(tree, node)
                                    } else {
                                        pinFile(node.name, node.key)
                                    }
                                }}
                            >
                                {node.scenarioNode.degree > 0 ? (
                                    <>
                                        {localExpandedFolders.has(node.key) ? (
                                            <ChevronDown className="w-4 h-4 mr-1" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 mr-1" />
                                        )}
                                        {localExpandedFolders.has(node.key) ? (
                                            <FolderOpen className="w-4 h-4 mr-2 text-blue-400" />
                                        ) : (
                                            <Folder className="w-4 h-4 mr-2 text-blue-400" />
                                        )}
                                    </>
                                ) : (
                                    <FileText className="w-4 h-4 mr-2 ml-3 text-gray-400" />
                                )}
                                <span>{node.name}</span>
                            </div>
                        </ContextMenuTrigger>
                        {localDropDownMenuComponent(node)}
                    </ContextMenu>
                    {node.scenarioNode.degree > 0 &&
                        localExpandedFolders.has(node.key) &&
                        node.children && renderTree(Array.from(node.children.values()), depth + 1)
                    }
                </div>
            ))
        }
        return renderTree([tree.root], 0)
    }, [localFileTree, localExpandedFolders, handleFolderClick, openFile, pinFile, localDropDownMenuComponent])

    // Remote File Tree
    const remoteDropDownMenuComponent = (node: SceneNode) => {
        if (node.scenarioNode.name === "schemas") {
            return (
                <ContextMenuContent className="w-50 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem className="cursor-pointer" onClick={() => handleDropDownMenuOpen(node, true)}>
                        <FilePlus2 className="w-4 h-4 ml-2" />Create New Schema
                    </ContextMenuItem>
                </ContextMenuContent>
            )

        }
        else if (node.scenarioNode.name === "schema") {
            return (
                <ContextMenuContent className="w-50 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem className="cursor-pointer" onClick={() => handleDropDownMenuOpen(node, true)}>
                        <FileType2 className="w-4 h-4 ml-2" />Check Schema Info
                    </ContextMenuItem>
                </ContextMenuContent>
            )
        }
        else if (node.scenarioNode.name === "patches") {
            return (
                <ContextMenuContent className="w-50 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem className="cursor-pointer" onClick={() => handleDropDownMenuOpen(node, true)}>
                        <FileType2 className="w-4 h-4 ml-2" />Create New Patch
                    </ContextMenuItem>
                </ContextMenuContent>
            )
        }
        else {
            return (
                <ContextMenuContent className="w-52 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem inset>
                        Back
                    </ContextMenuItem>
                    <ContextMenuItem inset disabled>
                        Forward
                    </ContextMenuItem>
                    <ContextMenuItem inset>
                        Reload
                    </ContextMenuItem>
                    <ContextMenuSub>
                        <ContextMenuSubTrigger inset>More Tools</ContextMenuSubTrigger>
                        <ContextMenuSubContent className="w-44">
                            <ContextMenuItem>Save Page...</ContextMenuItem>
                            <ContextMenuItem>Create Shortcut...</ContextMenuItem>
                            <ContextMenuItem>Name Window...</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem>Developer Tools</ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
                        </ContextMenuSubContent>
                    </ContextMenuSub>
                    <ContextMenuSeparator />
                </ContextMenuContent>
            )
        }
    }
    const renderRemoteFileTree = useCallback((): React.ReactNode => {
        if (!remoteFileTree) return null

        const tree = remoteFileTree
        const renderTree = (nodes: SceneNode[], depth: number): React.ReactNode => {
            return nodes!.map(node => (
                <div key={node.key}>
                    <ContextMenu>
                        <ContextMenuTrigger>
                            <div
                                className={cn("flex items-center py-0.5 px-2 hover:bg-gray-700 cursor-pointer text-sm", "text-gray-300")}
                                style={{ paddingLeft: `${depth * 16 + 2}px` }}
                                onClick={() => {
                                    // node.scenarioNode.degree > 0: folder
                                    // node.scenarioNode.degree === 0: file
                                    if (node.scenarioNode.degree > 0) {
                                        handleFolderClick(tree, node)
                                    } else {
                                        openFile(node.name, node.key)
                                    }
                                }}
                                onDoubleClick={() => {
                                    if (node.scenarioNode.degree > 0) {
                                        handleFolderClick(tree, node)
                                    } else {
                                        pinFile(node.name, node.key)
                                    }
                                }}
                            >
                                {node.scenarioNode.degree > 0 ? (
                                    <>
                                        {remoteExpandedFolders.has(node.key) ? (
                                            <ChevronDown className="w-4 h-4 mr-1" />
                                        ) : (
                                            <ChevronRight className="w-4 h-4 mr-1" />
                                        )}
                                        {remoteExpandedFolders.has(node.key) ? (
                                            <FolderOpen className="w-4 h-4 mr-2 text-blue-400" />
                                        ) : (
                                            <Folder className="w-4 h-4 mr-2 text-blue-400" />
                                        )}
                                    </>
                                ) : (
                                    <FileText className="w-4 h-4 mr-2 ml-3 text-gray-400" />
                                )}
                                <span>{node.name}</span>
                            </div>
                        </ContextMenuTrigger>
                        {remoteDropDownMenuComponent(node)}
                    </ContextMenu>
                    {node.scenarioNode.degree > 0 &&
                        remoteExpandedFolders.has(node.key) &&
                        node.children &&
                        renderTree(Array.from(node.children.values()), depth + 1)}
                </div>
            ))
        }

        // return nodes!.map(node => (
        //     <div key={node.key}>
        //         <ContextMenu>
        //             <ContextMenuTrigger>
        //                 <div
        //                     className={cn("flex items-center py-0.5 px-2 hover:bg-gray-700 cursor-pointer text-sm", "text-gray-300")}
        //                     style={{ paddingLeft: `${depth * 16 + 2}px` }}
        //                     onClick={() => {
        //                         // node.scenarioNode.degree > 0: folder
        //                         // node.scenarioNode.degree === 0: file
        //                         if (node.scenarioNode.degree > 0) {
        //                             handleFolderClick(tree, node)
        //                         } else {
        //                             openFile(node.name, node.key)
        //                         }
        //                     }}
        //                     onDoubleClick={() => {
        //                         if (node.scenarioNode.degree > 0) {
        //                             handleFolderClick(tree, node)
        //                         } else {
        //                             pinFile(node.name, node.key)
        //                         }
        //                     }}
        //                 >
        //                     {node.scenarioNode.degree > 0 ? (
        //                         <>
        //                             {remoteExpandedFolders.has(node.key) ? (
        //                                 <ChevronDown className="w-4 h-4 mr-1" />
        //                             ) : (
        //                                 <ChevronRight className="w-4 h-4 mr-1" />
        //                             )}
        //                             {remoteExpandedFolders.has(node.key) ? (
        //                                 <FolderOpen className="w-4 h-4 mr-2 text-blue-400" />
        //                             ) : (
        //                                 <Folder className="w-4 h-4 mr-2 text-blue-400" />
        //                             )}
        //                         </>
        //                     ) : (
        //                         <FileText className="w-4 h-4 mr-2 ml-3 text-gray-400" />
        //                     )}
        //                     <span>{node.name}</span>
        //                 </div>
        //             </ContextMenuTrigger>
        //             {remoteDropDownMenuComponent(node)}
        //         </ContextMenu>
        //         {node.scenarioNode.degree > 0 &&
        //             remoteExpandedFolders.has(node.key) &&
        //             node.children &&
        //             renderRemoteFileTree(tree, Array.from(node.children.values()), depth + 1)}
        //     </div>
        // ))
        return renderTree([tree.root], 0)
    }, [remoteExpandedFolders, handleFolderClick, openFile, pinFile, remoteDropDownMenuComponent])

    return (
        <ScrollArea className="h-full">
            <div className="w-64 bg-gray-800 border-r border-gray-700">
                <div className="p-2">
                    <div className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wide">Explorer</div>
                    <div>
                        <div className="sticky top-0 z-10 bg-gray-800 text-sm font-semibold text-gray-200 mb-1 ml-1">Local</div>
                        {getLocalTree && renderLocalFileTree()}
                    </div>
                    <Separator className="my-2 bg-gray-700 w-full" />
                    <div className="mt-2">
                        <div className="sticky top-0 z-10 bg-gray-800 text-sm font-semibold text-gray-200 mb-1 ml-1">Remote</div>
                        {remoteFileTree && renderRemoteFileTree()}
                    </div>
                </div>
            </div>
        </ScrollArea>
    )
}
