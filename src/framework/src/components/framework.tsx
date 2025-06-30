import React, { useState, useCallback, useEffect, useRef } from "react"
import TabBar from "./tabBar/tabBar"
import IconBar from "./iconBar/iconBar"
import LoginPage from "./user/loginPage"
import CreatePage from "./functionPage/createPage"
import ResourceFolder from "./resourceFolder/resourceFolder"
import MapContainer, { MapContainerHandles } from "./mapContainer/mapContainer"
import { Tab } from "./types"
import { SceneService } from "./utils/sceneService"
import { SchemaService } from "./schemas/SchemaService"
import { activityBarItems } from "./testData"
import { SceneMeta, GridSchema } from '../core/apis/types'
import { MapContentProvider, useMapContent } from "../contexts/MapContentContext"
import { ResourceTree, SceneNode } from "@/core/tree/scene"
import store from '@/store'
import { DropResult } from "react-beautiful-dnd"

function FrameworkComponent() {

    const [tabs, setTabs] = useState<Tab[]>([])
    const [treeGeneration, setTreeGeneration] = useState(0);
    const [getLocalTree, setGetLocalTree] = useState<boolean>(false)
    const [localFileTree, setLocalFileTree] = useState<ResourceTree | null>(null)
    const [remoteFileTree, setRemoteFileTree] = useState<ResourceTree | null>(null)
    const [activeActivity, setActiveActivity] = useState("grid-editor")
    const [localExpandedFolders, setLocalExpandedFolders] = useState<Set<string>>(new Set(["_"]))
    const [remoteExpandedFolders, setRemoteExpandedFolders] = useState<Set<string>>(new Set(["_"]))
    const mapRef = useRef<MapContainerHandles>(null);
    const { mapContent, setMapContentForTab } = useMapContent();

    const sceneService = new SceneService()
    const schemaService = new SchemaService()

    useEffect(() => {
        const initTree = async () => {
            const _localTree = await ResourceTree.create(false)
            const _remoteTree = await ResourceTree.create(true)
            store.set('localFileTree', _localTree)
            store.set('remoteFileTree', _remoteTree)
            store.set('updateTree', () => setTreeGeneration(g => g + 1))
            setLocalFileTree(_localTree)
            setRemoteFileTree(_remoteTree)
            setGetLocalTree(true)
        }
        initTree()
    }, [])

    const handleCreationSuccess = async (resourceTree: ResourceTree, creationType: 'schema' | 'patch') => {
        if (!resourceTree) return;
    
        const parentNodeName = creationType === 'schema' ? 'schemas' : 'patches';
        const parentNode = Array.from(resourceTree.root.children.values()).find(n => n.scenarioNode.name === parentNodeName);
    
        if (parentNode) {
            resourceTree.markAsDirty(parentNode.key);
            await resourceTree.alignNodeInfo(parentNode);
            // setTreeGeneration(g => g + 1); // 强制刷新
        }
    };

    const handleTabDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        const newTabs = Array.from(tabs);
        const [reorderedItem] = newTabs.splice(result.source.index, 1);
        newTabs.splice(result.destination.index, 0, reorderedItem);

        setTabs(newTabs);
    };

    const toggleFolder = (folderKey: string, isRemote: boolean) => {
        const setFolders = isRemote ? setRemoteExpandedFolders : setLocalExpandedFolders;
        setFolders((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(folderKey)) {
                newSet.delete(folderKey)
            } else {
                newSet.add(folderKey)
            }
            return newSet
        })
    }

    const handleFolderClick = useCallback(async (tree: ResourceTree, node: SceneNode) => {
        const isDirty = !node.aligned

        toggleFolder(node.key, tree.isRemote)

        if (isDirty) {
            await tree.alignNodeInfo(node)
            // setTreeGeneration(g => g + 1)
        }
    }, [])

    const handleOpenFile = useCallback((fileName: string, filePath: string) => {
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
    }, [activeActivity])


    const handleDropDownMenuOpen = useCallback((node: SceneNode, isRemote: boolean) => {
        if (node.scenarioNode.name === "schemas") {
            setTabs(prevTabs => {
                const existingTab = prevTabs.find(t => t.id === 'create-new-schema');
                if (existingTab) {
                    const newTabs = prevTabs.map(t => ({ ...t, isActive: t.id === 'create-new-schema' }));
                    if (existingTab.resourceTree?.isRemote !== isRemote) {
                        const tabIndex = newTabs.findIndex(t => t.id === 'create-new-schema');
                        if (tabIndex !== -1) {
                            newTabs[tabIndex].resourceTree = isRemote ? remoteFileTree! : localFileTree!;
                        }
                    }
                    return newTabs;
                }

                const newTabs = prevTabs.map(t => ({ ...t, isActive: false }));
                const newSchemaTab: Tab = {
                    id: 'create-new-schema',
                    name: 'Create New Schema',
                    path: '/schemas/create',
                    isActive: true,
                    isPreview: false,
                    activityId: 'grid-editor',
                    resourceTree: isRemote ? remoteFileTree! : localFileTree!,
                };
                newTabs.push(newSchemaTab);
                return newTabs;
            });
        }
        if (node.scenarioNode.name === "patches") {
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
        if (node.scenarioNode.name === "schema") {
            handleOpenFile(node.name, node.key);
            schemaService.getSchemaByName(node.name, isRemote, (err, result) => {
                if (err) {
                    console.error('Failed to get schema info:', err);
                    return;
                }
                if (result.grid_schema) {
                    setMapContentForTab(node.key, [result.grid_schema as GridSchema]);
                    setTimeout(() => {
                        mapRef.current?.flyToSchema(result.grid_schema as GridSchema);  
                    }, 100)
                }
            })
        }
    }, [handleOpenFile, schemaService, setMapContentForTab, setTabs, localFileTree, remoteFileTree]);

    const handlePinFile = useCallback((fileName: string, filePath: string) => {
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
    }, [activeActivity])
    
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
                }, 200)
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
                        {isCreatePage && 
                            <CreatePage 
                                creationType={activeTab.id === 'create-new-schema' ? 'schema' : 'patch'} 
                                resourceTree={activeTab.resourceTree!}
                                onCreationSuccess={handleCreationSuccess}
                            />}
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
            < ResourceFolder
                localFileTree={localFileTree!}
                remoteFileTree={remoteFileTree!}
                localExpandedFolders={localExpandedFolders}
                remoteExpandedFolders={remoteExpandedFolders}
                openFile={handleOpenFile}
                pinFile={handlePinFile}
                handleFolderClick={handleFolderClick}
                handleDropDownMenuOpen={(node: SceneNode, isRemote: boolean) => handleDropDownMenuOpen(node, isRemote)}
                getLocalTree={getLocalTree}
            />

            {/* Main Content */}
            < div className="flex-1 flex flex-col" >
                {/* Tab Bar */}
                < TabBar
                    tabs={tabs || []}
                    setActiveTab={setActiveTab}
                    closeTab={handleCloseTab}
                    pinFile={handlePinFile}
                    onTabDragEnd={handleTabDragEnd}
                />

                {/* Main Editor Area */}
                < div className="flex-1 overflow-hidden" >
                    {mainEditorAreaComponent()}
                </div>
            </div >
        </div >
    )
}

export default function Framework() {
    return (
        <MapContentProvider>
            <FrameworkComponent />
        </MapContentProvider>
    )
}