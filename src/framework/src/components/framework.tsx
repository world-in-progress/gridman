import { useState, useCallback, useEffect, useRef } from "react"
import store from '@/store'
import TabBar, { renderNodeTab } from "./tabBar/tabBar"
import IconBar from "./iconBar/iconBar"
import ResourceTreeComponent from "./resourceScene/sceneComponent"
import { Tab } from "./tabBar/types"
import { SceneNode, SceneTree } from "./resourceScene/scene"
import { ISceneNode } from "@/core/scene/iscene"
import { DropResult } from "@hello-pangea/dnd"
import { ICON_REGISTRY } from '@/resource/iconRegistry'
import MapContainer, { MapContainerHandles } from "./mapContainer/mapContainer"
import { IconBarClickHandlers } from '@/components/iconBar/types'
import CreatePage from "./functionPage/createPage"

function FrameworkComponent() {

    const [tabNames, setTabNames] = useState<string[]>([])
    const [treeGeneration, setTreeGeneration] = useState(0)
    const [activeIconID, setActiveIconID] = useState('grid-editor')
    const [getLocalTree, setGetLocalTree] = useState<boolean>(false)
    const [getRemoteTree, setGetRemoteTree] = useState<boolean>(false)
    const [localFileTree, setLocalFileTree] = useState<SceneTree | null>(null)
    const [remoteFileTree, setRemoteFileTree] = useState<SceneTree | null>(null)
    const mapRef = useRef<MapContainerHandles>(null)

    // Default icon click handlers: all icon have the same clicking behavior
    const iconClickHandlers: IconBarClickHandlers = {}
    ICON_REGISTRY.forEach(icon => {
        iconClickHandlers[icon.id] = (iconID: string) => {
            console.log('Clicked icon:', icon.id, 'with activityId:', iconID)
            setActiveIconID(iconID)
            // setTabs(tabs.map(t => ({ ...t, isActive: t.activityId === iconID })))
        }
    })

    // Init DomResourceTree
    useEffect(() => {
        const initTree = async () => {
            try {
                const _localTree = await SceneTree.create(false)
                const _remoteTree = await SceneTree.create(true)

                const updateTabNames = () => {
                    console.log('???')
                    const nodes = Array.from(localFileTree?.editingNodes || []).concat(Array.from(remoteFileTree?.editingNodes || []))
                    const _tabNames: string[] = []
                    nodes.forEach(node=> {
                        const _n: SceneNode = node as SceneNode
                        if (_n.tab) {
                            _tabNames.push(_n.tab.name)
                        }
                    })
                    setTabNames(_tabNames)
                }

                // Subscribe to tree update
                _localTree.subscribe(() => {
                    setTreeGeneration(prev => prev + 1)
                })
                _localTree.subscribe(() => {
                    updateTabNames()
                })
                _remoteTree.subscribe(() => {
                    updateTabNames()
                    setTreeGeneration(prev => prev + 1)
                })
                _remoteTree.subscribe(() => {
                    updateTabNames()
                })

                store.set('localFileTree', _localTree)
                store.set('remoteFileTree', _remoteTree)
                store.set('updateTree', () => setTreeGeneration(g => g + 1))

                setLocalFileTree(_localTree)
                setRemoteFileTree(_remoteTree)
                setGetLocalTree(true)
                setGetRemoteTree(true)

            } catch (error) {
                console.error('Failed to initialize resource trees:', error)
            }
        }
        initTree()
    }, [])

    // File processing handlers
    const handleOpenFile = useCallback((fileName: string, filePath: string) => {
        // setTabNames(prevTabs => {
        //     const existingPinnedTab = prevTabs.find(t => t.path === filePath && !t.isPreview)
        //     if (existingPinnedTab) {
        //         return prevTabs.map(t => ({ ...t, isActive: t.path === filePath }))
        //     }

        //     const newTabs = prevTabs.map(t => ({ ...t, isActive: false }))
        //     const previewIndex = newTabs.findIndex(t => t.isPreview)

        //     const newTab: Tab = {
        //         name: fileName,
        //         path: filePath,
        //         isActive: true,
        //         isPreview: true,
        //     }

        //     if (previewIndex !== -1) {
        //         newTabs[previewIndex] = newTab
        //     } else {
        //         newTabs.push(newTab)
        //     }

        //     return newTabs
        // })
    }, [activeIconID])

    const handlePinFile = useCallback((fileName: string, filePath: string) => {
        // setTabNames((prevTabs) => {
        //     const existingTabIndex = prevTabs.findIndex((t) => t.path === filePath)
        //     let newTabs = [...prevTabs]

        //     if (existingTabIndex !== -1) {
        //         newTabs[existingTabIndex] = { ...newTabs[existingTabIndex], isPreview: false, isActive: true }
        //         newTabs = newTabs.map((t, index) => (index === existingTabIndex ? { ...t } : { ...t, isActive: false }))
        //     } else {
        //         newTabs = newTabs.map((t) => ({ ...t, isActive: false }))
        //         const newTab: Tab = {
        //             name: fileName,
        //             path: filePath,
        //             isActive: true,
        //             isPreview: false,
        //         }
        //         const previewIndex = newTabs.findIndex(t => t.isPreview)
        //         if (previewIndex !== -1) {
        //             newTabs[previewIndex] = newTab
        //         } else {
        //             newTabs.push(newTab)
        //         }
        //     }
        //     return newTabs
        // })
    }, [activeIconID])

    // Handle menu open
    const handleDropDownMenuOpen = useCallback((node: ISceneNode) => {
        console.log('Context menu opened for node:', node.name)
        if (localFileTree === null || remoteFileTree === null) {
            return
        }
        node.scenarioNode.handleDropDownMenuOpen(node)
    }, [localFileTree, remoteFileTree])

    // Handle creation success
    const handleCreationSuccess = useCallback(async (resourceTree: SceneTree, creationType: 'schema' | 'patch') => {
        if (!resourceTree) return

        const parentNodeName = creationType === 'schema' ? 'schemas' : 'patches'
        const parentNode = Array.from(resourceTree.root.children.values()).find(n => n.scenarioNode.name === parentNodeName)

        if (parentNode) {
            resourceTree.markAsDirty(parentNode.key)
            await resourceTree.alignNodeInfo(parentNode)
        }
    }, [])

    // Handle drag tag on tabBar
    const handleTabDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return
        }

        const nodes = Array.from(localFileTree?.editingNodes || []).concat(Array.from(remoteFileTree?.editingNodes || []))
        const prevTabs: Tab[] = []
        nodes.forEach(node=> {
            const _n: SceneNode = node as SceneNode
            if (_n.tab) {
                prevTabs.push(_n.tab)
            }
        })
        const [reorderedItem] = prevTabs.splice(result.source.index, 1)
        prevTabs.splice(result.destination.index, 0, reorderedItem)
        const _tabNames: string[] = []  
        prevTabs.forEach(tab => {
            _tabNames.push(tab.name)
        })
        setTabNames(_tabNames)
    }

    const mainEditorAreaComponent = (tree: SceneTree) => {
        if (tree.editingNodes.size === 0) {
            return(
                <MapContainer />
            )
        }
        // if (tree.)
    }

    return (
        <div className="flex h-screen bg-gray-900">
            {/* Activity Bar */}
            <IconBar
                currentActiveId={activeIconID}
                clickHandlers={iconClickHandlers}
            />

            {/* Resource Tree Panel */}
            <ResourceTreeComponent
                localTree={localFileTree}
                remoteTree={remoteFileTree}
                getLocalTree={getLocalTree}
                getRemoteTree={getRemoteTree}
                onOpenFile={handleOpenFile}
                onPinFile={handlePinFile}
                onDropDownMenuOpen={handleDropDownMenuOpen}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* 这里可以添加TabBar和其他组件 */}
                {/* Tab Bar */}
                <TabBar
                    tabNames={tabNames}
                    localTree={localFileTree}
                    remoteTree={remoteFileTree}
                    onTabDragEnd={handleTabDragEnd}
                />
                <div className="flex-1 bg-gray-100">
                    {/* 主编辑器区域 */}
                    {/* {mainEditorAreaComponent()} */}
                    <MapContainer />
                    {/* {  && <CreatePage/>} */}
                </div>
            </div>


            {/* Main Content */}
            {/* < div className="flex-1 flex flex-col" > */}
            {/* Tab Bar */}
            {/* < TabBar
                    tabs={tabs || []}
                    setActiveTab={setActiveTab}
                    closeTab={handleCloseTab}
                    pinFile={handlePinFile}
                    onTabDragEnd={handleTabDragEnd}
                /> */}

            {/* Main Editor Area */}
            {/* < div className="flex-1 overflow-hidden" >
                    {mainEditorAreaComponent()}
                </div> */}
            {/* </div > */}
        </div >
    )
}

export default function Framework() {
    return (
        <FrameworkComponent />
    )
}