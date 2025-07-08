import React from 'react'
import store from '@/store'
import { Tab } from '../tabBar/types'
import * as api from '@/core/apis/apis'
import { IScenarioNode } from '@/core/scenario/iscenario'
import ContextStorage from '@/core/context/contextStorage'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { SCENARIO_NODE_REGISTRY, SCENARIO_PAGE_CONTEXT_REGISTRY } from '@/resource/scenarioRegistry'

export interface SceneNodeState {
    isLoading: boolean
    isExpanded: boolean
    isSelected: boolean
    contextMenuOpen: boolean
}

export interface SceneNodeActions {
    onSelect: () => void
    onOpenFile: () => void
    onToggleExpand: () => void
    onContextMenu: (e: React.MouseEvent) => void
}

export class SceneNode implements ISceneNode {
    key: string
    tree: SceneTree
    aligned: boolean = false
    parent: ISceneNode | null
    scenarioNode: IScenarioNode
    children: Map<string, ISceneNode> = new Map()

    // SceneNode state
    private _state: SceneNodeState = {
        isExpanded: false,
        isSelected: false,
        isLoading: false,
        contextMenuOpen: false
    }

    // SceneNode actions
    actions: SceneNodeActions | null = null
    
    // Dom-related properties
    tab: Tab
    pageContext: any = undefined // undefined: not editing, null: editing paused, object: editing in progress

    constructor(tree: SceneTree, node_key: string, parent: ISceneNode | null, scenarioNode: IScenarioNode) {
        this.tree = tree
        this.key = node_key
        this.parent = parent
        this.scenarioNode = scenarioNode
        if (this.parent !== null) this.parent.children.set(this.name, this) // bind self to parent

        // Set tab (not active, not preview)
        this.tab = {
            node: this,
            name: this.name,
            isActive: false,
            isPreview: false,
        }
    }

    get name(): string { return this.key.split('.').pop() || '' }
    get id(): string { return (this.tree.isPublic ? 'public' : 'private') + ':' + this.key }
}

export interface TreeUpdateCallback {
    (): void
}

export class SceneTree implements ISceneTree {
    isPublic: boolean
    root!: ISceneNode
    scene: Map<string, ISceneNode> = new Map()

    private handleOpenFile: (fileName: string, filePath: string) => void = () => {}
    private handlePinFile: (fileName: string, filePath: string) => void = () => {}
    private handleNodeMenuOpen: (node: ISceneNode, menuItem: any) => void = () => {}
    private handleNodeStartEditing: (node: ISceneNode) => void = () => {}
    private handleNodeStopEditing: (node: ISceneNode) => void = () => {}
    private handleNodeClickEnd: (node: ISceneNode) => void = () => {}

    private updateCallbacks: Set<TreeUpdateCallback> = new Set()
    private expandedNodes: Set<string> = new Set()
    editingNodes: Set<ISceneNode> = new Set()
    selectedNode: ISceneNode | null = null

    constructor(isRemote: boolean) {
        this.isPublic = isRemote
    }

    /**
     * Bind handlers for various actions in the scene tree.
     * @param handlers Handlers for various actions in the scene tree.
     * This method binds the provided handlers to the scene tree, allowing it to handle file opening,
     * pinning files, opening dropdown menus, and starting/stopping node editing.
     */
    bindHandlers(handlers: {
        openFile: (fileName: string, filePath: string) => void
        pinFile: (fileName: string, filePath: string) => void
        handleNodeMenuOpen: (node: ISceneNode, menuItem: any) => void
        handleNodeStartEditing: (node: ISceneNode) => void
        handleNodeStopEditing: (node: ISceneNode) => void
        handleNodeClickEnd: (node: ISceneNode) => void
    }): void {
        this.handleOpenFile = handlers.openFile
        this.handlePinFile = handlers.pinFile
        this.handleNodeMenuOpen = handlers.handleNodeMenuOpen
        this.handleNodeStartEditing = handlers.handleNodeStartEditing
        this.handleNodeStopEditing = handlers.handleNodeStopEditing
        this.handleNodeClickEnd = handlers.handleNodeClickEnd
    }

    getNodeMenuHandler(): (node: ISceneNode, menuItem: any) => void {
        return this.handleNodeMenuOpen
    }
    
    /**
     * Update the node information from the server.
     * @param node The node to align.
     * @param force Whether to force alignment even if already aligned.
     * @returns A promise that resolves when the alignment is complete.
     */
    async alignNodeInfo(node: ISceneNode, force: boolean = false): Promise<void> {
        if (node.aligned && !force) return

        // Fetch the latest metadata for the node
        const meta = await api.scene.getSceneNodeInfo.fetch({node_key: node.key}, this.isPublic)

        const oldChildrenMap = node.children
        node.children = new Map()
        
        // Update parent-child relationship
        if (meta.children && meta.children.length > 0) {
            for (const child of meta.children) {
                if (node.children.has(child.node_key)) {
                    node.children.set(child.node_key, oldChildrenMap.get(child.node_key)!)
                    continue // skip if child node already exists
                }

                const childNode = new SceneNode(this, child.node_key, node, new SCENARIO_NODE_REGISTRY[child.scenario_path]())
                this.scene.set(childNode.key, childNode) // add child node to the scene map
            }
        }
        
        // Release the old children map
        oldChildrenMap.clear()

        // Mark as aligned after loading
        node.aligned = true
    }

