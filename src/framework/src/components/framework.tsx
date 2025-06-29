import React, { useState, useCallback, useEffect, useRef } from "react"
import TabBar from "./tabBar/tabBar"
import IconBar from "./iconBar/iconBar"
import LoginPage from "./user/loginPage"
import CreatePage from "./functionPage/createPage"
import ResourceFolder from "./resourceFolder/resourceFolder"
import MapContainer, { MapContainerHandles } from "./mapContainer/mapContainer"
import { FileNode, Tab } from "./types"
import { SceneService } from "./utils/sceneService"
import { SchemaService } from "./schemas/SchemaService"
import { activityBarItems } from "./testData"
import { SceneMeta, GridSchema } from '../core/apis/types'
import { MapContentProvider, useMapContent } from "../contexts/MapContentContext"

function MainApp() {
    const [tabs, setTabs] = useState<Tab[]>([])
    const [localFileTree, setLocalFileTree] = useState<FileNode[]>([])
    const [remoteFileTree, setRemoteFileTree] = useState<FileNode[]>([])
    const [activeActivity, setActiveActivity] = useState("grid-editor")
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]))
    const mapRef = useRef<MapContainerHandles>(null);
    const { mapContent, setMapContentForTab } = useMapContent();

    const sceneService = new SceneService()
    const schemaService = new SchemaService();

    // Build File Tree Structure from Scene
    const buildFileTreeFromScene = useCallback((rootSceneNode: SceneMeta): FileNode[] => {
        const convert = (node: SceneMeta, currentPath: string): FileNode => {
            const path = currentPath ? `${currentPath}.${node.node_name}` : node.node_name
            const isFolder = node.node_degree !== 0

            return {
                name: node.node_name,
                type: isFolder ? "folder" : "file",
                scenarioNodeName: node.scenario_path,
                path: path,
                children: node.children?.map((child) => convert(child, path)),
            }
        }

        return rootSceneNode ? [convert(rootSceneNode, "")] : []
    }, [],
    )

    useEffect(() => {
        // Get Local File Tree
        sceneService.getSceneMeta("_", (error, result) => {
            if (error) {
                console.error(error)
                return
            }
            if (result) {
                const newLocalFileTree = buildFileTreeFromScene(result)
                setLocalFileTree(newLocalFileTree)
            }
        })

        // Get Remote File Tree
        sceneService.getSceneMeta("_", (error, result) => {
            if (error) {
                console.error(error)
                return
            }
            if (result) {
                const newRemoteFileTree = buildFileTreeFromScene(result)
                setRemoteFileTree(newRemoteFileTree)
            }
        })
    }, [buildFileTreeFromScene])

    const updateFileTree = (path: string, children: FileNode[]) => {
        const updateNodeInChildren = (nodes: FileNode[], path: string, children: FileNode[]): FileNode[] => {
            return nodes.map(node => {
                if (node.path === path) {
                    return { ...node, children: children };
                }
                if (node.children) {
                    return { ...node, children: updateNodeInChildren(node.children, path, children) };
                }
                return node;
            });
        };

        setLocalFileTree(currentTree => updateNodeInChildren(currentTree, path, children));
    };

    const toggleFolder = (folderName: string) => {
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

    const handleFolderClick = (node: FileNode) => {
        const isCurrentlyExpanded = expandedFolders.has(node.name)
        const hasNoChildren = !node.children || node.children.length === 0

        toggleFolder(node.name)

        if (!isCurrentlyExpanded && hasNoChildren) {
            sceneService.getSceneMeta(node.path, (error, result) => {
                if (error) {
                    console.error(error)
                    return
                }
                if (result && result.children) {
                    const newChildren: FileNode[] = result.children.map((child: any) => ({
                        name: child.node_name,
                        type: child.node_degree !== 0 ? 'folder' : 'file',
                        scenarioNodeName: child.scenario_node_name,
                        path: `${node.path}.${child.node_name}`,
                        children: child.node_degree !== 0 ? [] : undefined,
                    }))
                    updateFileTree(node.path, newChildren)
                }
            })
        }
    }

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


    const handleDropDownMenuOpen = useCallback((node: FileNode) => {
        if (node.scenarioNodeName === "schemas") {
            setTabs(prevTabs => {
                const existingTab = prevTabs.find(t => t.id === 'create-new-schema');
                if (existingTab) {
                    return prevTabs.map(t => ({ ...t, isActive: t.id === 'create-new-schema' }));
                }

                const newTabs = prevTabs.map(t => ({ ...t, isActive: false }));
                const newSchemaTab: Tab = {
                    id: 'create-new-schema',
                    name: 'Create New Schema',
                    path: '/schemas/create',
                    isActive: true,
                    isPreview: false,
                    activityId: 'grid-editor',
                };
                newTabs.push(newSchemaTab);
                return newTabs;
            });
        }
        if (node.scenarioNodeName === "patches") {
            setTabs(prevTabs => {
                const existingTab = prevTabs.find(t => t.id === 'create-new-patch');
                if (existingTab) {
                    return prevTabs.map(t => ({ ...t, isActive: t.id === 'create-new-patch' }));
                }

                const newTabs = prevTabs.map(t => ({ ...t, isActive: false }));
                const newPatchTab: Tab = {
                    id: 'create-new-patch',
                    name: 'Create New Patch',
                    path: '/patches/create',
                    isActive: true,
                    isPreview: false,
                    activityId: 'grid-editor',
                };
                newTabs.push(newPatchTab);
                return newTabs;
            });
        }
        if (node.scenarioNodeName === "schema") {
            handleOpenFile(node.name, node.path);
            schemaService.getSchemaByName(node.name, (err, result) => {
                if (err) {
                    console.error('Failed to get schema info:', err);
                    return;
                }
                if (result.grid_schema) {
                    setMapContentForTab(node.path, [result.grid_schema as GridSchema]);
                    mapRef.current?.flyToSchema(result.grid_schema as GridSchema);
                }
            })
        }
    }, [handleOpenFile, schemaService, setMapContentForTab, setTabs]);

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

    const handleActivityClick = (activityId: string) => {
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
    }

    const setActiveTab = (tabId: string) => {
        const tab = tabs?.find((t) => t.id === tabId)
        if (tab) {
            setTabs(tabs?.map((t) => ({ ...t, isActive: t.id === tabId })) || [])
            setActiveActivity(tab.activityId)
            const schemaData = mapContent[tab.path];
            if (schemaData && schemaData.length > 0) {
                setTimeout(() => {
                    mapRef.current?.flyToSchema(schemaData[0]);
                }, 150)
            }
        }
    }

    const mainEditorAreaComponent = () => {
        const activeTab = tabs.find(tab => tab.isActive);
        const isCreatePage = activeTab?.id === 'create-new-schema' || activeTab?.id === 'create-new-patch';
        const isMapView = activeTab?.id !== 'user' && !isCreatePage;

        return (
            <div className="relative w-full h-full">
                <div className={`w-full h-full ${isMapView ? 'block' : 'hidden'}`}>
                    <MapContainer ref={mapRef} activeTab={activeTab} />
                </div>
                {!isMapView && (
                    <div className="absolute top-0 left-0 w-full h-full bg-white z-10">
                        {activeTab?.id === 'user' && <LoginPage />}
                        {isCreatePage && <CreatePage creationType={activeTab.id === 'create-new-schema' ? 'schema' : 'patch'} />}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-900">
            {/* Activity Bar */}
            <IconBar
                activityBarItems={activityBarItems}
                activeActivity={activeActivity}
                handleActivityClick={handleActivityClick}
            />

            {/* Sidebar - File Explorer */}
            <ResourceFolder
                localFileTree={localFileTree}
                remoteFileTree={remoteFileTree}
                expandedFolders={expandedFolders}
                openFile={handleOpenFile}
                pinFile={handlePinFile}
                handleFolderClick={handleFolderClick}
                handleDropDownMenuOpen={handleDropDownMenuOpen}
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
                    {mainEditorAreaComponent()}
                </div>

            </div>
        </div>
    )
}

export default function Framework() {
    return (
        <MapContentProvider>
            <MainApp />
        </MapContentProvider>
    )
}