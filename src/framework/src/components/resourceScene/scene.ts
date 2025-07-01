import React from 'react'
import store from '@/store'
import * as api from '@/core/apis/apis'
import { ISceneNode, ISceneTree } from '@/core/scene/iscene'
import { IScenarioNode } from '@/core/scenario/iscenario'
import { SCENARIO_NODE_REGISTRY } from '@/resource/scenarioNodeRegistry'

export interface DomNodeState {
    isLoading: boolean
    isExpanded: boolean
    isSelected: boolean
    contextMenuOpen: boolean
}

export interface DomNodeActions {
    onSelect: () => void
    onOpenFile: () => void
    onToggleExpand: () => void
    onContextMenu: (e: React.MouseEvent) => void
}

export class SceneNode implements ISceneNode {
    key: string
    aligned: boolean = false
    parent: ISceneNode | null
    scenarioNode: IScenarioNode
    children: Map<string, ISceneNode> = new Map()

    tree: SceneTree
    private domState: DomNodeState = {
        isExpanded: false,
        isSelected: false,
        isLoading: false,
        contextMenuOpen: false
    }
    private domActions: DomNodeActions | null = null


    constructor(tree: SceneTree, node_key: string, parent: ISceneNode | null, scenarioNode: IScenarioNode) {
        this.key = node_key
        this.parent = parent
        this.scenarioNode = scenarioNode

        this.parent?.children.set(this.name, this)
        this.tree = tree
    }

    get name(): string {
        return this.key.split('.').pop() || ''
    }

    get isExpanded(): boolean { return this.domState.isExpanded }
    get isSelected(): boolean { return this.domState.isSelected }
    get isLoading(): boolean { return this.domState.isLoading }
    get contextMenuOpen(): boolean { return this.domState.contextMenuOpen }

    set isExpanded(expanded: boolean) {
        this.domState.isExpanded = expanded
        this.notifyTreeUpdate()
    }
    set isSelected(selected: boolean) {
        this.domState.isSelected = selected
        this.notifyTreeUpdate()
    }
    set isLoading(loading: boolean) {
        this.domState.isLoading = loading
        this.notifyTreeUpdate()
    }
    set contextMenuOpen(open: boolean) {
        this.domState.contextMenuOpen = open
        this.notifyTreeUpdate()
    }

    get actions(): DomNodeActions | null {
        return this.domActions
    }

    set actions(ations: DomNodeActions) {
        this.domActions = ations
    }

    private notifyTreeUpdate(): void {
        const tree = this.tree
        if (tree) {
            tree.notifyDomUpdate()
        }
    }
}

export interface TreeUpdateCallback {
    (): void
}

export class SceneTree implements ISceneTree {
    isRemote: boolean
    root!: ISceneNode
    scene: Map<string, ISceneNode> = new Map()

    private updateCallbacks: Set<TreeUpdateCallback> = new Set()
    private expandedNodes: Set<string> = new Set(['_']) // default root node is expanded
    private selectedNode: string | null = null

    private handleOpenFile: (fileName: string, filePath: string) => void = () => {}
    private handlePinFile: (fileName: string, filePath: string) => void = () => {}
    private handleDropDownMenuOpen: (node: ISceneNode, isRemote: boolean) => void = () => {}

    constructor(isRemote: boolean) {
        this.isRemote = isRemote
    }

    async setRoot(root: ISceneNode) {
        if (this.root) {
            throw new Error('Root node is already set')
        }

        this.root = root
        this.scene.set(root.key, root) // add root node to the scene map
        await this.alignNodeInfo(root) // align the root node
    }
    
    async alignNodeInfo(node: ISceneNode, force: boolean = false): Promise<void> {
        if (node.aligned && !force) return

        const meta = await api.scene.getSceneNodeInfo.fetch({node_key: node.key}, this.isRemote)
        
        // Update parent-child relationship
        if (meta.children && meta.children.length > 0) {
            for (const child of meta.children) {
                if (node.children.has(child.node_key)) continue // skip if child node already exists

                const childNode = new SceneNode(this, child.node_key, node, new SCENARIO_NODE_REGISTRY[child.scenario_path]())
                console.log((new SCENARIO_NODE_REGISTRY[child.scenario_path]()).semanticPath, child.scenario_path)
                this.scene.set(childNode.key, childNode) // add child node to the scene map
            }
        }

        node.aligned = true // mark as aligned after loading
        const domTrigger = store.get('updateTree') as Function
        if (domTrigger) {
            domTrigger() // trigger DOM update if available
        }
    }

    markAsDirty(sceneNodeKey: string) {
        const node = this.scene.get(sceneNodeKey)!
        node.aligned = false
    }

    async getNodeChildNames(sceneNodeKey: string): Promise<string[] | null> {
        // Get node from scene
        const node = this.scene.get(sceneNodeKey)!
        
        if (!node.aligned) {
            // If the node is not aligned, load it
            await this.alignNodeInfo(node)
        }

        return Array.from(node.children.keys())
    }

    subscribe(callback: TreeUpdateCallback): () => void {
        this.updateCallbacks.add(callback)
        return () => {
            this.updateCallbacks.delete(callback)
        }
    }

    notifyDomUpdate(): void {
        this.updateCallbacks.forEach(callback => callback())
    }

    toggleNodeExpansion(nodeKey: string): void {
        if (this.expandedNodes.has(nodeKey)) {
            this.expandedNodes.delete(nodeKey)
        } else {
            this.expandedNodes.add(nodeKey)
        }
        this.notifyDomUpdate()
    }

    isNodeExpanded(nodeKey: string): boolean {
        return this.expandedNodes.has(nodeKey)
    }

    selectNode(nodeKey: string): void {
        this.selectedNode = nodeKey
        this.notifyDomUpdate()
    }

    getSelectedNode(): string | null {
        return this.selectedNode
    }

    async handleNodeClick(node: ISceneNode): Promise<void> {
        if (node.scenarioNode.degree > 0) {
            this.toggleNodeExpansion(node.key)

            if (this.isNodeExpanded(node.key) && !node.aligned) {
                await this.alignNodeInfo(node)
            }
        } else {
            this.selectNode(node.key)
            this.handleOpenFile(node.name, node.key)
        }
    }

    handleNodeDoubleClick(node: ISceneNode): void {
        if (node.scenarioNode.degree === 0) {
            this.handlePinFile(node.name, node.key)
        }
    }

    bindHandlers(handlers: {
        openFile: (fileName: string, filePath: string) => void
        pinFile: (fileName: string, filePath: string) => void
        handleDropDownMenuOpen: (node: ISceneNode, isRemote: boolean) => void
    }): void {
        this.handleOpenFile = handlers.openFile
        this.handlePinFile = handlers.pinFile
        this.handleDropDownMenuOpen = handlers.handleDropDownMenuOpen
    }

    getContextMenuHandler(node: ISceneNode): (node: ISceneNode, isRemote: boolean) => void {
        return (node: ISceneNode, isRemote: boolean) => {
            this.handleDropDownMenuOpen(node, isRemote)
        }
    }

    static async create(isRemote: boolean): Promise<SceneTree> {
        try {
            // Get scenario tree
            const scenarioDescription = await api.scene.getScenarioDescription.fetch(undefined, isRemote)
            // const scenarioTree = new ScenarioTree(scenarioDescription)

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