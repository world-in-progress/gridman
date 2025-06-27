import React, { useState, useCallback, useEffect } from "react"
import TabBar from "./tabBar/tabBar"
import IconBar from "./iconBar/iconBar"
import MapContainer from "./mapContainer/mapContainer"
import ResourceFolder from "./resourceFolder/resourceFolder"
import { Grid3X3, Play, Eye, Map as MapIcon, Settings, LucideProps, User } from "lucide-react"

export interface ActivityBarItem {
    id: string
    icon: React.ComponentType<LucideProps>
    label: string
    tabName: string
}

export interface Tab {
    id: string
    name: string
    path: string
    isActive: boolean
    activityId: string
}

export interface FileNode {
    name: string
    type: "file" | "folder"
    children?: FileNode[]
    path: string
    isOpen?: boolean
}

// 示例JSON数据结构
const sampleFileData = [
    { key: "topo", name: "topo", type: "folder" },
    { key: "dems", name: "dems", type: "folder" },
    { key: "lums", name: "lums", type: "folder" },
    { key: "vectors", name: "vectors", type: "folder" },
    { key: "rainfalls", name: "rainfalls", type: "folder" },
    { key: "solutins", name: "solutins", type: "folder" },
    { key: "instances", name: "instances", type: "folder" },
    { key: "Topo-schemas-schema1-patches-patch1", name: "patch1", type: "file" },
]

const activityBarItems: ActivityBarItem[] = [
    { id: "grid-editor", icon: Grid3X3, label: "Grid Editor", tabName: "Grid Editor" },
    { id: "simulation", icon: Play, label: "Simulation", tabName: "Simulation" },
    { id: "viewer", icon: Eye, label: "Viewer", tabName: "Viewer" },
    { id: "map-editor", icon: MapIcon, label: "Map Editor", tabName: "Map Editor" },
    { id: "settings", icon: Settings, label: "Settings", tabName: "Settings" },
    { id: "user", icon: User, label: "User", tabName: "User" },
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
                    const isLastPart = index === parts.length - 1

                    if (isLastPart && item.type === "file") {
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
                            const nodeName = isLastPart ? item.name : part
                            const folderNode: FileNode = {
                                name: nodeName,
                                type: "folder",
                                children: [],
                                path: currentPath,
                                isOpen: expandedFolders.has(nodeName),
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

    useEffect(() => {
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
            setActiveTab(existingTab.id)
            return
        }

        const newTab: Tab = {
            id: filePath,
            name: fileName,
            path: filePath,
            isActive: true,
            activityId: activeActivity,
        }

        setTabs([...tabs.map((t) => ({ ...t, isActive: false })), newTab])
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

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            {/* Activity Bar */}
            <IconBar
                activityBarItems={activityBarItems}
                activeActivity={activeActivity}
                handleActivityClick={handleActivityClick}
            />

            {/* Sidebar - File Explorer */}
            <ResourceFolder
                fileTree={fileTree}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                openFile={openFile}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Tab Bar */}
                <TabBar
                    tabs={tabs}
                    setActiveTab={setActiveTab}
                    activityBarItems={activityBarItems}
                />

                {/* Main Editor Area */}
                <MapContainer
                    activityBarItems={activityBarItems}
                    activeActivity={activeActivity}
                />
            </div>
        </div>
    )
}