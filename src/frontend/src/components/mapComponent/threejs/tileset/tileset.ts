import { TilesRenderer } from "3d-tiles-renderer";
import {
  DebugTilesPlugin,
  UnloadTilesPlugin,
  ImplicitTilingPlugin,
  ColorMode,
  GLTFExtensionsPlugin as OriginalGLTFExtensionsPlugin,
} from "3d-tiles-renderer/plugins";

import { TilesCachePlugin } from "./plugins/TilesCachePlugin";
import { UrlParamsPlugin } from "./plugins/UrlParamsPlugin"

import { LngLatLike } from "mapbox-gl";
import {
  WebGLRenderer,
  PerspectiveCamera,
  Box3,
  Vector3,
  Matrix4,
  Group,
  Sphere,
} from "three";

import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

// color modes
const NONE = 0;
const SCREEN_ERROR = 1;
const GEOMETRIC_ERROR = 2;
const DISTANCE = 3;
const DEPTH = 4;
const RELATIVE_DEPTH = 5;
const IS_LEAF = 6;
const RANDOM_COLOR = 7;
const RANDOM_NODE_COLOR = 8;
const CUSTOM_COLOR = 9;
const LOAD_ORDER = 10;

const ColorModes = Object.freeze( {
	NONE,
	SCREEN_ERROR,
	GEOMETRIC_ERROR,
	DISTANCE,
	DEPTH,
	RELATIVE_DEPTH,
	IS_LEAF,
	RANDOM_COLOR,
	RANDOM_NODE_COLOR,
	CUSTOM_COLOR,
	LOAD_ORDER,
} );

export type TilesetDebugParams = {
  enableDebug: boolean;
  displayBoxBounds: boolean;
  displaySphereBounds: boolean;
  displayRegionBounds: boolean;
  colorMode: number;
};

export type TilesetDisplayParams = {
  errorTarget: number;
  errorThreshold: number;
  displayActiveTiles: boolean;
  autoDisableRendererCulling: boolean;
  maxDepth: number;
  optimizeRaycast: boolean;
};

export type TilesetOptions = {
  id: string;
  url: string;

  dracoLoaderPath?: string;
  ktx2LoaderPath?: string;

  debug?: TilesetDebugParams;
  display?: TilesetDisplayParams;
};

export default class Tileset {
  id: string;
  group: Group | null;
  tiles: TilesRenderer | null;
  options: TilesetOptions;

  private centerLngLat: LngLatLike | null = null;

  constructor(options: TilesetOptions) {
    this.id = options.id;
    this.options = options;
    this.group = null;
    this.tiles = null;
  }

  addToScene(sceneRoot: Group, refCenter: LngLatLike, renderer: WebGLRenderer) {
    const rootGroup = new Group();
    sceneRoot.add(rootGroup);

    // Note the DRACO compression files need to be supplied via an explicit source.
    // We use unpkg here but in practice should be provided by the application.
    const dracoLoaderPath =
      this.options.dracoLoaderPath ||
      "https://unpkg.com/three@0.173.0/examples/jsm/libs/draco/gltf/";
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(dracoLoaderPath);

    const ktx2LoaderPath =
      this.options.ktx2LoaderPath ||
      "https://unpkg.com/three@0.173.0/examples/jsm/libs/basis/";
    const ktxLoader = new KTX2Loader();
    ktxLoader.setTranscoderPath(ktx2LoaderPath);
    
    ktxLoader.detectSupport(renderer);

    const tiles = new TilesRenderer(this.options.url);
    tiles.registerPlugin(new DebugTilesPlugin());
    tiles.registerPlugin(new UnloadTilesPlugin());
    tiles.registerPlugin(new TilesCachePlugin());
    tiles.registerPlugin(new UrlParamsPlugin());
    tiles.registerPlugin(new ImplicitTilingPlugin());
    tiles.registerPlugin(
      new OriginalGLTFExtensionsPlugin({
        rtc: true,
        autoDispose: true,
        dracoLoader,
        ktxLoader,
      })
    );

    tiles.fetchOptions.mode = "cors";
    tiles.autoDisableRendererCulling = true;

    rootGroup.add(tiles.group);

    this.centerLngLat = null;
    tiles.addEventListener("load-tile-set", () => {
      this.updateTilesetTransform(refCenter);
    });

    this.tiles = tiles;
    this.group = rootGroup;

    if (this.options.debug) {
      this.setDebugParams(this.options.debug);
    }

    if (this.options.display) {
      this.setDisplayParams(this.options.display);
    }
  }

  removeFromScene(sceneRoot: Group) {
    if (this.group && this.tiles) {
      this.group.remove(this.tiles.group);
      this.tiles.dispose();
      sceneRoot.remove(this.group);
    }
    this.group = null;
    this.tiles = null;
  }

