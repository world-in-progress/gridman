import { CatmullRomCurve3, Group, Matrix4, Object3D, Vector3 } from 'three';
import ThreejsSceneLayer from '../threejs-scene';
import { SceneRecenterEvent, SceneRecenterEventType, SceneUpdateEvent, SceneUpdateEventType } from './scene-event';

function onSceneUpdate() {}

export class SceneObject extends Object3D {
    readonly isSceneObject: true;
    _parentObjectName: string;
    _parentObject: Object3D | undefined;
    _scene: ThreejsSceneLayer | undefined;
    onSceneUpdate: (event: SceneUpdateEvent) => void;
    onSceneRecenter: (event: SceneRecenterEvent) => void;

    constructor() {
        super();
        this._scene = undefined;
        this._parentObjectName = 'unknown';

        const _this = this;
        this.onSceneUpdate = function onSceneUpdate(event: SceneUpdateEvent) {
            _this.updateSceneTime(event.time, event.delta);
        };
        this.onSceneRecenter = function onSceneRecenter(event: SceneRecenterEvent) {
            _this.updateSceneTransform();
        };
    }

    getOrAddParentObject(): Object3D {
        const sceneRoot = this._scene.getSceneRoot();
        this._parentObject = sceneRoot.getObjectByName(this._parentObjectName);
        if (!this._parentObject) {
            this._parentObject = new Group();
            this._parentObject.name = this._parentObjectName;
            sceneRoot.add(this._parentObject);
        }
        return this._parentObject;
    }

    addToScene(scene: ThreejsSceneLayer): this {
        this._scene = scene;
        this._scene.addEventListener(SceneUpdateEventType, this.onSceneUpdate);
        this._scene.addEventListener(SceneRecenterEventType, this.onSceneRecenter);

        this.getOrAddParentObject().add(this);
        this.updateSceneTransform();

        return this;
    }

    removeFromScene(): this {
        if (this._scene === undefined) return this;

        this.getOrAddParentObject().remove(this);
        this._scene.removeEventListener(SceneRecenterEventType, this.onSceneRecenter);
        this._scene.removeEventListener(SceneUpdateEventType, this.onSceneUpdate);
        this._scene = undefined;

        return this;
    }

    updateSceneTime(time: number, delta: number) {}

    updateSceneTransform() {}

    override remove(...object: Object3D[]): this;
    override remove(): this;
    override remove(...object: Object3D[] | undefined): this {
        if (this._scene !== undefined) {
            if (object === undefined || object.length === 0) {
                this.removeFromScene();
                return this;
            }
        }
        return super.remove(...object);
    }
}
