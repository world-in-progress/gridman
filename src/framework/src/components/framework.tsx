import React, { useState, useCallback, useEffect } from "react"
import TabBar from "./tabBar/tabBar"
import IconBar from "./iconBar/iconBar"
import MapContainer from "./mapContainer/mapContainer"
import ResourceFolder from "./resourceFolder/resourceFolder"
import { LucideProps } from "lucide-react"
import { activityBarItems } from "./testData"
import LoginPage from "./user/loginPage"
import { SceneService } from "./utils/sceneService"
import { SceneMeta } from '../core/apis/types'
import CreatePage from "./functionPage/createPage"

export interface ActivityBarItem {
    id: string
    icon: React.ComponentType<LucideProps>
    label: string
    tabName: string
    name: string
    path: string
    isActive: boolean
    activityId: string
    isPreview?: boolean
}

export interface Tab {
    id: string
    name: string
    path: string
    isActive: boolean
    activityId: string
    isPreview?: boolean
}

export interface FileNode {
    name: string
    type: "file" | "folder"
    children?: FileNode[]
    path: string
    isOpen?: boolean
}

export default function VSCodeInterface() {
    const [activeActivity, setActiveActivity] = useState("grid-editor")
    const [tabs, setTabs] = useState<Tab[]>([])
    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]))

    const buildFileTreeFromScene = useCallback(
        (rootSceneNode: SceneMeta): FileNode[] => {
            const convert = (node: SceneMeta, currentPath: string): FileNode => {
                const path = currentPath ? `${currentPath}/${node.node_name}` : node.node_name
                const isFolder = node.node_degree !== 1

                return {
                    name: node.node_name,
                    type: isFolder ? "folder" : "file",
                    path: path,
                    children: node.children?.map((child) => convert(child, path)),
                    isOpen: isFolder ? expandedFolders.has(node.node_name) : undefined,
                }
            }

            return rootSceneNode ? [convert(rootSceneNode, "")] : []
        },
        [expandedFolders],
    )

    useEffect(() => {
        const sceneService = new SceneService()
        sceneService.getSceneMeta("_", (error, result) => {
            if (error) {
                console.error(error)
                return
            }
            if (result) {
                const newFileTree = buildFileTreeFromScene(result)
                setFileTree(newFileTree)
            }
        })
    }, [buildFileTreeFromScene])

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

    const handleCreateNewSchema = useCallback(() => {
        setTabs(prevTabs => {
            const existingTab = prevTabs.find(t => t.id === 'create-schema');
            if (existingTab) {
                return prevTabs.map(t => ({ ...t, isActive: t.id === 'create-schema' }));
            }

            const newTabs = prevTabs.map(t => ({ ...t, isActive: false }));
            const newSchemaTab: Tab = {
                id: 'create-schema',
                name: 'Create Schema',
                path: '/schemas/create',
                isActive: true,
                isPreview: false,
                activityId: 'grid-editor',
            };
            newTabs.push(newSchemaTab);
            return newTabs;
        });
    }, []);

    const handleOpenFile = (fileName: string, filePath: string) => {
        setTabs((prevTabs) => {
            const existingPinnedTab = prevTabs.find((t) => t.path === filePath && !t.isPreview)
            if (existingPinnedTab) {
                return prevTabs.map((t) => ({ ...t, isActive: t.path === filePath }))
            }

            let newTabs = prevTabs.map((t) => ({ ...t, isActive: false }))
            const previewIndex = newTabs.findIndex((t) => t.isPreview)

            const newTab: Tab = {
                id: filePath,
                name: fileName,
                path: filePath,
                isActive: true,
                activityId: activeActivity,
                isPreview: true,
            }

            if (previewIndex !== -1) {
                newTabs[previewIndex] = newTab
            } else {
                newTabs.push(newTab)
            }

            return newTabs
        })
    }

    const handlePinFile = (fileName: string, filePath: string) => {
        setTabs((prevTabs) => {
            const existingTabIndex = prevTabs.findIndex((t) => t.path === filePath)
            let newTabs = [...prevTabs]

            if (existingTabIndex !== -1) {
                newTabs[existingTabIndex] = { ...newTabs[existingTabIndex], isPreview: false, isActive: true }
                newTabs = newTabs.map((t, index) => (index === existingTabIndex ? { ...t } : { ...t, isActive: false }))
            } else {
                newTabs = newTabs.map((t) => ({ ...t, isActive: false }))
                const newTab: Tab = {
                    id: filePath,
                    name: fileName,
                    path: filePath,
                    isActive: true,
                    activityId: activeActivity,
                    isPreview: false,
                }
                const previewIndex = newTabs.findIndex(t => t.isPreview)
                if (previewIndex !== -1) {
                    newTabs[previewIndex] = newTab
                } else {
                    newTabs.push(newTab)
                }
            }

            return newTabs
        })
    }
    const handleCloseTab = (tabIdToClose: string) => {
        setTabs(prevTabs => {
            const tabToCloseIndex = prevTabs.findIndex(t => t.id === tabIdToClose);
            if (tabToCloseIndex === -1) return prevTabs;

            const newTabs = prevTabs.filter(t => t.id !== tabIdToClose);

            if (newTabs.length > 0 && prevTabs[tabToCloseIndex].isActive) {
                const newActiveIndex = Math.max(0, tabToCloseIndex - 1);
                newTabs[newActiveIndex].isActive = true;
            }

            return newTabs;
        });
    };

    // 点击activity bar图标时激活对应的tab
    const handleActivityClick = (activityId: string) => {
        // 如果点击的是 user 图标，则特殊处理
        if (activityId === "user") {
            const userTabExists = tabs.some(tab => tab.id === "user")

            if (!userTabExists) {
                const userActivity = activityBarItems.find(item => item.id === "user")
                if (userActivity) {
                    const newUserTab: Tab = {
                        id: "user",
                        name: "User",
                        path: "/user",
                        isActive: true,
                        isPreview: false,
                        activityId: "user",
                    }
                    const newTabs = tabs.map(t => ({ ...t, isActive: false }))
                    setTabs([...newTabs, newUserTab])
                    setActiveTab("user")
                }
            } else {
                setActiveTab("user")
            }
            setActiveActivity(activityId)
            return
        }


        setActiveActivity(activityId)
        setTabs(tabs.map(t => ({ ...t, isActive: t.activityId === activityId })))
        // 如果左侧的 panel 已经处于激活状态，并且点击的是同一个活动栏图标，那么就关闭这个 panel
        // if (activeActivity === activityId) {
        //     setActiveActivity("")
        //     setTabs(tabs.map(t => ({ ...t, isActive: false })))
        // } else {
        //     setActiveActivity(activityId)
        //     setTabs(tabs.map(t => ({ ...t, isActive: t.activityId === activityId })))
        // }
    }

    const setActiveTab = (tabId: string) => {
        const tab = tabs?.find((t) => t.id === tabId)
        if (tab) {
            setTabs(tabs?.map((t) => ({ ...t, isActive: t.id === tabId })) || [])
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
                openFile={handleOpenFile}
                pinFile={handlePinFile}
                handleCreateNewSchema={handleCreateNewSchema}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                {/* Tab Bar */}
                <TabBar
                    tabs={tabs || []}
                    setActiveTab={setActiveTab}
                    closeTab={handleCloseTab}
                    pinFile={handlePinFile}
                />

                {/* Main Editor Area */}
                <div className="flex-1 overflow-hidden">
                    {(() => {
                        const activeTab = tabs.find(tab => tab.isActive);
                        if (activeTab?.id === 'user') {
                            return <LoginPage />;
                        }
                        if (activeTab?.id === 'create-schema') {
                            return <CreatePage />;
                        }
                        return <MapContainer />;
                    })()}
                </div>

            </div>
        </div>
    )
}