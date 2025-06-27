"use client"

import React, { useState, useCallback } from "react"
import {
    Grid3X3,
    Play,
    Eye,
    Map as MapIcon,
    Settings,
    ChevronRight,
    ChevronDown,
    FileText,
    Folder,
    FolderOpen,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { cn } from "@/lib/utils"

// 示例JSON数据结构
const sampleFileData = [
    { key: "src-components-Header", name: "Header.tsx", type: "file" },
    { key: "src-components-Sidebar", name: "Sidebar.tsx", type: "file" },
    { key: "src-pages-Home", name: "Home.tsx", type: "file" },
    { key: "src-pages-About", name: "About.tsx", type: "file" },
    { key: "src-utils-helpers", name: "helpers.ts", type: "file" },
    { key: "public-images-logo", name: "logo.png", type: "file" },
    { key: "docs-README", name: "README.md", type: "file" },
    { key: "docs-api-endpoints", name: "endpoints.md", type: "file" },
]

interface FileNode {
    name: string
    type: "file" | "folder"
    children?: FileNode[]
    path: string
    isOpen?: boolean
}

interface Tab {
    id: string
    name: string
    path: string
    isActive: boolean
    activityId: string
}

// 功能模块定义，每个对应一个tab页
const activityBarItems = [
    { id: "grid-editor", icon: Grid3X3, label: "Grid Editor", tabName: "Grid Editor" },
    { id: "simulation", icon: Play, label: "Simulation", tabName: "Simulation" },
    { id: "viewer", icon: Eye, label: "Viewer", tabName: "Viewer" },
    { id: "map-editor", icon: MapIcon, label: "Map Editor", tabName: "Map Editor" },
    { id: "settings", icon: Settings, label: "Settings", tabName: "Settings" },
]

export default function VSCodeInterface() {
    const [activeActivity, setActiveActivity] = useState("grid-editor")
    const [tabs, setTabs] = useState<Tab[]>(
        activityBarItems.map((item) => ({
            id: item.id,
            name: item.tabName,
            path: item.id,
            isActive: item.id === "grid-editor",
            activityId: item.id,
        })),
    )
    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["src", "docs"]))

    // 构建文件树结构
    const buildFileTree = useCallback(
        (data: typeof sampleFileData): FileNode[] => {
            const tree: FileNode[] = []
            const folderMap = new Map<string, FileNode>()

            data.forEach((item) => {
                const parts = item.key.split("-")
                let currentPath = ""

                parts.forEach((part, index) => {
                    const parentPath = currentPath
                    currentPath = currentPath ? `${currentPath}/${part}` : part

                    if (index === parts.length - 1) {
                        // 这是文件
                        const fileNode: FileNode = {
                            name: item.name,
                            type: "file",
                            path: currentPath,
                        }

                        if (parentPath) {
                            const parent = folderMap.get(parentPath)
                            if (parent) {
                                parent.children = parent.children || []
                                parent.children.push(fileNode)
                            }
                        } else {
                            tree.push(fileNode)
                        }
                    } else {
                        // 这是文件夹
                        if (!folderMap.has(currentPath)) {
                            const folderNode: FileNode = {
                                name: part,
                                type: "folder",
                                children: [],
                                path: currentPath,
                                isOpen: expandedFolders.has(part),
                            }

                            folderMap.set(currentPath, folderNode)

                            if (parentPath) {
                                const parent = folderMap.get(parentPath)
                                if (parent) {
                                    parent.children = parent.children || []
                                    parent.children.push(folderNode)
                                }
                            } else {
                                tree.push(folderNode)
                            }
                        }
                    }
                })
            })

            return tree
        },
        [expandedFolders],
    )

    React.useEffect(() => {
        setFileTree(buildFileTree(sampleFileData))
    }, [buildFileTree])

    const toggleFolder = (path: string, folderName: string) => {
        setExpandedFolders((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(folderName)) {
                newSet.delete(folderName)
            } else {
                newSet.add(folderName)
            }
            return newSet
        })
    }

    const openFile = (fileName: string, filePath: string) => {
        const existingTab = tabs.find((tab) => tab.path === filePath)
        if (existingTab) {
            setTabs(tabs.map((tab) => ({ ...tab, isActive: tab.id === existingTab.id })))
            setActiveActivity(existingTab.activityId)
        }
    }

    // 点击activity bar图标时激活对应的tab
    const handleActivityClick = (activityId: string) => {
        setActiveActivity(activityId)
        setTabs(tabs.map((tab) => ({ ...tab, isActive: tab.activityId === activityId })))
    }

    const setActiveTab = (tabId: string) => {
        const tab = tabs.find((t) => t.id === tabId)
        if (tab) {
            setTabs(tabs.map((t) => ({ ...t, isActive: t.id === tabId })))
            setActiveActivity(tab.activityId)
        }
    }

    const renderFileTree = (nodes: FileNode[], depth = 0) => {
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

    const getTabContextMenu = (tab: Tab) => (
        <ContextMenuContent className="bg-white text-gray-900">
            <ContextMenuItem>复制路径</ContextMenuItem>
            <ContextMenuItem>在文件管理器中显示</ContextMenuItem>
            <ContextMenuItem>重命名</ContextMenuItem>
            <ContextMenuItem className="text-red-500 focus:text-red-500 focus:bg-red-50">
                删除
            </ContextMenuItem>
        </ContextMenuContent>
    )

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* Activity Bar */}
            <div className="w-12 bg-gray-600 flex flex-col items-center py-2">
                {activityBarItems.map((item) => (
                    <Button
                        key={item.id}
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "w-10 h-10 mb-1 hover:bg-gray-700",
                            activeActivity === item.id && "bg-gray-700 border-l-2 border-blue-500",
                        )}
                        onClick={() => handleActivityClick(item.id)}
                        title={item.label}
                    >
                        <item.icon className="w-5 h-5" />
                    </Button>
                ))}
            </div>

            {/* Sidebar - File Explorer */}
            <div className="w-64 bg-gray-800 border-r border-gray-700">
                <div className="p-2">
                    <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wide">资源管理器</div>
                    <div className="text-xs font-semibold text-gray-300 mb-1 flex items-center">
                        <ChevronDown className="w-3 h-3 mr-1" />
                        GRIDMAN
                    </div>
                    <div className="max-h-full overflow-y-auto">{renderFileTree(fileTree)}</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Tab Bar */}
                <div className="bg-gray-800 border-b border-gray-700 flex">
                    {tabs.map((tab) => (
                        <ContextMenu key={tab.id}>
                            <ContextMenuTrigger asChild>
                                <div
                                    className={cn(
                                        "flex items-center px-4 py-2 border-r border-gray-700 cursor-pointer",
                                        "hover:bg-gray-700 min-w-0 max-w-48",
                                        tab.isActive && "bg-gray-900",
                                    )}
                                    onClick={() => setActiveTab(tab.id)}
                                >
                                    {/* 根据tab类型显示对应图标 */}
                                    {(() => {
                                        const activityItem = activityBarItems.find((item) => item.id === tab.activityId)
                                        const IconComponent = activityItem?.icon || FileText
                                        return <IconComponent className="w-4 h-4 mr-2 flex-shrink-0 text-blue-400" />
                                    })()}
                                    <span className="text-sm truncate text-gray-300">{tab.name}</span>
                                </div>
                            </ContextMenuTrigger>
                            {getTabContextMenu(tab)}
                        </ContextMenu>
                    ))}
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 bg-gray-900 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-6xl mb-4">🗺️</div>
                        <h2 className="text-2xl font-semibold text-gray-300 mb-2">地图容器</h2>
                        <p className="text-gray-500">
                            当前活动模块: {activityBarItems.find((item) => item.id === activeActivity)?.label}
                        </p>
                        <p className="text-gray-400 text-sm mt-2">这里将显示对应功能的界面内容</p>
                    </div>
                </div>
            </div>
        </div>
    )
}