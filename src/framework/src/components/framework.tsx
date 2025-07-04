import React, { 
    useState,
    useEffect,
    useCallback,
} from 'react'
import store from '@/store'
import TabBar from './tabBar/tabBar'
import { Tab } from './tabBar/types'
import IconBar from './iconBar/iconBar'
import { DropResult } from '@hello-pangea/dnd'
import { ISceneNode } from '@/core/scene/iscene'
import CreatePage from './functionPage/createPage'
import MapContainer from './mapContainer/mapContainer'
import { ICON_REGISTRY } from '@/resource/iconRegistry'
import { SceneNode, SceneTree } from './resourceScene/scene'
import { IconBarClickHandlers } from '@/components/iconBar/types'
import ResourceTreeComponent from './resourceScene/sceneComponent'

const MainEditorArea: React.FC<{ nodeStack: ISceneNode[] }> = ({ nodeStack }) => {
    if (nodeStack.length === 0) {
        return <MapContainer node={null} />
    }

    const editingNode = nodeStack[nodeStack.length - 1]
    console.debug('Rendering main editor area for node:', editingNode)
    return <CreatePage node={editingNode} />
}

function FrameworkComponent() {
    const [tabs, setTabs] = useState<Set<Tab>>(new Set())
    const [treeGeneration, setTreeGeneration] = useState(0)
    const [nodeStack, setNodeStack] = useState<ISceneNode[]>([])
    const [activeIconID, setActiveIconID] = useState('grid-editor')
    const [getLocalTree, setGetLocalTree] = useState<boolean>(false)
    const [getRemoteTree, setGetRemoteTree] = useState<boolean>(false)
    const [privateTree, setLocalFileTree] = useState<SceneTree | null>(null)
    const [publicTree, setRemoteFileTree] = useState<SceneTree | null>(null)
    const [focusNode, setFocusNode] = useState<ISceneNode | undefined>(undefined)

    // Default icon click handlers: all icon have the same clicking behavior
    const iconClickHandlers: IconBarClickHandlers = {}
    ICON_REGISTRY.forEach(icon => {
        iconClickHandlers[icon.id] = (iconID: string) => {
            console.debug('Clicked icon:', icon.id, 'with activityId:', iconID)
            setActiveIconID(iconID)
        }
    })

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
    }, [])

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
    }, [])

    // Handle menu open
    const handleNodeMenuOpen = useCallback((node: ISceneNode) => {
        if (privateTree === null || publicTree === null) {
            return
        }

        const _privateTree = privateTree as SceneTree
        const _publicTree = publicTree as SceneTree
        const _tree = node.tree as SceneTree

        // Set the selected node in the other tree as null
        _privateTree.selectedNode = null
        _publicTree.selectedNode = null
        _tree.selectedNode = node

        node.scenarioNode.handleMenuOpen(node)
    }, [privateTree, publicTree])

    // Handle open node editing tab
    const handleNodeStartEditing = useCallback((node: ISceneNode) => {
        console.debug('Opening node editing tab:', node)

        // Deactivate the active node
        if (nodeStack.length > 0) {
            (nodeStack[nodeStack.length - 1] as SceneNode).tab.isActive = false
        }

        const _node = node as SceneNode
        _node.tab.isActive = true

         // Add the node tab to the tabs
        if (tabs.has(_node.tab)) return

        tabs.add(_node.tab)
        nodeStack.push(_node)
        setTabs(new Set(tabs))
        setNodeStack([...nodeStack])

    }, [tabs, nodeStack])

    // Handle close node editing tab
    const handleNodeStopEditing = useCallback((node: ISceneNode) => {
        console.debug('Closing node editing tab:', node)

        const _node = node as SceneNode
        _node.tab.isActive = false

        // Remove the node tab from the tabs
        tabs.delete(_node.tab)
        const newNodeStack = nodeStack.filter(n => {
            const _n = n as SceneNode
            return _n.tab.id != _node.tab.id
        })

        // Activate the last picked node
        if (newNodeStack.length > 0) {
            const lastNode = newNodeStack[newNodeStack.length - 1] as SceneNode
            lastNode.tab.isActive = true
        }

        // Update state
        setTabs(new Set(tabs))
        setNodeStack(newNodeStack)

    }, [tabs, nodeStack])

    const handleNodeFocused = useCallback((node: ISceneNode) => {
        setFocusNode(undefined)
    }, [])

    const handleTabClick = useCallback((tab: Tab) => {
        const [domain, path] = tab.id.split(':')
        const isPublic = domain === 'public'
        const tree = isPublic ? publicTree : privateTree
        const _privateTree = privateTree as SceneTree
        const _publicTree = publicTree as SceneTree

        if (tree === null || nodeStack.length === 0) return

        // Skip if click the same tab
        const activateNode = nodeStack[nodeStack.length - 1] as SceneNode
        if (activateNode.tab.id === tab.id) return

        // Freeze the state of the previous active node
        activateNode.scenarioNode.freezeMap(activateNode)

        // Deactivate the active node
        ;(nodeStack[nodeStack.length - 1] as SceneNode).tab.isActive = false

        // Get and activate node tab
        const node = tree.scene.get(path)! as SceneNode
        node.tab.isActive = true

        // Add picked tab to the end of the stack
        const newNodeStack = nodeStack.filter(n => n.key !== tab.id)
        newNodeStack.push(node)

        // Set the selected node in the other tree as null
        tree.isRemote ? (_privateTree.selectedNode = null) : (_publicTree.selectedNode = null)

        // Select the current node
        tree.selectedNode = node

        // Melt the state of the previous active node
        node.scenarioNode.meltMap(node)

        // Update state
        setFocusNode(node)
        setNodeStack(newNodeStack)

    }, [nodeStack, publicTree, privateTree])

    // Handle drag tag on tabBar
    const handleTabDragEnd = useCallback((result: DropResult) => {
        if (!result.destination) {
            return
        }

        const prevTabs: Tab[] = [...tabs]
        const [reorderedItem] = prevTabs.splice(result.source.index, 1)
        prevTabs.splice(result.destination.index, 0, reorderedItem)

        setTabs(new Set(prevTabs))

        console.debug('Reordered tabs:', prevTabs.map(t => t.name))
    }, [tabs])

    const handleNodeClickEnd = useCallback((node: ISceneNode) => {
        const _node = node as SceneNode
        
        // Check if the node is already in the stack
        const existingIndex = nodeStack.findIndex(n => {
            const _n = n as SceneNode
            return _n.tab.id === _node.tab.id
        })

        // If the node is already in the stack and not active, activate it
        if (existingIndex !== -1 && !_node.tab.isActive) {
            // Deactivate the active node
            if (nodeStack.length > 0) {
                (nodeStack[nodeStack.length - 1] as SceneNode).tab.isActive = false
            }

            const newNodeStack = nodeStack.filter((_, index) => index !== existingIndex)
            newNodeStack.push(_node)
            _node.tab.isActive = true
            setNodeStack(newNodeStack)
        }
    }, [nodeStack])

    // Init DomResourceTree
    useEffect(() => {
        const initTree = async () => {
            try {
                const _localTree = await SceneTree.create(false)
                const _remoteTree = await SceneTree.create(true)

                // Subscribe to tree update
                _localTree.subscribe(() => {
                    setTreeGeneration(prev => prev + 1)
                })
                _remoteTree.subscribe(() => {
                    setTreeGeneration(prev => prev + 1)
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

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-red-900">
            {/* Activity Bar */}
            <IconBar
                currentActiveId={activeIconID}
                clickHandlers={iconClickHandlers}
            />

            {/* Resource Tree Panel */}
            <ResourceTreeComponent
                localTree={privateTree}
                remoteTree={publicTree}
                getLocalTree={getLocalTree}
                getRemoteTree={getRemoteTree}
                focusNode={focusNode}
                onOpenFile={handleOpenFile}
                onPinFile={handlePinFile}
                onDropDownMenuOpen={handleNodeMenuOpen}
                onNodeStartEditing={handleNodeStartEditing}
                onNodeStopEditing={handleNodeStopEditing}
                onNodeClickEnd={handleNodeClickEnd}
                onNodeFocused={handleNodeFocused}
            />

            {/* Main Content Area */}
            <div className="flex flex-col flex-1">
                {/* Tab Bar */}
                <TabBar
                    tabs={tabs}
                    localTree={privateTree}
                    remoteTree={publicTree}
                    onTabDragEnd={handleTabDragEnd}
                    onTabClick={handleTabClick}
                />
                <div className="flex-1 bg-gray-100 h-[50vh]">
                    <MainEditorArea nodeStack={nodeStack}/>
                </div>
            </div>
        </div >
    )
}

export default function Framework() {
    return (
        <FrameworkComponent />
    )
}