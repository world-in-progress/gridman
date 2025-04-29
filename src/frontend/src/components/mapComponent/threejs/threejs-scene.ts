import {
  type Map as MapboxMap,
  type CustomLayerInterface,
  LngLatLike,
} from "mapbox-gl";

import {
  Scene,
  WebGLRenderer,
  PerspectiveCamera,
  Vector3,
  Matrix4,
  Group,
} from "three";

import ThreejsSceneHelper from "./threejs-scene-helper";
import Tileset, { TilesetOptions } from "./tileset/tileset";

export type ThreejsSceneLayerProps = {
  id: string;
  slot?: string;
  refCenter?: LngLatLike;
  envTexture?: string;
};

export default class ThreejsSceneLayer implements CustomLayerInterface {
  readonly id: string;
  readonly type: "custom" = "custom";
  readonly slot?: string;
  readonly renderingMode: "3d" = "3d";
  private _helper: ThreejsSceneHelper;

  private _map?: MapboxMap;
  private _refCenter: LngLatLike | null = null;
  private _worldMatrix: Matrix4 | null = null;
  private _worldMatrixInv: Matrix4 | null = null;

  private _options: ThreejsSceneLayerProps;
  private _renderer: WebGLRenderer | undefined;
  private _scene: Scene | undefined;
  private _sceneRoot: Group | undefined;
  private _cameraForRender: PerspectiveCamera | undefined;

  private _tilesets: Map<string, Tileset> = new Map();

  private static _GetDefaultOptions(): ThreejsSceneLayerProps {
    return {
      id: "threejs-scene-layer",
    };
  }

  constructor(options: ThreejsSceneLayerProps) {
    this.id = options.id;
    this.slot = options.slot;
    this._helper = new ThreejsSceneHelper();
    this._options = {
      ...ThreejsSceneLayer._GetDefaultOptions(),
      ...options,
    };
  }

  onAdd = (map: MapboxMap, gl: WebGL2RenderingContext) => {
    this._map = map;
    this._renderer = this._helper.getThreejsInstance({ map, gl });
    this._scene = this._helper.createScene();
    this._sceneRoot = this._helper.createGroup(this._scene, "scene-root");
    this._cameraForRender = this._helper.createCamera(this._sceneRoot, "camera-for-render");

    const refCenter = this._options.refCenter || this._map?.getCenter();
    if (refCenter) {
      this.setRefCenter(refCenter);
    }
  };

  onRemove = (map: MapboxMap, gl: WebGL2RenderingContext) => {
    this._cameraForRender = undefined;
    this._sceneRoot = undefined;
    this._scene = undefined;
    this._renderer = undefined;
    this._map = undefined;
  };

  //   renderOpaque = (gl: WebGL2RenderingContext, matrix: number[]) => {
  //     this.render(gl, matrix);
  //   };

  //   renderTranslucent = (gl: WebGL2RenderingContext, matrix: number[]) => {
  //     this.render(gl, matrix);
  //   };

  render = (gl: WebGL2RenderingContext, matrix: number[]) => {
    if (!this._cameraForRender || !this._map || !this._scene || !this._renderer) {
      return;
    }

    // update camera
    if (this._worldMatrix && this._worldMatrixInv) {
      this._helper.updateCameraForRender(
        this._cameraForRender,
        this._map,
        matrix,
        this._worldMatrix,
        this._worldMatrixInv
      );
    }

    // update tileset transform
    this._tilesets.forEach((tileset) => {
      this.updateTileset(tileset);
      if (this._cameraForRender && this._renderer) {
        tileset.updateForRender(this._cameraForRender, this._renderer);
      }
    });

    // render
    this._renderer.resetState();
    this._renderer.render(this._scene, this._cameraForRender);
    this._map.triggerRepaint();
  };

  private _update() {
    if (!this._map) {
      return;
    }
    this._map.triggerRepaint();
  }

  ////////////////////////////

  // 设置参考中心
  setRefCenter(center: LngLatLike) {
    if (this._refCenter !== center && this._map) {
      this._refCenter = center;
      this._worldMatrix = this._helper.updateWorldMatrix(this._map, center);
      if (this._worldMatrix) {
        this._worldMatrixInv = this._worldMatrix.clone().invert();
      }

      this._tilesets.forEach((tileset) => {
        this.updateTileset(tileset);
      });
      this._update();
    }
  }

  // 将地图坐标转换为场景坐标
  toScenePosition(lngLat: LngLatLike): Vector3 {
    if (!this._worldMatrixInv) {
      return new Vector3();
    }
    return this._helper.toScenePosition(lngLat, this._worldMatrixInv);
  }

  // 将场景坐标转换为地图坐标
  toMapPosition(position: Vector3): [number, number, number] {
    if (!this._worldMatrix) {
      return [0, 0, 0];
    }
    return this._helper.toMapPosition(position, this._worldMatrix);
  }

  ////////////////////////////
  addTileset(tilesetOptions: TilesetOptions): Tileset {
    this.removeTileset(tilesetOptions.id);

    const newTileset: Tileset = new Tileset(tilesetOptions);
    if (this._sceneRoot && this._renderer && this._refCenter) {
      newTileset.addToScene(this._sceneRoot as Group, this._refCenter, this._renderer);
    }
    this._tilesets.set(tilesetOptions.id, newTileset);
    this._update();
    return newTileset;      
  }

  removeTileset(tilesetId: string) {
    const tileset = this._tilesets.get(tilesetId);
    if (tileset && this._sceneRoot) {
      tileset.removeFromScene(this._sceneRoot as Group);
      this._tilesets.delete(tilesetId);
      this._update();
    }
  }

  hasTileset(tilesetId: string): boolean {
    return this._tilesets.has(tilesetId);
  }

  removeAllTilesets() {
    if (!this._sceneRoot) {
      return;
    }
    this._tilesets.forEach((tileset) => {
      tileset.removeFromScene(this._sceneRoot as Group);
    });
    this._tilesets.clear();
    this._update();
  }

  updateTileset(tileset: Tileset){
    const centerLngLat = tileset.getCenterLngLat();
    if (!centerLngLat) {
      return;
    }
    const centerScenePosition = this.toScenePosition(centerLngLat);
    if (tileset.group) {
      tileset.group.position.set(centerScenePosition.x, centerScenePosition.y, centerScenePosition.z);
      tileset.group.updateMatrixWorld(true);
    }
  }
}
