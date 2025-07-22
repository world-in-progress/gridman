import store from '@/store'
import { Tab } from '../tabBar/types'
import * as api from '@/core/apis/apis'
import { IScenarioNode } from '@/core/scenario/iscenario'
import ContextStorage from '@/core/context/contextStorage'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { SCENARIO_NODE_REGISTRY, SCENARIO_PAGE_CONTEXT_REGISTRY } from '@/resource/scenarioRegistry'
import DefaultPageContext from '@/core/context/default'

export class SceneNode implements ISceneNode {
    key: string
    tree: SceneTree
    aligned: boolean = false
    parent: ISceneNode | null
    scenarioNode: IScenarioNode
    children: Map<string, ISceneNode> = new Map()
    
    // Dom-related properties
    tab: Tab
    pageId: string | null = null
    private _pageContext: DefaultPageContext | undefined | null = undefined // undefined: not editing, null: editing paused, object: editing in progress

    constructor(tree: SceneTree, node_key: string, parent: ISceneNode | null, scenarioNode: IScenarioNode) {
        this.tree = tree
        this.key = node_key
        this.parent = parent
        this.scenarioNode = scenarioNode
        if (this.parent !== null) this.parent.children.set(this.id, this) // bind self to parent

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

    async createPageContext(): Promise<void> {
        this._pageContext = await SCENARIO_PAGE_CONTEXT_REGISTRY[this.scenarioNode.semanticPath].create(this)
    }

    async deletePageContext(): Promise<void> {
        const db = this.tree.cs
        this._pageContext = undefined // mark as deleted
        await db.deleteContext(this.id)
        db.constructorMap.delete(this.id)
    }
    
    async getPageContext(): Promise<DefaultPageContext> {
        if (this._pageContext === undefined) {
            throw new Error('Page context is not initialized. Something must be wrong.')
        }

        // Case 1: Editing started or not using context storage to store the context
        if (this._pageContext !== null) {
            if (this._pageContext instanceof DefaultPageContext)
                return this._pageContext
            else
                throw new Error('Page context is not a DefaultPageContext instance. Something must be wrong.')
        }

        // Case 2: Editing resumed (using context storage)
        const db = this.tree.cs
        const contextData = await db.loadContext(this.id)
        if (contextData) {
            const ContextClass = db.constructorMap.get(this.id)
            if (ContextClass && ContextClass.deserialize !== DefaultPageContext.deserialize) {
                this._pageContext = ContextClass.deserialize(contextData)
                return this._pageContext
            } else {
                throw new Error(`No context class found for node: ${this.id}. Something must be wrong.`)
            }
        }

        // Case 3 (Error): No context data found
        throw new Error(`No context data found for node: ${this.id}. Something must be wrong.`)
    }

    async freezePageContext(): Promise<void> {
        if (this._pageContext === undefined) return // do nothing if not editing

        if (this._pageContext === null) throw new Error('Page context is null. Cannot freeze context while editing is paused.')

        if (this._pageContext && this._pageContext instanceof DefaultPageContext) {
            if (this._pageContext.serialize !== DefaultPageContext.prototype.serialize) {
                const db = this.tree.cs
                db.constructorMap.set(this.id, this._pageContext.constructor as any)
                await db.saveContext(this.id, this._pageContext.serialize())
                this._pageContext = null // mark as serialized
                
            } else {
                // Do nothing for not using context storage to store the context
            }
        }
    }
}

export interface TreeUpdateCallback {
    (): void
}

export class SceneTree implements ISceneTree {
    isPublic: boolean
    root!: ISceneNode
    scene: Map<string, ISceneNode> = new Map()
    cs: ContextStorage = ContextStorage.getInstance()   // cs: context storage

    private handleOpenFile: (fileName: string, filePath: string) => void = () => {}
    private handlePinFile: (fileName: string, filePath: string) => void = () => {}
    private handleNodeMenuOpen: (node: ISceneNode, menuItem: any) => void = () => {}
    private handleNodeStartEditing: (node: ISceneNode) => void = () => {}
    private handleNodeStopEditing: (node: ISceneNode) => void = () => {}
    private handleNodeDoubleClick: (node: ISceneNode) => void = () => {}
    private handleNodeClick: (node: ISceneNode) => void = () => {}
    private handleNodeRemove: (node: ISceneNode) => void = () => {}

