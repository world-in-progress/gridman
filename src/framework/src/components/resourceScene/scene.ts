import React from 'react'
import * as api from '@/core/apis/apis'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { IScenarioNode } from '@/core/scenario/iscenario'
import { SCENARIO_NODE_REGISTRY, SCENARIO_PAGE_CONTEXT_REGISTRY } from '@/resource/scenarioRegistry'
import { Tab } from '../tabBar/types'

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
    pageContext: any = null

    constructor(tree: SceneTree, node_key: string, parent: ISceneNode | null, scenarioNode: IScenarioNode) {
        this.tree = tree
        this.key = node_key
        this.parent = parent
        this.scenarioNode = scenarioNode
        if (this.parent !== null) this.parent.children.set(this.name, this) // bind self to parent

        // Set tab (not active, not preview)
        this.tab = {
            id: (this.tree.isRemote ? 'public' : 'private') + ':' + this.key,
            name: this.name,
            isActive: false,
            isPreview: false,
        }
    }

    get name(): string { return this.key.split('.').pop() || '' }
    get isExpanded(): boolean { return this._state.isExpanded }
    get isSelected(): boolean { return this._state.isSelected }
    get isLoading(): boolean { return this._state.isLoading }
    get contextMenuOpen(): boolean { return this._state.contextMenuOpen }

    set isExpanded(expanded: boolean) {
        this._state.isExpanded = expanded
        this._notifyTreeUpdate()
    }
    set isSelected(selected: boolean) {
        this._state.isSelected = selected
        this._notifyTreeUpdate()
    }
    set isLoading(loading: boolean) {
        this._state.isLoading = loading
        this._notifyTreeUpdate()
    }
    set contextMenuOpen(open: boolean) {
        this._state.contextMenuOpen = open
        this._notifyTreeUpdate()
    }

    private _notifyTreeUpdate(): void {
        this.tree.notifyDomUpdate()
    }
}

export interface TreeUpdateCallback {
    (): void
}

export class SceneTree implements ISceneTree {
    isRemote: boolean
    root!: ISceneNode
    scene: Map<string, ISceneNode> = new Map()

    private handleOpenFile: (fileName: string, filePath: string) => void = () => {}
    private handlePinFile: (fileName: string, filePath: string) => void = () => {}
    private handleNodeMenuOpen: (node: ISceneNode) => void = () => {}
    private handleNodeStartEditing: (node: ISceneNode) => void = () => {}
    private handleNodeStopEditing: (node: ISceneNode) => void = () => {}

    private updateCallbacks: Set<TreeUpdateCallback> = new Set()
    private expandedNodes: Set<string> = new Set()
    private _selectedNodeKey: string | null = null
    editingNodes: Set<ISceneNode> = new Set()

    constructor(isRemote: boolean) {
        this.isRemote = isRemote
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
        handleNodeMenuOpen: (node: ISceneNode) => void
        handleNodeStartEditing: (node: ISceneNode) => void
        handleNodeStopEditing: (node: ISceneNode) => void
    }): void {
        this.handleOpenFile = handlers.openFile
        this.handlePinFile = handlers.pinFile
        this.handleNodeMenuOpen = handlers.handleNodeMenuOpen
        this.handleNodeStartEditing = handlers.handleNodeStartEditing
        this.handleNodeStopEditing = handlers.handleNodeStopEditing
    }

    getNodeMenuHandler(): (node: ISceneNode) => void {
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
        const meta = await api.scene.getSceneNodeInfo.fetch({node_key: node.key}, this.isRemote)
        
        // Update parent-child relationship
        if (meta.children && meta.children.length > 0) {
            for (const child of meta.children) {
                if (node.children.has(child.node_key)) continue // skip if child node already exists

                const childNode = new SceneNode(this, child.node_key, node, new SCENARIO_NODE_REGISTRY[child.scenario_path]())
                this.scene.set(childNode.key, childNode) // add child node to the scene map
            }
        }

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

    get selectedNodeKey(): string | null {
        return this._selectedNodeKey
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

        // Deselect the previous node
        if (this._selectedNodeKey !== null) {
            (this.scene.get(this._selectedNodeKey) as SceneNode).isSelected = false
        }
        // Select the node
        (node as SceneNode).isSelected = true
        this._selectedNodeKey = node.key
    }

    // Node Editing //////////////////////////////////////////////////

    startEditingNode(node: ISceneNode): void {
        console.log('Starting editing node:', node)
        // Do nothing if already editing
        if (this.editingNodes.has(node)) {
            return
        }

        this.editingNodes.add(node)
        ;(node as SceneNode).pageContext = new SCENARIO_PAGE_CONTEXT_REGISTRY[node.scenarioNode.semanticPath]()
        
        this.handleNodeStartEditing(node)

        this.notifyDomUpdate()
    }

    stopEditingNode(node: ISceneNode): void {
        // Do nothing if not editing
        if (!this.editingNodes.has(node)) {
            return
        }

        this.editingNodes.delete(node)
        ;(node as SceneNode).pageContext = null

        this.handleNodeStopEditing(node)

        this.notifyDomUpdate()
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