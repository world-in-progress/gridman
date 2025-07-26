import { Map, CustomLayerInterface } from "mapbox-gl";

export default class TerrainByProxyTile implements CustomLayerInterface {
  constructor(id: string, tileUrl: string, name: string, bbox: number[])

  readonly id: string;
  readonly type: 'custom';
  readonly renderingMode?: '2d' | '3d';
  
  onAdd(map: Map, gl: WebGLRenderingContext): void;
  render(gl: WebGLRenderingContext, matrix: number[]): void;
  onRemove?(map: Map): void;
}