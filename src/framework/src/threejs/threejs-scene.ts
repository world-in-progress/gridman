import { type Map as MapboxMap, type CustomLayerInterface, LngLatLike, Point, MercatorCoordinate } from 'mapbox-gl';
import { Scene, PerspectiveCamera, Vector3, Matrix4, Object3D, Group, Raycaster, Vector2 } from 'three';

import { WebGLRenderer } from 'three';
import ThreejsSceneRenderer from './threejs-scene-renderer';
import ThreejsSceneHelper from './threejs-scene-helper';
import ThreejsUtils from './threejs-utils';
import { Position } from './threejs-types';

import { SceneRecenterEventType, SceneUpdateEventType } from './object/scene-event.js';
import Tileset, { TilesetOptions } from './tileset/tileset';
import Model, { ModelOptions } from './model/model';

import { ControlsOptions, SceneControls } from './controls/SceneControls';

export type ThreejsSceneLayerProps = {
    id: string;
    slot?: string;
    refCenter?: LngLatLike;
    envTexture?: string;
    envIntensity?: number;
    createLight?: boolean;
};

export default class ThreejsSceneLayer implements CustomLayerInterface {
    readonly id: string;
    readonly type: 'custom' = 'custom';
    readonly slot?: string;
    readonly renderingMode: '3d' = '3d';
    private _helper: ThreejsSceneHelper;

    private _map?: MapboxMap;
    private _refCenter: LngLatLike | undefined;
    private _worldMatrix: Matrix4;
    private _worldMatrixInv: Matrix4;

    private _options: ThreejsSceneLayerProps;
    private _renderer: ThreejsSceneRenderer | undefined;

    private _scene: Scene | undefined;
    private _sceneRoot: Group | undefined;
    private _camera: PerspectiveCamera | undefined;

    private _startTime: number | undefined;
    private _lastTime: number | undefined;

    private _sceneControls: SceneControls | undefined;

    private static _GetDefaultOptions(): ThreejsSceneLayerProps {
        return {
            id: 'threejs-scene-layer',
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

        this._map.transform.setOrthographicProjectionAtLowPitch(false);

        this._scene = this._helper.createScene(this._options.createLight || true);
        this._sceneRoot = this._helper.createGroup(this._scene, 'scene-root');
        this._camera = this._helper.createCamera(this._sceneRoot, 'camera-for-render');

        this._renderer = new ThreejsSceneRenderer(map, gl);

        const refCenter = this._options.refCenter || this._map?.getCenter();
        this.setRefCenter(refCenter);

        const envTexture = this._options.envTexture;
        this.setEnvTexture(envTexture);

        const envIntensity = this._options.envIntensity || 1;
        this.setEnvIntensity(envIntensity);

        this._sceneControls = new SceneControls(this);
    };

    onRemove = (map: MapboxMap, gl: WebGL2RenderingContext) => {
        this._camera = undefined;
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
        if (!this._map || !this._renderer || !this._scene || !this._camera) {
            return;
        }

        // update camera
        this._helper.updateCameraForRender(this._camera, this._map, matrix, this._worldMatrix, this._worldMatrixInv);

        this.update();

        // render
        this._renderer.render(this._scene, this._camera);
        this._map.triggerRepaint();
    };

    private _update() {
        this._map?.triggerRepaint();
    }

    addEventListener(type, listener) {
        this._scene?.addEventListener(type, listener);
    }

    removeEventListener(type, listener) {
        this._scene?.removeEventListener(type, listener);
    }

    dispatchEvent(event) {
        this._scene?.dispatchEvent(event);
    }

    update() {
        if (!this._map || !this._renderer || !this._scene || !this._camera) {
            return;
        }

        const currentTime = Date.now();
        if (this._startTime === undefined) {
            this._startTime = currentTime;
            this._lastTime = currentTime;
        }
        const delta = currentTime - this._lastTime;
        const time = currentTime - this._startTime;
        this._lastTime = currentTime;
        const event = { type: SceneUpdateEventType, time, delta };
        this.dispatchEvent(event);
    }

    ////////////////////////////
    getSceneRoot(): Group {
        return this._sceneRoot;
    }

    getRenderer(): ThreejsSceneRenderer {
        return this._renderer;
    }

    getWebGLRenderer(): WebGLRenderer {
        return this._renderer.getRenderer();
    }

    getCamera(): PerspectiveCamera {
        return this._camera;
    }

    getScene(): Scene {
        return this._scene;
    }

    getMap(): MapboxMap {
        return this._map;
    }

    getRefCenter(): LngLatLike {
        return this._refCenter;
    }

    ////////////////////////////
    // 设置参考中心
    setRefCenter(center: LngLatLike) {
        if (this._refCenter !== center && this._map) {
            this._refCenter = center;
            this._worldMatrix = ThreejsUtils.updateWorldMatrix(this._map, center);
            this._worldMatrixInv = this._worldMatrix.clone().invert();

            this._update();

            const event = { type: SceneRecenterEventType };
            this.dispatchEvent(event);
        }
    }

    // 将地图坐标转换为场景坐标
    toScenePosition(position: LngLatLike | Position, altitude?: number): Vector3 {
        if (Array.isArray(position) && position.length > 2 && altitude === undefined) {
            altitude = position[2];
        }
        return ThreejsUtils.toScenePosition(this._worldMatrixInv, position as LngLatLike, altitude);
    }

    // 将场景坐标转换为地图坐标
    toMapPosition(position: Vector3): Position {
        return ThreejsUtils.toMapPosition(this._worldMatrix, position);
    }

    toMercatorCoordinate(position: Vector3): MercatorCoordinate {
        return ThreejsUtils.toMapPositionMercator(this._worldMatrix, position);
    }

    // 设置环境纹理
    setEnvTexture(envTexture: string) {
        const environmentTexture = this._helper.createEnvTexture(envTexture, this._scene);
    }

    setEnvIntensity(intensity: number) {
        if (this._scene) {
            this._scene.environmentIntensity = intensity;
            this._update();
        }
    }

    ////////////////////////////
    compileAsync(model: Object3D): Promise<Object3D> {
        return new Promise((resolve) => {
            this._renderer
                .getRenderer()
                ?.compileAsync(model, this._camera, this._scene)
                .then(() => {
                    resolve(model);
                });
        });
    }

    findObjectByName(name: string, root?: Object3D): Object3D | undefined {
        if (!root) return this.findObjectByName(name, this._sceneRoot);

        return root.getObjectByName(name);
    }

    intersectObjects(point: Point, objects?: Object3D[] | Object3D | null) {
        if (!objects) {
            objects = this._sceneRoot.children;
        }

        if (objects instanceof Object3D) {
            objects = [objects];
        }

        let mouse = new Vector2();
        // scale mouse pixel position to a percentage of the screen's width and height
        mouse.x = (point.x / this._map.transform.width) * 2 - 1;
        mouse.y = 1 - (point.y / this._map.transform.height) * 2;

        const raycaster = new Raycaster();
        raycaster.layers.set(0);
        raycaster.setFromCamera(mouse, this._camera);

        // calculate objects intersecting the picking ray
        let intersects = raycaster.intersectObjects(objects, true);

        return intersects;
    }

    ////////////////////////////
    setControls(controlsOptions: ControlsOptions) {
        return this._sceneControls.setControls(controlsOptions);
    }

    ////////////////////////////
    addTileset(tilesetOptions: TilesetOptions): Tileset {
        return new Tileset(tilesetOptions).addToScene(this);
    }

    addModel(modelOptions: ModelOptions): Model {
        return new Model(modelOptions).addToScene(this);
    }
}
