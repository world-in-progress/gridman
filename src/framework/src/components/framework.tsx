import React, { 
    useState,
    useEffect,
    useCallback,
    useReducer,
    useRef,
} from 'react'
import TabBar from './tabBar/tabBar'
import { Tab } from './tabBar/types'
import IconBar from './iconBar/iconBar'
import { DropResult } from '@hello-pangea/dnd'
import { ISceneNode } from '@/core/scene/iscene'
import ResorucePage from './functionPage/createPage'
import MapContainer from './mapContainer/mapContainer'
import { ICON_REGISTRY } from '@/resource/iconRegistry'
import { SceneNode, SceneTree } from './resourceScene/scene'
import { IconBarClickHandlers } from '@/components/iconBar/types'
import ResourceTreeComponent from './resourceScene/sceneComponent'

function FrameworkComponent() {
    const nodeStack = useRef<ISceneNode[]>([])
    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    const [triggerFocus, setTriggerFocus] = useState(0)
    const [tabs, setTabs] = useState<Set<Tab>>(new Set())
    const [activeIconID, setActiveIconID] = useState('grid-editor')
    const [getPublicTree, setGetPublicTree] = useState<boolean>(false)
    const [getPrivateTree, setGetPrivateTree] = useState<boolean>(false)
    const [publicTree, setPublicFileTree] = useState<SceneTree | null>(null)
    const [privateTree, setPrivateFileTree] = useState<SceneTree | null>(null)
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
        const _node = node as SceneNode

        // Add the node tab to the tabs
        if (tabs.has(_node.tab)) return

        tabs.add(_node.tab)
        nodeStack.current.push(_node)
        
        setFocusNode(_node)
        setTabs(new Set(tabs))

    }, [tabs])

    // Handle close node editing tab
    const handleNodeStopEditing = useCallback((node: ISceneNode) => {
        console.debug('Closing node editing tab:', node)

        const _node = node as SceneNode
        // _node.tab.isActive = false

        // Remove the node tab from the tabs
        tabs.delete(_node.tab)
        nodeStack.current = nodeStack.current.filter(n => {
            const _n = n as SceneNode
            return _n.id != _node.id
        })

        // Activate the last picked node
        if (nodeStack.current.length > 0) {
            const lastNode = nodeStack.current[nodeStack.current.length - 1] as SceneNode
            setFocusNode(lastNode)
        } else {
            setFocusNode(undefined)
        }

        // Update state
        setTabs(new Set(tabs))

    }, [tabs])

    const handleTabClick = useCallback((tab: Tab) => {
        const node = tab.node as SceneNode
        const isPublic = node.tree.isPublic
        const _publicTree = publicTree as SceneTree
        const _privateTree = privateTree as SceneTree
        const tree = isPublic ? publicTree : privateTree

        if (tree === null || nodeStack.current.length === 0) return

        // Select the current node
        _privateTree.selectedNode = null
        _publicTree.selectedNode = null
        tree.selectedNode = node

        // Update state
        setFocusNode(node)
        setTriggerFocus(prev => prev + 1)

    }, [publicTree, privateTree])

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
        const existingIndex = nodeStack.current.findIndex(n => {
            const _n = n as SceneNode
            return _n.tab.node.id === _node.tab.node.id
        })

        // If the node is already in the stack and not focused, focus on it
        if (focusNode && existingIndex !== -1 && focusNode.id !== _node.id) {
            setFocusNode(_node)
        }
    }, [focusNode])

    // Init DomResourceTree
    useEffect(() => {
        const initTree = async () => {
            try {
                const _privateTree = await SceneTree.create(false)
                const _publicTree = await SceneTree.create(true)

                // Subscribe to tree updates
                _privateTree.subscribe(triggerRepaint)
                _publicTree.subscribe(triggerRepaint)

                setPrivateFileTree(_privateTree)
                setPublicFileTree(_publicTree)
                setGetPrivateTree(true)
                setGetPublicTree(true)

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
                focusNode={focusNode}
                triggerFocus={triggerFocus}
                privateTree={privateTree}
                publicTree={publicTree}
                getPrivateTree={getPrivateTree}
                getPublicTree={getPublicTree}
                onOpenFile={handleOpenFile}
                onPinFile={handlePinFile}
                onDropDownMenuOpen={handleNodeMenuOpen}
                onNodeStartEditing={handleNodeStartEditing}
                onNodeStopEditing={handleNodeStopEditing}
                onNodeClickEnd={handleNodeClickEnd}
            />
            {/* Main Content Area */}
            <div className='flex flex-col flex-1'>
                {/* Tab Bar */}
                <TabBar
                    focusNode={focusNode as SceneNode | null}
                    tabs={tabs}
                    localTree={privateTree}
                    remoteTree={publicTree}
                    onTabDragEnd={handleTabDragEnd}
                    onTabClick={handleTabClick}
                />
                {/* ResourcePage */}
                <ResorucePage node={focusNode} />
            </div>
        </div >
    )
}

export default function Framework() {
    return (
        <FrameworkComponent />
    )
}