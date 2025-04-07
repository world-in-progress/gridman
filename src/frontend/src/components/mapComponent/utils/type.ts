import { Map } from 'mapbox-gl'

type NHCustomeLayerOnAddMethod = (map: Map, gl: WebGL2RenderingContext) => void

type NHCustomeLayerRenderMethod = (gl: WebGL2RenderingContext, matrix: Array<number>) => void

export {
    type NHCustomeLayerRenderMethod,
    type NHCustomeLayerOnAddMethod
}