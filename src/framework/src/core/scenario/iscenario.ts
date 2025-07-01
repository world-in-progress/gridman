import React from "react"
import { ISceneNode, ISceneTree } from "../scene/iscene"

export interface ScenarioNodeDescription {
    semanticPath: string
    children: string[]
}

export interface IScenarioNode extends ScenarioNodeDescription {
    name: string
    degree: number
    
    /**
     * Renders the context menu for the scenario node.
     * @param nodeSelf The scene node being rendered.
     * @param tree The scene tree containing the node.
     * @param handleContextMenu Callback to handle context menu actions.
     * @returns The rendered context menu or null.
     */
    renderContextMenu(nodeSelf: ISceneNode, tree: ISceneTree, handleContextMenu: (node: ISceneNode) => void): React.JSX.Element | null

    /**
     * Handles the opening of the dropdown menu for the scenario node.
     * @param nodeSelf The scene node being rendered.
     * @param tree The scene tree containing the node.
     */
    handleDropDownMenuOpen(nodeSelf: ISceneNode, tree: ISceneTree): void
}