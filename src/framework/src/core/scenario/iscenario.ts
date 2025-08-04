import React from 'react'
import { ISceneNode } from '../scene/iscene'

export interface ScenarioNodeDescription {
    children: string[]
    semanticPath: string
}

export interface IScenarioNode extends ScenarioNodeDescription {
    name: string
    degree: number
    
    /**
     * Renders the context menu for the scenario node.
     * @param nodeSelf The scene node being rendered.
     * @param handleContextMenu Callback to handle context menu actions.
     * @returns The rendered context menu or null.
     */
    renderMenu(nodeSelf: ISceneNode, handleContextMenu: (node: ISceneNode, menuItem: any) => void): React.JSX.Element | null

    /**
     * Handles the opening of the dropdown menu for the scenario node.
     * @param nodeSelf The scene node being rendered.
     * @param menuItem The menu item that was clicked.
     */
    handleMenuOpen(nodeSelf: ISceneNode, menuItem: any): void

    /**
     * Renders the tab page for the scenario node.
     * @param nodeSelf The scene node being rendered.
     * @returns The rendered tab page or null.
     */
    renderPage(nodeSelf: ISceneNode, menuItem: any): React.JSX.Element | null
}