import { IScenarioNode } from '../scenario/iscenario'

export interface ISceneNode {
    id: string
    key: string
    name: string
    aligned: boolean 
    tree: ISceneTree
    parent: ISceneNode | null
    scenarioNode: IScenarioNode
    children: Map<string, ISceneNode>
}

export interface ISceneTree {
    root: ISceneNode
    isPublic: boolean
    scene: Map<string, ISceneNode>

    setRoot(root: ISceneNode): Promise<void>
    alignNodeInfo(node: ISceneNode, force: boolean): Promise<void>
}