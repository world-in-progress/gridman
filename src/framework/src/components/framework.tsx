import { useState, useCallback, useEffect, useRef, use } from "react"
import TabBar from "./tabBar/tabBar"
import IconBar from "./iconBar/iconBar"
import { MapContainerHandles } from "./mapContainer/mapContainer"
import { Tab } from "./types"
import { ISceneNode } from "@/core/scene/iscene"
import store from '@/store'

import { ICON_REGISTRY } from '@/resource/iconRegistry'
import { IconBarClickHandlers } from '@/components/iconBar/types'
import { SceneTree } from "./resourceScene/scene"
import ResourceTreeComponent from "./resourceScene/sceneComponent"

function FrameworkComponent() {

    const [tabs, setTabs] = useState<Tab[]>([])
    const [treeGeneration, setTreeGeneration] = useState(0)
    const [getLocalTree, setGetLocalTree] = useState<boolean>(false)
    const [getRemoteTree, setGetRemoteTree] = useState<boolean>(false)
    const [localFileTree, setLocalFileTree] = useState<SceneTree | null>(null)
    const [remoteFileTree, setRemoteFileTree] = useState<SceneTree | null>(null)
    const [activeIconID, setActiveIconID] = useState('grid-editor')
    const mapRef = useRef<MapContainerHandles>(null)

    // Default icon click handlers: all icon have the same clicking behavior
    const iconClickHandlers: IconBarClickHandlers = {}
    ICON_REGISTRY.forEach(icon => {
        iconClickHandlers[icon.id] = (iconID: string) => {
            console.log('Clicked icon:', icon.id, 'with activityId:', iconID)
            setActiveIconID(iconID)
            setTabs(tabs.map(t => ({ ...t, isActive: t.activityId === iconID })))
        }
    })

    // Init DomResourceTree
    useEffect(() => {
        const initTree = async () => {
            try {
                const _localTree = await SceneTree.create(false)
                const _remoteTree = await SceneTree.create(true)

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
        setTabs(prevTabs => {
            const existingPinnedTab = prevTabs.find(t => t.path === filePath && !t.isPreview)
            if (existingPinnedTab) {
                return prevTabs.map(t => ({ ...t, isActive: t.path === filePath }))
            }

            const newTabs = prevTabs.map(t => ({ ...t, isActive: false }))
            const previewIndex = newTabs.findIndex(t => t.isPreview)

            const newTab: Tab = {
                id: filePath,
                name: fileName,
                path: filePath,
                isActive: true,
                activityId: activeIconID,
                isPreview: true,
            }

            if (previewIndex !== -1) {
                newTabs[previewIndex] = newTab
            } else {
                newTabs.push(newTab)
            }

            return newTabs
        })
    }, [activeIconID])

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
                    activityId: activeIconID,
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
    }, [activeIconID])

    // Handle menu open
    const handleDropDownMenuOpen = useCallback((node: ISceneNode, isRemote: boolean) => {
        console.log('Context menu opened for node:', node.name, 'isRemote:', isRemote)
        if (localFileTree === null || remoteFileTree === null) {
            return
        }
        const tree = isRemote ? remoteFileTree : localFileTree
        node.scenarioNode.handleDropDownMenuOpen(node, tree)
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
                <div className="flex-1 bg-gray-100">
                    {/* 主编辑器区域 */}
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