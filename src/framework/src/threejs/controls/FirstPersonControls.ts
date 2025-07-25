import ThreejsSceneLayer from '../threejs-scene';
import { AnimationAction, AnimationMixer, Object3D, Vector3 } from 'three';
import { Character } from './Character';
import { CharacterHandle } from './CharacterHandle';
import { FollowCamera } from './FollowCamera';
import { FollowCameraHandle } from './FollowCameraHandle';
import { bindAll, extend } from '../utils/Util';
import { BaseControls } from './BaseControls';
import { CameraOptions } from 'mapbox-gl';

export type FirstPersonControlsOptions = {
    model?: Object3D;
    mixer?: AnimationMixer;

    idleAnimationAction?: AnimationAction;
    walkAnimationAction?: AnimationAction;
    runAnimationAction?: AnimationAction;

    runVelocity?: number;
    walkVelocity?: number;
    upVelocity?: number;
    rotateVeclocity?: number;
    scaleVeclocity?: number;
    fadeDuration?: number;
    modelRotateOffset?: boolean;
    modelRotateAxis?: Vector3;

    objectHeight?: number;
    cameraPitch?: number;
    cameraBearing?: number;
    cameraDistance?: number;

    cameraMaxDistance?: number;
    cameraMinDistance?: number;
    cameraMaxPitch?: number;
    cameraMinPitch?: number;
    cameraMaxBearing?: number;
    cameraMinBearing?: number;
};

const defaultOptions: FirstPersonControlsOptions = {
    model: undefined,
    mixer: undefined,
    idleAnimationAction: undefined,
    walkAnimationAction: undefined,
    runAnimationAction: undefined,

    runVelocity: 5,
    walkVelocity: 2,
    upVelocity: 0.01,
    rotateVeclocity: 0.02,
    scaleVeclocity: 1,
    fadeDuration: 0.2,
    modelRotateOffset: true,
    modelRotateAxis: new Vector3(0, 1, 0),

    objectHeight: 1,
    cameraPitch: 0,
    cameraBearing: 0,
    cameraDistance: 10,

    cameraMaxDistance: 100,
    cameraMinDistance: 1,
    cameraMaxPitch: 85,
    cameraMinPitch: 0,
    cameraMaxBearing: 0,
    cameraMinBearing: 0,
};

export class FirstPersonControls extends BaseControls {
    character: Character;
    characterHandle: CharacterHandle;
    followCamera: FollowCamera;
    followCameraHandle: FollowCameraHandle;

    mapCameraPosition: CameraOptions = {};

    constructor(scene: ThreejsSceneLayer, options: FirstPersonControlsOptions) {
        super(scene);

        options = extend({}, defaultOptions, options);

        // initialize character
        const camera = scene.getCamera();
        const model = options.model;
        const mixer = options.mixer;
        this.character = new Character(model, mixer, camera);
        this.character.idleAnimationAction = options.idleAnimationAction;
        this.character.walkAnimationAction = options.walkAnimationAction;
        this.character.runAnimationAction = options.runAnimationAction;
        this.character.runVelocity = options.runVelocity;
        this.character.walkVelocity = options.walkVelocity;
        this.character.upVelocity = options.upVelocity;
        this.character.rotateVeclocity = options.rotateVeclocity;
        this.character.scaleVeclocity = options.scaleVeclocity;
        this.character.fadeDuration = options.fadeDuration;
        this.character.modelRotateOffset = options.modelRotateOffset;
        this.character.modelRotateAxis = options.modelRotateAxis;

        // initialize follow camera
        this.followCamera = new FollowCamera();
        this.followCamera.object = model;
        this.followCamera.objectHeight = options.objectHeight;
        this.followCamera.cameraPitch = options.cameraPitch;
        this.followCamera.cameraBearing = options.cameraBearing;
        this.followCamera.cameraDistance = options.cameraDistance;
        this.followCamera.cameraMaxDistance = options.cameraMaxDistance;
        this.followCamera.cameraMinDistance = options.cameraMinDistance;
        this.followCamera.cameraMaxPitch = options.cameraMaxPitch;
        this.followCamera.cameraMinPitch = options.cameraMinPitch;
        this.followCamera.cameraMaxBearing = options.cameraMaxBearing;
        this.followCamera.cameraMinBearing = options.cameraMinBearing;

        this.characterHandle = new CharacterHandle(this.character);
        this.followCameraHandle = new FollowCameraHandle(this.followCamera);
    }

    override update(time: number) {
        if (!this.enabled) {
            return;
        }

        this.characterHandle.update(time);
        this.followCameraHandle.update(time);

        this.UpdateMapCameraPosition(time);

        const map = this.scene.getMap();
        map.jumpTo(this.mapCameraPosition);
    }

    public UpdateMapCameraPosition(time: number = 0.0) {
        this.character.update(time);
        this.followCamera.update(time);

        const map = this.scene.getMap();

        const targetPosition = this.followCamera.getTargetPosition();
        const cameraPosition = this.followCamera.getCameraPosition();
        const cameraBearing = this.followCamera.cameraBearing;
        const cameraPitch = this.followCamera.cameraPitch;

        const cameraToTargetDistance = new Vector3().subVectors(cameraPosition, targetPosition).length();
        const targetMapPosition = this.scene.toMapPosition(targetPosition);
        // const targetMercatorCoordinate = this.scene.toMercatorCoordinate(new Vector3(targetPosition.x, targetPosition.y, cameraToTargetDistance));

        // const cameraMercatorZ = targetMercatorCoordinate.z;
        const cameraMercatorZ = (map.transform.pixelsPerMeter / map.transform.worldSize) * cameraToTargetDistance;
        const zoom = map.transform._zoomFromMercatorZ(cameraMercatorZ);

        this.mapCameraPosition = {
            // @ts-ignore
            center: targetMapPosition,
            bearing: cameraBearing,
            pitch: cameraPitch,
            zoom: zoom,
        };

        return this.mapCameraPosition;
    }

    override enable() {
        super.enable();
        this.characterHandle.enable();
        this.followCameraHandle.enable();
    }

    override disable() {
        this.characterHandle.disable();
        this.followCameraHandle.disable();
        super.disable();
    }
}
