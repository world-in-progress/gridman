import React from 'react'
import { ISceneNode } from '../scene/iscene'
import NHLayerGroup from '@/components/mapContainer/NHLayerGroup'

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

    /**
     * Handles the addition of the scenario node to the map.
     * @param nodeSelf The scene node being rendered.
     * @param map The map instance to add the layer to.
     * @param layerGroup The layer group to add the layer to.
     */
    handleMapAdd(nodeSelf: ISceneNode, map: mapboxgl.Map, layerGroup: NHLayerGroup): Promise<void>
}