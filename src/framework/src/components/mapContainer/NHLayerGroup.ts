import { glMatrix, mat4, vec3 } from "gl-matrix";
import { Map, CustomLayerInterface, MercatorCoordinate } from "mapbox-gl";
import { NHCustomLayerInterface } from "./interfaces";

export default class NHLayerGroup implements CustomLayerInterface {
  /// base
  id: string = 'NH-LayerGroup';
  type = 'custom' as const;
  renderingMode?: '2d' | '3d' = '3d';

  /// map
  map!: Map;
  gl!: WebGL2RenderingContext;
  layers!: Array<NHCustomLayerInterface>;

  mercatorCenter!: MercatorCoordinate;
  mercatorCenterX = new Float32Array(0);
  mercatorCenterY = new Float32Array(0);
  relativeEyeMatrix = mat4.create();

  /// state
  prepared!: boolean;

  // System
  isWindows = navigator.userAgent.includes('Windows');

  constructor() {
    this.layers = [];
    this.prepared = false;
    // this.relativeEyeMatrix = new Float64Array(16)
    // mat4.identity(this.relativeEyeMatrix as any);
  }

  ///////////////////////////////////////////////////////////
  ////////////////// LayerGroup Hooks ///////////////////////
  ///////////////////////////////////////////////////////////
  /** To initialize gl resources and register event listeners.*/
  onAdd(map: Map, gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.map = map;

    this.layers.forEach((ly) => {
      ly.initialize(map, gl); // start initialize here
      ly.layerGroup = this; // inject layerGroup here
    });

    this.prepared = true;
  }

  /** Called during each render frame.*/
  render(gl: WebGL2RenderingContext, matrix: Array<number>) {
    if (!this.prepared) {
      this.map.triggerRepaint();
      return;
    }
    this.update(matrix as any);

    this.layers.forEach((ly) => {
      ly.render(gl, matrix);
    });
  }

  /** To clean up gl resources and event listeners.*/
  onRemove(map: Map, gl: WebGL2RenderingContext) {
    this.layers.forEach((layer) => {
      if (layer.layerGroup) layer.layerGroup = undefined; // eliminate ref to layergroup
      layer.remove(map, gl);
    });
    this.layers = [];
  }

  ///////////////////////////////////////////////////////////
  ///////////////// LayerGroup Fucntion /////////////////////
  ///////////////////////////////////////////////////////////

  ///////////////// Tick Logic //////////////////////////////
  /** Calculate some data to avoid map jitter .*/

  private update(matrix: mat4) {

    const mercatorCenter = MercatorCoordinate.fromLngLat(
        this.map.transform._center.toArray()
    );

    this.mercatorCenterX = encodeFloatToDouble(mercatorCenter.x);
    this.mercatorCenterY = encodeFloatToDouble(mercatorCenter.y);

    if (this.isWindows) {
        // Update the relativeEyeMatrix for Windows
        mat4.translate(
            this.relativeEyeMatrix, 
            matrix, 
            [
                mercatorCenter.x,
                mercatorCenter.y,
                0.0
            ]
        );
    } else {
        // Update the relativeEyeMatrix for Mac
        mat4.translate(
            this.relativeEyeMatrix, 
            matrix, 
            vec3.fromValues(
                mercatorCenter.x,
                mercatorCenter.y,
                0.0
            )
        );
    }
  }

  //////////////// Layers Control ///////////////////////////
  public getLayerInstance(layerID: string): null | NHCustomLayerInterface {
    const index = this.findLayerIndex(layerID);
    if (index === -1) {
      console.warn(`NHWARN: Layer <${layerID}> not found.`);
      return null;
    }
    return this.layers[index];
  }

  public addLayer(layer: NHCustomLayerInterface) {
    this.layers.push(layer);
    this.prepared && layer.initialize(this.map, this.gl);
    this.sortLayer();
  }

  public removeLayer(layerID: string) {
    const index = this.findLayerIndex(layerID);
    if (index === -1) {
      console.warn(`NHWARN: Layer <${layerID}> not found.`);
      return false;
    }
    this.layers[index].remove(this.map, this.gl);
    this.layers.splice(index, 1);
    console.log(`NHINFO: Layer <${layerID}> removed.`);
    return true;
  }

  public sortLayer() {
    this.layers.sort((a, b) => {
      return (b.z_order ?? 0) - (a.z_order ?? 0);
    });
  }

  showLayer(layerID: string) {
    this.getLayerInstance(layerID)?.show();
  }

  hideLayer(layerID: string) {
    this.getLayerInstance(layerID)?.hide();
  }

  private findLayerIndex(layerID: string): number {
    return this.layers.findIndex((ly) => ly.id === layerID);
  }
}

// Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////

function encodeFloatToDouble(value: number) {
  const result = new Float32Array(2);
  result[0] = value;

  const delta = value - result[0];
  result[1] = delta;
  return result;
}