  // 角度转弧度
  private degToRad(a: number): number {
    return (a / 180) * Math.PI;
  }
  // 角度转弧度
  private radToDeg(a: number): number {
    return (a / Math.PI) * 180;
  }

  getCenterLngLat(): LngLatLike | null {
    return this.centerLngLat;
  }

  updateTilesetTransform(refCenter: LngLatLike) {
    const rootGroup: Group = this.group!;
    const tiles: TilesRenderer = this.tiles!;

    if (!tiles.root) {
      return;
    }

    // update tiles center

    let box = new Box3();
    let sphere = new Sphere();
    let center = new Vector3();
    if (tiles.getBoundingBox(box)) {
      box.getCenter(center);
    } else if (tiles.getBoundingSphere(sphere)) {
      center = sphere.center;
    } else {
      return;
    }

    let centerLngLat = { lat: 0, lon: 0, height: 0 };
    centerLngLat = tiles.ellipsoid.getPositionToCartographic(
      center,
      centerLngLat
    );

    const modelMatrix = tiles.ellipsoid.getEastNorthUpFrame(
      centerLngLat.lat,
      centerLngLat.lon,
      new Matrix4()
    );

    // 从 LngLatLike 中获取经纬度值
    let lng = 0;
    let lat = 0;

    if (Array.isArray(refCenter)) {
      lng = refCenter[0];
      lat = refCenter[1];
    } else if (typeof refCenter === 'object') {
      if ('lng' in refCenter) {
        lng = refCenter.lng;
        lat = refCenter.lat;
      } else if ('lon' in refCenter) {
        lng = refCenter.lon;
        lat = refCenter.lat;
      }
    }

    const fromFixedFrameMatrix = tiles.ellipsoid.getEastNorthUpFrame(
      this.degToRad(lat),
      this.degToRad(lng),
      new Matrix4()
    );

    const toFixedFrameMatrix = fromFixedFrameMatrix.invert();
    const refMatrix = toFixedFrameMatrix.multiply(modelMatrix);
    refMatrix.decompose(
      rootGroup.position,
      rootGroup.quaternion,
      rootGroup.scale
    );
    rootGroup.matrix.copy(refMatrix);
    rootGroup.matrixAutoUpdate = false;

    const modelMatrixInvert = modelMatrix.clone().invert();
    modelMatrixInvert.decompose(
      tiles.group.position,
      tiles.group.quaternion,
      tiles.group.scale
    );

    tiles.group.matrix.copy(modelMatrixInvert);
    tiles.group.matrixAutoUpdate = false;

    this.centerLngLat = {
      lon: this.radToDeg(centerLngLat.lon),
      lat: this.radToDeg(centerLngLat.lat),
    };
  }

  updateForRender(camera: PerspectiveCamera, renderer: WebGLRenderer) {
    if (!this.tiles) return;
    
    const tiles: TilesRenderer = this.tiles;
    tiles.setCamera(camera);
    tiles.setResolutionFromRenderer(camera, renderer);
    tiles.update();
  }

  setDebugParams(debugParams: TilesetDebugParams) {
    if (!this.tiles) {
      return;
    }
    const plugin = this.tiles.getPluginByName(
      "DEBUG_TILES_PLUGIN"
    ) as DebugTilesPlugin;
    if (!plugin) {
      return;
    }

    const params = { ...this.options.debug, ...debugParams };

    if (params.enableDebug !== undefined)
      plugin.enabled = debugParams.enableDebug;
    if (params.displayBoxBounds !== undefined)
      plugin.displayBoxBounds = debugParams.displayBoxBounds;
    if (params.displaySphereBounds !== undefined)
      plugin.displaySphereBounds = debugParams.displaySphereBounds;
    if (params.displayRegionBounds !== undefined)
      plugin.displayRegionBounds = debugParams.displayRegionBounds;
    if (params.colorMode !== undefined)
      plugin.colorMode = debugParams.colorMode as ColorMode;

    this.options.debug = params;
  }

  setDisplayParams(displayParams: TilesetDisplayParams) {
    if (!this.tiles) {
      return;
    }

    const tiles: TilesRenderer = this.tiles;
    const params = { ...this.options.display, ...displayParams };

    if (params.errorTarget !== undefined)
      tiles.errorTarget = params.errorTarget;
    if (params.errorThreshold !== undefined)
      tiles.errorThreshold = params.errorThreshold;
    if (params.displayActiveTiles !== undefined)
      tiles.displayActiveTiles = params.displayActiveTiles;
    if (params.autoDisableRendererCulling !== undefined)
      tiles.autoDisableRendererCulling = params.autoDisableRendererCulling;
    if (params.maxDepth !== undefined) tiles.maxDepth = params.maxDepth;
    if (params.optimizeRaycast !== undefined)
      tiles.optimizeRaycast = params.optimizeRaycast;

    this.options.display = params;
  }
}
