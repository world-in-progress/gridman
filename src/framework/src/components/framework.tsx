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
import ResourcePage from './functionPage/createPage'
import { ICON_REGISTRY } from '@/resource/iconRegistry'
import ContextStorage from '@/core/context/contextStorage'
import { SceneNode, SceneTree } from './resourceScene/scene'
import { IconBarClickHandlers } from '@/components/iconBar/types'
import ResourceTreeComponent from './resourceScene/sceneComponent'
import Hello from './hello/hello'

function FrameworkComponent() {
    // Framework-related ref and state
    const nodeTabs = useRef<Tab[]>([])
    const nodeStack = useRef<ISceneNode[]>([])
    const [, triggerRepaint] = useReducer(x => x + 1, 0)

    const [triggerFocus, setTriggerFocus] = useState(0) // used to force re-render of ResourceTreeComponent when focusNode changes
    const [activeIconID, setActiveIconID] = useState('grid-editor')
    const [focusNode, setFocusNode] = useState<ISceneNode | null>(null)
    const [publicTree, setPublicFileTree] = useState<SceneTree | null>(null)
    const [privateTree, setPrivateFileTree] = useState<SceneTree | null>(null)
    
    // Resizing-related ref and state
    const resizeRef = useRef<HTMLDivElement>(null)
    const throttledWheelHandlerRef = useRef<any>(null)

    const [isResizing, setIsResizing] = useState(false)
    const [screenWidth, setScreenWidth] = useState(1600) // default screen width
    const [resourceTreeWidth, setResourceTreeWidth] = useState(200) // default 200px
    const [lastResourceTreeWidth, setLastResourceTreeWidth] = useState(200) // record last width
    const [isResourceTreeCollapsed, setIsResourceTreeCollapsed] = useState(false)

    const iconBarWidth = 40

    // Calculate actual width based on collapse state
    const actualResourceTreeWidth = isResourceTreeCollapsed ? 0 : resourceTreeWidth

    // Viewport size (visible area)
    const viewportWidth = screenWidth - iconBarWidth - actualResourceTreeWidth    

    // Content size (page rendering area)
    const contentWidth = screenWidth - iconBarWidth // always full screen width

    // Enable horizontal scroll when content exceeds viewport
    const needsHorizontalScroll = contentWidth > viewportWidth

    // Default icon click handlers: all icon have the same clicking behavior
    const iconClickHandlers: IconBarClickHandlers = {}
    ICON_REGISTRY.forEach(icon => {
        iconClickHandlers[icon.id] = (iconID: string) => {

            if (icon.id === 'grid-editor') {
                if (activeIconID === 'grid-editor') {
                    if (isResourceTreeCollapsed) {
                        setIsResourceTreeCollapsed(false)
                        setResourceTreeWidth(lastResourceTreeWidth)
                    } else {
                        setLastResourceTreeWidth(resourceTreeWidth)
                        setIsResourceTreeCollapsed(true)
                    }
                } else {
                    setActiveIconID(iconID)
                    if (isResourceTreeCollapsed) {
                        setIsResourceTreeCollapsed(false)
                        setResourceTreeWidth(lastResourceTreeWidth || 200)
                    }
                }
            } else {
                setActiveIconID(iconID)
            }
        }
    })

    //////////////////////////////////////////////////////////////
    // Handlers //////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////

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

    // Handle opening menu
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

    // Handle opening node editing tab
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

    // Handle closing node editing tab
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

    // Handle removing node from its parent
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

    // Handle clicking tab
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

    // Handle action after dragging tab on tabBar
    const handleTabDragEnd = useCallback((result: DropResult) => {
        if (!result.destination) {
            return
        }
        
        const [reorderedItem] = nodeTabs.current.splice(result.source.index, 1)
        nodeTabs.current.splice(result.destination.index, 0, reorderedItem)

        console.debug('Reordered tabs:', nodeTabs.current.map(t => t.name))
        
    }, [])

    // Handle clicking node
    const handleNodeClick = useCallback((node: ISceneNode) => {
        const _node = node as SceneNode

        // Deselect all nodes in the trees
        if (privateTree === null || publicTree === null) return
        privateTree.selectedNode = null
        publicTree.selectedNode = null
        _node.tree.selectedNode = _node
    }, [privateTree, publicTree])

    /**
     * Handle double clicking node
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

    // Handle mouse down for resizing
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        setIsResizing(true)
        e.preventDefault()
        // Add visual feedback for better UX
        document.body.classList.add('resizing')
    }, [])

    // Handle mouse move for resizing
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizing) return
        
        const containerRect = resizeRef.current?.getBoundingClientRect()
        if (!containerRect) return
        
        const newWidth = e.clientX - containerRect.left - iconBarWidth
        const minWidth = 150 // minimum width
        const maxWidth = screenWidth * 0.8 // maximum 80% of screen width
        const collapseThreshold = 50 // threshold to collapse the tree

        // Check if the tree explorer should be collapsed
        if (newWidth < minWidth - collapseThreshold) {
            if (!isResourceTreeCollapsed) {
                setLastResourceTreeWidth(resourceTreeWidth) // save current width before collapsing
                setIsResourceTreeCollapsed(true)
            }
            return
        }

        // Check if the tree explorer should be expanded
        if (isResourceTreeCollapsed && newWidth > minWidth) {
            setIsResourceTreeCollapsed(false)
            setResourceTreeWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)))
            return
        }

        // Normal width adjustment (only when not collapsed)
        if (!isResourceTreeCollapsed) {
            const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
            setResourceTreeWidth(clampedWidth)
        }

    }, [isResizing, screenWidth, iconBarWidth, resourceTreeWidth, isResourceTreeCollapsed])

    // Handle mouse up for resizing
    const handleMouseUp = useCallback(() => {
        setIsResizing(false)
        document.body.classList.remove('resizing')
    }, [])

    //////////////////////////////////////////////////////////////
    // Effects ///////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////

    useEffect(() => {
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = 'col-resize'
            document.body.style.userSelect = 'none'
        } else {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            document.body.style.cursor = ''
            document.body.style.userSelect = ''
        }
    }, [isResizing, handleMouseMove, handleMouseUp])

    // Set up keyboard shortcuts
    useEffect(() => {
        // Ctrl/Cmd + B to toggle resource tree
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                e.preventDefault()
                if (isResourceTreeCollapsed) {
                    setIsResourceTreeCollapsed(false)
                    setResourceTreeWidth(lastResourceTreeWidth || 200)
                } else {
                    setLastResourceTreeWidth(resourceTreeWidth)
                    setIsResourceTreeCollapsed(true)
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)

    }, [isResourceTreeCollapsed, resourceTreeWidth, lastResourceTreeWidth])
    
    // Set initial screen width and handle resize events
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setScreenWidth(window.innerWidth)
            
            const handleResize = () => {
                setScreenWidth(window.innerWidth)
            }
            
            window.addEventListener('resize', handleResize)
            return () => window.removeEventListener('resize', handleResize)
        }
    }, [setScreenWidth])

    // Throttle function for horizontal scroll handling
    // This will prevent excessive scroll events from causing performance issues
    useEffect(() => {
        const throttle = (func: Function, delay: number) => {
            let timeoutId: NodeJS.Timeout | null = null
            let lastExecTime = 0
            
            return function (...args: any[]) {
                const currentTime = Date.now()
                
                if (currentTime - lastExecTime > delay) {
                    func.apply(func, args)
                    lastExecTime = currentTime
                } else {
                    if (timeoutId) clearTimeout(timeoutId)
                    timeoutId = setTimeout(() => {
                        func.apply(func, args)
                        lastExecTime = Date.now()
                    }, delay - (currentTime - lastExecTime))
                }
            }
        }

        throttledWheelHandlerRef.current = throttle((e: WheelEvent, viewport: HTMLElement) => {
            const isHorizontalIntent = e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)
            
            if (isHorizontalIntent) {
                e.preventDefault()
                const scrollAmount = e.shiftKey ? e.deltaY : e.deltaX
                viewport.scrollLeft += scrollAmount
            }
        }, 16)
    }, [])

    // Add horizontal scroll handling to the content viewport
    // This will allow horizontal scrolling when the content exceeds the viewport width
    // and the user scrolls with the mouse wheel while holding Shift key
    useEffect(() => {
        if (needsHorizontalScroll) {
            const viewport = document.querySelector('.content-viewport')

            const handleWheel = (e: Event) => {
                if (e instanceof WheelEvent) {
                    throttledWheelHandlerRef.current(e, viewport)
                }
            }
            
            viewport?.addEventListener('wheel', handleWheel, { passive: false })
            
            return () => {
                viewport?.removeEventListener('wheel', handleWheel)
            }
        }
    }, [needsHorizontalScroll])

    // Init Resource Trees
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
        <div ref={resizeRef} className='flex h-screen w-screen overflow-hidden bg-[#1E1E1E]'>
            {/* Activity Bar */}
            <IconBar
                currentActiveId={activeIconID}
                clickHandlers={iconClickHandlers}
            />
            {/* Resource Tree Panel - Resizable */}
            {!isResourceTreeCollapsed && (
                <div
                    className='relative border-r border-gray-700 flex-shrink-0'
                    style={{ width: `${resourceTreeWidth}px` }}
                >
                    <ResourceTreeComponent
                        focusNode={focusNode}
                        triggerFocus={triggerFocus}
                        privateTree={privateTree}
                        publicTree={publicTree}
                        onOpenFile={handleOpenFile}
                        onPinFile={handlePinFile}
                        onNodeMenuOpen={handleNodeMenuOpen}
                        onNodeStartEditing={handleNodeStartEditing}
                        onNodeStopEditing={handleNodeStopEditing}
                        onNodeClick={handleNodeClick}
                        onNodeDoubleClick={handleNodeDoubleClick}
                        onNodeRemove={handleNodeRemove}
                    />
                    {/* Resize Handle */}
                    <div
                        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize transition-all duration-200 ${
                            isResizing ? 'bg-blue-500 w-1' : 'bg-transparent hover:bg-blue-400'
                        } group`}
                        onMouseDown={handleMouseDown}
                    >
                        {/* Visible handle indicator */}
                        <div className={`absolute top-1/2 right-0 -translate-y-1/2 w-1 h-8 bg-gray-600 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                            isResizing ? 'opacity-100 bg-blue-500' : ''
                        }`} />
                    </div>
                </div>
            )}
            {/* Main Content Area */}
            <div className='main-content-area'>
                {/* Fixed TabBar - no horizontal scroll */}
                <div className='tab-bar-container'>
                    <TabBar
                        focusNode={focusNode as SceneNode | null}
                        triggerFocus={triggerFocus}
                        tabs={nodeTabs.current}
                        localTree={privateTree}
                        remoteTree={publicTree}
                        onTabDragEnd={handleTabDragEnd}
                        onTabClick={handleTabClick}
                        width={viewportWidth}
                    />
                </div>

                {/* Scrollable content area */}
                {nodeStack.current.length > 0 && (
                    <div
                        className={`content-viewport ${needsHorizontalScroll ? 'scrollable' : 'no-scroll'}`}
                    >
                        <div className='content-canvas' style={{ width: `${contentWidth}px` }}>
                            {/* ResourcePage */}
                            <ResourcePage node={focusNode!} />
                        </div>
                    </div>
                )}

                {/* Hello Page */}
                {nodeStack.current.length === 0 && <Hello/>}
            </div>
        </div >
    )
}

export default function Framework() {
    return (
        <FrameworkComponent />
    )
}