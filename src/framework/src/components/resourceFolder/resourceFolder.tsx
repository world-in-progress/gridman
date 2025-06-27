import React from "react"
import { ChevronDown, ChevronRight, FolderOpen, Folder, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import { ResourceFolderProps } from "./types"
import { FileNode } from "../framework"
import {
    ContextMenu,
    ContextMenuCheckboxItem,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuRadioGroup,
    ContextMenuRadioItem,
    ContextMenuSeparator,
    ContextMenuShortcut,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"

export default function ResourceFolder({
    fileTree,
    expandedFolders,
    toggleFolder,
    openFile,
}: ResourceFolderProps) {
    const renderFileTree = (nodes: FileNode[], depth = 0): React.ReactNode => {
        return nodes.map((node) => (
            <div key={node.path}>
                <div
                    className={cn("flex items-center py-1 px-2 hover:bg-gray-700 cursor-pointer text-sm", "text-gray-300")}
                    style={{ paddingLeft: `${depth * 16 + 8}px` }}
                    onClick={() => {
                        if (node.type === "folder") {
                            toggleFolder(node.path, node.name)
                        } else {
                            openFile(node.name, node.path)
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
                        <FileText className="w-4 h-4 mr-2 ml-5 text-gray-400" />
                    )}
                    <span>{node.name}</span>
                </div>
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
                <div className="text-xs font-semibold text-gray-300 mb-1 flex items-center">
                    <ChevronDown className="w-3 h-3 mr-1" />
                    GRIDMAN
                </div>
                <div className="max-h-full overflow-y-auto">

                    <ContextMenu>
                        <ContextMenuTrigger>
                            {renderFileTree(fileTree)}
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-52 bg-white text-gray-900">
                            <ContextMenuItem inset>
                                Back
                                <ContextMenuShortcut>⌘[</ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuItem inset disabled>
                                Forward
                                <ContextMenuShortcut>⌘]</ContextMenuShortcut>
                            </ContextMenuItem>
                            <ContextMenuItem inset>
                                Reload
                                <ContextMenuShortcut>⌘R</ContextMenuShortcut>
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
                            <ContextMenuCheckboxItem checked>
                                Show Bookmarks
                            </ContextMenuCheckboxItem>
                            <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
                            <ContextMenuSeparator />
                            <ContextMenuRadioGroup value="pedro">
                                <ContextMenuLabel inset>People</ContextMenuLabel>
                                <ContextMenuRadioItem value="pedro">
                                    Pedro Duarte
                                </ContextMenuRadioItem>
                                <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
                            </ContextMenuRadioGroup>
                        </ContextMenuContent>

                    </ContextMenu>
                </div>
            </div>
        </div>
    )
}
