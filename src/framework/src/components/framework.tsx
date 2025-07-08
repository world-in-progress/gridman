import { 
    useRef,
    useState,
    useEffect,
    useReducer,
    useCallback,
} from 'react'
import store from '@/store'
import TabBar from './tabBar/tabBar'
import { Tab } from './tabBar/types'
import IconBar from './iconBar/iconBar'
import { DropResult } from '@hello-pangea/dnd'
import { ISceneNode } from '@/core/scene/iscene'
import ResorucePage from './functionPage/createPage'
import { ICON_REGISTRY } from '@/resource/iconRegistry'
import ContextStorage from '@/core/context/contextStorage'
import { SceneNode, SceneTree } from './resourceScene/scene'
import { IconBarClickHandlers } from '@/components/iconBar/types'
import ResourceTreeComponent from './resourceScene/sceneComponent'

function FrameworkComponent() {
    const nodeTabs = useRef<Tab[]>([])
    const nodeStack = useRef<ISceneNode[]>([])
    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    const [triggerFocus, setTriggerFocus] = useState(0) // used to force re-render of ResourceTreeComponent when focusNode changes
    const [activeIconID, setActiveIconID] = useState('grid-editor')
    const [focusNode, setFocusNode] = useState<ISceneNode | null>(null)
    const [publicTree, setPublicFileTree] = useState<SceneTree | null>(null)
    const [privateTree, setPrivateFileTree] = useState<SceneTree | null>(null)

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
    const handleNodeMenuOpen = useCallback((node: ISceneNode, menuItem: any) => {
        if (privateTree === null || publicTree === null) return

        const _privateTree = privateTree as SceneTree
        const _publicTree = publicTree as SceneTree
        const _tree = node.tree as SceneTree

        // Select the node
        _privateTree.selectedNode = null
        _publicTree.selectedNode = null
        _tree.selectedNode = node

        node.scenarioNode.handleMenuOpen(node, menuItem)

    }, [privateTree, publicTree])

    // Handle open node editing tab
    const handleNodeStartEditing = useCallback((node: ISceneNode) => {
        if (privateTree === null || publicTree === null) return

        console.debug('Opening node editing tab:', node)
        const _node = node as SceneNode

        // Add the node tab to the tabs and stack if it doesn't exist
        const existingIndex = nodeStack.current.findIndex(n => n.id === _node.id)
        if (existingIndex === -1) {
            nodeStack.current.push(_node)
            nodeTabs.current.push(_node.tab)
        }
        
        // Focus on this node
        setFocusNode(_node)

    }, [privateTree, publicTree])

    // Handle close node editing tab
    const handleNodeStopEditing = useCallback((node: ISceneNode) => {
        if (privateTree === null || publicTree === null) return

        console.debug('Closing node editing tab:', node)
        const _node = node as SceneNode

        // Remove the node tab from the tabs and stack
        nodeStack.current = nodeStack.current.filter(n => {
            const _n = n as SceneNode
            return _n.id != _node.id
        })
        nodeTabs.current = nodeTabs.current.filter(t => {
            const _t = t as Tab
            return _t.node.id != _node.id
        })

        // Deselect the node
        privateTree.selectedNode = null
        publicTree.selectedNode = null

        // Activate the last editing node
        if (nodeStack.current.length > 0) {
            const lastNode = nodeStack.current[nodeStack.current.length - 1] as SceneNode
            lastNode.tree.selectedNode = lastNode
            setFocusNode(lastNode)
        } else {
            setFocusNode(null)
        }

    }, [privateTree, publicTree])

    const handleNodeRemove = useCallback((node: ISceneNode) => {
        if (privateTree === null || publicTree === null) return

        const _node = node as SceneNode
        const tree = _node.tree as SceneTree

        // Reselect:
        publicTree.selectedNode = null
        privateTree.selectedNode = null

        // The node's parent or null
        // - if the currently focused node is the removed one
        if (focusNode && focusNode.id === _node.id) {
            if (_node.parent) {
                tree.selectedNode = _node.parent
                tree.editingNodeIds.has(_node.parent.id) && setFocusNode(_node.parent)
            }
            else setFocusNode(null)
            setTriggerFocus(prev => prev + 1)
        }
        // The currently focused node
        // - if the currently focused node is not the removed one
        else if (focusNode && focusNode.id !== _node.id) {
            console.debug(`currently focused node ${focusNode.id} is not the removed node ${_node.id}, reselecting it`);
            (focusNode.tree as SceneTree).selectedNode = focusNode
            setFocusNode(focusNode)
            setTriggerFocus(prev => prev + 1)
        }

    }, [focusNode, publicTree, privateTree])

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
        
        const [reorderedItem] = nodeTabs.current.splice(result.source.index, 1)
        nodeTabs.current.splice(result.destination.index, 0, reorderedItem)

        console.debug('Reordered tabs:', nodeTabs.current.map(t => t.name))
        
    }, [])

    const handleNodeClick = useCallback((node: ISceneNode) => {
        const _node = node as SceneNode

        // Deselect all nodes in the trees
        if (privateTree === null || publicTree === null) return
        privateTree.selectedNode = null
        publicTree.selectedNode = null
        _node.tree.selectedNode = _node
    }, [privateTree, publicTree])

    /**
     * Double click
     * Focus on the clicked node, and force tabBar, page to re-render.
     */
    const handleNodeDoubleClick = useCallback((node: ISceneNode) => {
        const _node = node as SceneNode

        // Deselect all nodes in the trees
        if (privateTree === null || publicTree === null) return
        privateTree.selectedNode = null
        publicTree.selectedNode = null

        // Set the clicked node as the selected node
        _node.tree.selectedNode = _node
        
        // Check if the node is already in the stack
        const existingIndex = nodeStack.current.findIndex(n => {
            const _n = n as SceneNode
            return _n.tab.node.id === _node.tab.node.id
        })

        // If the node is already in the stack and not focused, focus on it
        if (focusNode && existingIndex !== -1 && focusNode.id !== _node.id) {
            setFocusNode(_node)
            setTriggerFocus(prev => prev + 1)
        }

    }, [focusNode, privateTree, publicTree])

    // Init DomResourceTree
    useEffect(() => {
        const initTree = async () => {
            try {
                const _privateTree = await SceneTree.create(false)
                const _publicTree = await SceneTree.create(true)

                // Subscribe to tree updates
                _privateTree.subscribe(triggerRepaint)
                _publicTree.subscribe(triggerRepaint)

                // Update the state with the initialized trees
                setPrivateFileTree(_privateTree)
                setPublicFileTree(_publicTree)

            } catch (error) {
                console.error('Failed to initialize resource trees:', error)
            }
        }
        initTree()

        // Init contextDB
        const contextDB = new ContextStorage()
        store.set('contextDB', contextDB)
    }, [])

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#1E1E1E]">
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
                onOpenFile={handleOpenFile}
                onPinFile={handlePinFile}
                onDropDownMenuOpen={handleNodeMenuOpen}
                onNodeStartEditing={handleNodeStartEditing}
                onNodeStopEditing={handleNodeStopEditing}
                onNodeClick={handleNodeClick}
                onNodeDoubleClick={handleNodeDoubleClick}
                onNodeRemove={handleNodeRemove}
            />
            {/* Main Content Area */}
            <div className='flex flex-col flex-1'>
                {/* Tab Bar */}
                <TabBar
                    focusNode={focusNode as SceneNode | null}
                    triggerFocus={triggerFocus}
                    tabs={nodeTabs.current}
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