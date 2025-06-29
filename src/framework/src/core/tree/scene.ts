import * as api from '../apis/apis'
import { SceneMeta } from '../apis/types'
import { ScenarioNode, ScenarioTree } from './scenario'

export class SceneNode {
    key: string
    aligned: boolean = false
    parent: SceneNode | null
    scenarioNode: ScenarioNode
    children: Map<string, SceneNode> = new Map()

    constructor(node_key: string, parent: SceneNode | null, scenarioNode: ScenarioNode) {
        this.key = node_key
        this.parent = parent
        this.scenarioNode = scenarioNode

        this.parent?.children.set(this.name, this)
    }

    get name(): string {
        return this.key.split('.').pop() || ''
    }
}

export class ResourceTree {
    isRemote: boolean
    root: SceneNode
    scenario: ScenarioTree
    scene: Map<string, SceneNode> = new Map()

    constructor(scenario: ScenarioTree, root: SceneNode, isRemote: boolean) {
        this.root = root
        this.isRemote = isRemote
        this.scenario = scenario
        this.scene.set(root.key, root)
    }

    async alignNodeInfo(node: SceneNode) {
        const meta = await api.scene.getSceneNodeInfo.fetch({node_key: node.key}, this.isRemote)
        
        // Update parent-child relationship
        if (meta.children && meta.children.length > 0) {
            for (const child of meta.children) {
                if (!this.scenario.getNode(child.scenario_path)) continue // skip if scenario node not found

                const childNode = new SceneNode(child.node_key, node, this.scenario.getNode(child.scenario_path)!)
                this.scene.set(childNode.key, childNode) // add child node to the scene map
            }
        }

        node.aligned = true // mark as aligned after loading
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

    static async create(isRemote: boolean): Promise<ResourceTree> {
        try {
            // Get scenario tree
            const scenarioDescription = await api.scene.getScenarioDescription.fetch(undefined, isRemote)
            const scenarioTree = new ScenarioTree(scenarioDescription)

            // Get root node information of the scene
            const rootNodeMeta = await api.scene.getSceneNodeInfo.fetch({node_key: '_'}, isRemote)
            const rootNode = new SceneNode(rootNodeMeta.node_key, null, scenarioTree.getNode(rootNodeMeta.scenario_path)!)

            // Create resource tree
            const tree = new ResourceTree(scenarioTree, rootNode, isRemote)
            await tree.alignNodeInfo(rootNode) // align the root node
            return tree

        } catch (error) {
            throw new Error(`Failed to create ResourceTree: ${error}`)
        }
    }
}

// Example usage of ResourceTree
// const localTree = await ResourceTree.create(false)
// const root = localTree.root
// const rootKey = root.key
// const rootChildNames = await localTree.getNodeChildNames(rootKey)

