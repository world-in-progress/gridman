import React from "react"
import { ChevronDown, ChevronRight, FolderOpen, Folder, FileText, FilePlus2, FileType2 } from "lucide-react"
import { cn } from "@/utils/utils"
import { ResourceFolderProps } from "./types"
import { FileNode } from "../framework"
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

export default function ResourceFolder({
    fileTree,
    expandedFolders,
    openFile,
    pinFile,
    handleFolderClick,
    handleDropDownMenuOpen,
}: ResourceFolderProps) {

    const dropDownMenuComponent = (node: FileNode) => {
        if (node.scenarioNodeName === "schemas") {
            return (
                <ContextMenuContent className="w-50 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem className="cursor-pointer" onClick={() => handleDropDownMenuOpen(node)}>
                        <FilePlus2 className="w-4 h-4 ml-2" />Create New Schema
                    </ContextMenuItem>
                </ContextMenuContent>
            )

        }
        else if (node.scenarioNodeName === "schema") {
            return (
                <ContextMenuContent className="w-50 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem className="cursor-pointer" onClick={() => handleDropDownMenuOpen(node)}>
                        <FileType2 className="w-4 h-4 ml-2" />Check Schema Info
                    </ContextMenuItem>
                </ContextMenuContent>
            )
        }
        else if (node.scenarioNodeName === "patches") {
            return (
                <ContextMenuContent className="w-50 bg-white text-gray-900 border-gray-200">
                    <ContextMenuItem className="cursor-pointer" onClick={() => handleDropDownMenuOpen(node)}>
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

    const renderFileTree = (nodes: FileNode[], depth = 0): React.ReactNode => {
        return nodes.map((node) => (
            <div key={node.path}>
                <ContextMenu>
                    <ContextMenuTrigger>
                        <div
                            className={cn("flex items-center py-0.5 px-2 hover:bg-gray-700 cursor-pointer text-sm", "text-gray-300")}
                            style={{ paddingLeft: `${depth * 16 + 2}px` }}
                            onClick={() => {
                                if (node.type === "folder") {
                                    handleFolderClick(node)
                                } else {
                                    openFile(node.name, node.path)
                                }
                            }}
                            onDoubleClick={() => {
                                if (node.type === "folder") {
                                    handleFolderClick(node)
                                } else {
                                    pinFile(node.name, node.path)
                                }
                            }}
                        >
                            {node.type === "folder" ? (
                                <>
                                    {expandedFolders.has(node.name) ? (
                                        <ChevronDown className="w-4 h-4 mr-1" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 mr-1" />
                                    )}
                                    {expandedFolders.has(node.name) ? (
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
                    {dropDownMenuComponent(node)}
                    {/* {node.name === "schemas" ?
                        <ContextMenuContent className="w-50 bg-white text-gray-900 border-gray-200">
                            <ContextMenuItem className="cursor-pointer" onClick={handleCreateNewSchema}>
                                <FilePlus2 className="w-4 h-4 ml-2" />Create New Schema
                            </ContextMenuItem>
                        </ContextMenuContent>
                        :
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
                    } */}
                </ContextMenu>
                {node.type === "folder" &&
                    expandedFolders.has(node.name) &&
                    node.children &&
                    renderFileTree(node.children, depth + 1)}
            </div>
        ))
    }

    return (
        <div className="w-64 bg-gray-800 border-r border-gray-700">
            <div className="p-2">
                <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">资源管理器</div>
                <div className="max-h-full overflow-y-auto">
                    {renderFileTree(fileTree)}
                </div>
            </div>
        </div>
    )
}
