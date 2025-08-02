import { NHCustomeLayerRenderMethod, NHCustomeLayerOnAddMethod } from './type'
import CustomLayerGroup from './customLayerGroup'

/**
 * Interface representing a custom layer in the map
 */
export interface NHCustomLayerInterface extends mapboxgl.CustomLayerInterface {

    //////////////////////////////////////////////////////////
    ///////////////// Base Property  /////////////////////////
    //////////////////////////////////////////////////////////
    /** Unique identifier for the custom layer */
    id: string

    /** Flag indicates layer-render-resource is ready  */
    initialized: boolean

    /** Optional: The z-index order of the layer (higher values are on top) */
    z_order?: number

    // /** Optional: The minimum zoom level at which the layer is visible */
    // minzoom?: number

    // /** Optional: The maximum zoom level at which the layer is visible */
    // maxzoom?: number

    //////////////////////////////////////////////////////////
    /////////////////   Dependency   /////////////////////////
    //////////////////////////////////////////////////////////
    layerGroup?: CustomLayerGroup

    //////////////////////////////////////////////////////////
    ////////////////// Layers Hooks  /////////////////////////
    //////////////////////////////////////////////////////////

    /** Method to initialize gl resources and register event listeners. */
    initialize: NHCustomeLayerOnAddMethod

    /** Method called during a render frame */
    render: NHCustomeLayerRenderMethod

    /** Method to clean up gl resources and event listeners. */
    remove: NHCustomeLayerOnAddMethod

    //////////////////////////////////////////////////////////
    ////////////////// Layers Utils  /////////////////////////
    //////////////////////////////////////////////////////////
    show: () => void
    hide: () => void
}