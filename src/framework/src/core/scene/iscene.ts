import { IScenarioNode } from '../scenario/iscenario'

export interface ISceneNode {
    key: string
    name: string
    aligned: boolean 
    tree: ISceneTree
    scenarioNode: IScenarioNode
    parent: ISceneNode | null
    children: Map<string, ISceneNode>
}

export interface ISceneTree {
    root: ISceneNode
    isRemote: boolean
    scene: Map<string, ISceneNode>

    setRoot(root: ISceneNode): Promise<void>
    markAsDirty(sceneNodeKey: string): void
    alignNodeInfo(node: ISceneNode, force: boolean): Promise<void>
    getNodeChildNames(sceneNodeKey: string): Promise<string[] | null>
}