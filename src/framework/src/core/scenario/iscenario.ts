import React from 'react'
import { ISceneNode, ISceneTree } from '../scene/iscene'

export interface ScenarioNodeDescription {
    children: string[]
    semanticPath: string
}

export interface IScenarioNode extends ScenarioNodeDescription {
    name: string
    degree: number
    mapStyle: string
    
    /**
     * Renders the context menu for the scenario node.
     * @param nodeSelf The scene node being rendered.
     * @param handleContextMenu Callback to handle context menu actions.
     * @returns The rendered context menu or null.
     */
    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode) => void): React.JSX.Element | null

    /**
     * Handles the opening of the dropdown menu for the scenario node.
     * @param nodeSelf The scene node being rendered.
     * @param tree The scene tree containing the node.
     */
    handleMenuOpen(nodeSelf: ISceneNode): void

    /**
     * Renders the tab page for the scenario node.
     * @param nodeSelf The scene node being rendered.
     * @returns The rendered tab page or null.
     */
    renderPage(nodeSelf: ISceneNode): React.JSX.Element | null

    /**
     * Renders the map for the scenario node.
     * @param nodeSelf The scene node being rendered.
     * @returns The rendered map or null.
     */
    renderMap(nodeSelf: ISceneNode): React.JSX.Element | null
}