    /**
     * Set the root node for the scene tree.
     * @param root The root node to set for the scene tree.
     * @returns A promise that resolves when the root is set.
     */
    async setRoot(root: ISceneNode): Promise<void> {
        if (this.root) {
            console.debug('Root node is already set, skipping setRoot')
            return
        }

        this.root = root
        this.scene.set(root.key, root)      // add root node to the scene map
        await this.alignNodeInfo(root)      // align the root node information
        this.expandedNodes.add(root.key)    // ensure root is expanded by default
    }

    /**
     * Subscribe a callback to tree updates.
     * @param callback Callback to be called when the tree is updated.
     * This is used to notify the DOM that the tree has been updated and needs to be re-rendered.
     * @returns A function to unsubscribe from the updates.
     */
    subscribe(callback: TreeUpdateCallback): () => void {
        this.updateCallbacks.add(callback)
        return () => {
            this.updateCallbacks.delete(callback)
        }
    }

    /**
     * Notify all subscribers about a DOM update.
     */
    notifyDomUpdate(): void {
        this.updateCallbacks.forEach(callback => callback())
    }

    // Node Click //////////////////////////////////////////////////

    isNodeExpanded(nodeKey: string): boolean {
        return this.expandedNodes.has(nodeKey)
    }

    async toggleNodeExpansion(node: ISceneNode): Promise<void> {
        if (this.expandedNodes.has(node.key)) {
            this.expandedNodes.delete(node.key)
        } else {
            this.expandedNodes.add(node.key)

            if (!node.aligned) {
                await this.alignNodeInfo(node)
            }
        }
    }

    async handleNodeClick(node: ISceneNode): Promise<void> {
        // If the node is a resource folder, toggle its expansion
        // If the node is a file, open it
        if (node.scenarioNode.degree > 0) {
            await this.toggleNodeExpansion(node)
        } else {    
            this.handleOpenFile(node.name, node.key)
        }

        // Select the node
        this.selectedNode = node
        this.handleNodeClickEnd(node)

        this.notifyDomUpdate()
    }

    // Node Editing //////////////////////////////////////////////////

    async startEditingNode(node: ISceneNode): Promise<void> {
        // Add node to editing nodes if not already editing
        if (!this.editingNodes.has(node)) {
            this.editingNodes.add(node)
            ;(node as SceneNode).pageContext = await SCENARIO_PAGE_CONTEXT_REGISTRY[node.scenarioNode.semanticPath].create(node)
        }
        
        this.handleNodeStartEditing(node)

        this.notifyDomUpdate()
    }

    async stopEditingNode(node: ISceneNode): Promise<void> {
        // Do nothing if not editing
        if (!this.editingNodes.has(node)) {
            return
        }

        this.editingNodes.delete(node)
        
        const db: ContextStorage = store.get('contextDB')!
        await db.delete(node)   // assign node.pageContext to undefined inside delete method

        this.handleNodeStopEditing(node)

        this.notifyDomUpdate()
    }

    // Node Tab Click //////////////////////////////////////////////////
    async focusToNode(targetNode: ISceneNode): Promise<boolean> {
        if (!targetNode) return false

        // Get all parent nodes
        const path: ISceneNode[] = []
        let current: ISceneNode | null = targetNode
        while (current) {
            path.unshift(current)
            current = current.parent
        }

        // Expand all parent nodes
        for (let i = 0; i < path.length - 1; i++) {
            const node = path[i]
            if (!this.expandedNodes.has(node.key)) {
                await this.alignNodeInfo(node)
                this.expandedNodes.add(node.key)
            }
        }

        // Select the target node
        this.selectedNode = targetNode
        this.notifyDomUpdate()
        return true
    }

    // Node Pinning //////////////////////////////////////////////////

    handleNodeDoubleClick(node: ISceneNode): void {
        if (node.scenarioNode.degree === 0) {
            this.handlePinFile(node.name, node.key)
        }
    }

    // Scene Tree Creation //////////////////////////////////////////////////

    static async create(isRemote: boolean): Promise<SceneTree> {
        try {
            // Create resource tree
            const tree = new SceneTree(isRemote)

            // Get root node information of the scene
            const rootNodeMeta = await api.scene.getSceneNodeInfo.fetch({node_key: '_'}, isRemote)
            const rootNode = new SceneNode(tree, rootNodeMeta.node_key, null, new SCENARIO_NODE_REGISTRY[rootNodeMeta.scenario_path]())

            // Add root node to the tree
            await tree.setRoot(rootNode)

            return tree

        } catch (error) {
            throw new Error(`Failed to create DomResourceTree: ${error}`)
        }
    }
}