    private updateCallbacks: Set<TreeUpdateCallback> = new Set()
    private expandedNodes: Set<string> = new Set()
    editingNodeIds: Set<string> = new Set()
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
        handleNodeDoubleClick: (node: ISceneNode) => void
        handleNodeClick: (node: ISceneNode) => void
        handleNodeRemove: (node: ISceneNode) => void
    }): void {
        this.handleOpenFile = handlers.openFile
        this.handlePinFile = handlers.pinFile
        this.handleNodeMenuOpen = handlers.handleNodeMenuOpen
        this.handleNodeStartEditing = handlers.handleNodeStartEditing
        this.handleNodeStopEditing = handlers.handleNodeStopEditing
        this.handleNodeDoubleClick = handlers.handleNodeDoubleClick
        this.handleNodeClick = handlers.handleNodeClick
        this.handleNodeRemove = handlers.handleNodeRemove
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
        const idPrefix = this.isPublic ? 'public:' : 'private:'
        if (meta.children && meta.children.length > 0) {
            for (const child of meta.children) {
                if (oldChildrenMap.has(idPrefix + child.node_key)) {
                    node.children.set(idPrefix + child.node_key, oldChildrenMap.get(idPrefix + child.node_key)!)
                    continue // skip if child node already exists
                }

                const childNode = new SceneNode(this, child.node_key, node, new SCENARIO_NODE_REGISTRY[child.scenario_path]())
                this.scene.set(childNode.id, childNode) // add child node to the scene map
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
        this.scene.set(root.id, root)      // add root node to the scene map
        await this.alignNodeInfo(root)      // align the root node information
        this.expandedNodes.add(root.id)    // ensure root is expanded by default
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

    // Node Remove //////////////////////////////////////////////////

    async removeNode(node: ISceneNode): Promise<void> {
        const parent = node.parent as SceneNode
        parent.children.delete(node.id)

        this.scene.delete(node.id)
        await this.alignNodeInfo(parent, true)

        if (this.editingNodeIds.has(node.id))
            await this.stopEditingNode(node)

        this.handleNodeRemove(node) // notify all trees that the node has been removed
        this.notifyDomUpdate()
    }

    // Node Click //////////////////////////////////////////////////

    isNodeExpanded(nodeId: string): boolean {
        return this.expandedNodes.has(nodeId)
    }

    async toggleNodeExpansion(node: ISceneNode, forceOpen: boolean = false): Promise<void> {
        if (forceOpen || !this.expandedNodes.has(node.id)) {
            this.expandedNodes.add(node.id)
            if (!node.aligned) await this.alignNodeInfo(node)
        } else {
            this.expandedNodes.delete(node.id)
        }
    }

    async clickNode(node: ISceneNode): Promise<void> {
        // If the node is a resource folder, toggle its expansion
        if (node.scenarioNode.degree > 0) {
            await this.toggleNodeExpansion(node)
        }

        this.handleNodeClick(node) // notify all trees that the node is currently selected
        this.notifyDomUpdate()
    }

    // Node Double Click (Focusing) //////////////////////////////////////////////////

    async doubleClickNode(node: ISceneNode): Promise<void> {
        // If the node is a resource folder, force open its expansion
        if (node.scenarioNode.degree > 0) {
            await this.toggleNodeExpansion(node, true)
        }

        this.handleNodeDoubleClick(node) // notify all trees to focus on the node
        this.notifyDomUpdate()
    }

    // Node Editing //////////////////////////////////////////////////

    async startEditingNode(node: ISceneNode): Promise<void> {
        // If the node is a resource folder, force open its expansion
        if (node.scenarioNode.degree > 0) {
            await this.toggleNodeExpansion(node, true)
        }
        
        // Add node to editing nodes if not already editing
        if (!this.editingNodeIds.has(node.id)) {
            this.editingNodeIds.add(node.id)
            await (node as SceneNode).createPageContext()
        }
        
        this.handleNodeStartEditing(node)

        this.notifyDomUpdate()
    }

    async stopEditingNode(node: ISceneNode): Promise<void> {
        // Do nothing if not editing
        if (!this.editingNodeIds.has(node.id)) {
            return
        }

        this.editingNodeIds.delete(node.id)
        
        const _node = node as SceneNode
        _node.pageId = null
        await _node.deletePageContext()

        this.handleNodeStopEditing(node)

        this.notifyDomUpdate()
    }

    // Node Tab Click //////////////////////////////////////////////////
    async expandNode(targetNode: ISceneNode): Promise<boolean> {
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
            if (!this.expandedNodes.has(node.id)) {
                await this.alignNodeInfo(node)
                this.expandedNodes.add(node.id)
            }
        }

        // Select the target node
        this.notifyDomUpdate()
        return true
    }

    findNodeById(id: string): SceneNode | null {
        // Use the scene map directly since it stores all nodes by their IDs
        return this.scene.get(id) as SceneNode || null;
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