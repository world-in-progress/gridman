import { SceneUpdateEvent, SceneUpdateEventType } from '../object/scene-event';
import ThreejsSceneLayer from '../threejs-scene';

export class BaseControls {
    scene: ThreejsSceneLayer;
    enabled: boolean = false;

    private dragPan = undefined;
    private dragRotate = undefined;
    private scrollZoom = undefined;
    private keyboard = undefined;

    constructor(scene) {
        this.scene = scene;
    }

    enable() {
        this.enabled = true;
        this.scene.addEventListener(SceneUpdateEventType, this.onSceneUpdate.bind(this));

        const map = this.scene.getMap();
        this.dragPan = map.dragPan.isEnabled();
        this.dragRotate = map.dragRotate.isEnabled();
        this.scrollZoom = map.scrollZoom.isEnabled();
        this.keyboard = map.keyboard.isEnabled();
        map.dragPan.disable();
        map.dragRotate.disable();
        map.scrollZoom.disable();
        map.keyboard.disable();
    }
    disable() {
        const map = this.scene.getMap();
        this.dragPan ? map.dragPan.enable() : map.dragPan.disable();
        this.dragRotate ? map.dragRotate.enable() : map.dragRotate.disable();
        this.scrollZoom ? map.scrollZoom.enable() : map.scrollZoom.disable();
        this.keyboard ? map.keyboard.enable() : map.keyboard.disable();
        this.dragPan = undefined;
        this.dragRotate = undefined;
        this.scrollZoom = undefined;
        this.keyboard = undefined;

        this.scene.removeEventListener(SceneUpdateEventType, this.onSceneUpdate.bind(this));
        this.enabled = false;
    }

    onSceneUpdate(event: SceneUpdateEvent) {
        this.update(event.delta / 1000.0);
    }

    update(time: number) {}
}
