import { bindAll } from '../utils/Util';
import { FollowCamera } from './FollowCamera';

export class FollowCameraHandle {
    followCamera: FollowCamera;
    zoomSpeed: number = 1;
    rotateXSpeed: number = 1;
    rotateYSpeed: number = 1;

    private _moveLook = false;
    private _pointerX = 0;
    private _pointerY = 0;
    private _pointerXLast = 0;
    private _pointerYLast = 0;

    constructor(followCamera: FollowCamera) {
        this.followCamera = followCamera;

        bindAll(['mousedown', 'mousemove', 'mouseup', 'mousewheel', 'contextmenu'], this);
    }

    mousewheel(e) {
        const followCamera = this.followCamera;
        const scope = this;
        let delta = e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 40 : e.deltaY;
        const zoomSpeed = scope.zoomSpeed;
        const normalizedDelta = Math.abs(delta * 0.01);
        const zoom = Math.pow(0.95, zoomSpeed * normalizedDelta);

        if (delta < 0) {
            followCamera.cameraDistance *= zoom;
        } else {
            followCamera.cameraDistance /= zoom;
        }
    }

    mousedown(e) {
        this._pointerX = e.pageX;
        this._pointerY = e.pageY;
        this._pointerXLast = this._pointerX;
        this._pointerYLast = this._pointerY;

        switch (e.button) {
            case 2:
                this._moveLook = true;
                break;
        }
    }

    mouseup(e) {
        switch (e.button) {
            case 2:
                this._moveLook = false;
                break;
        }
    }

    mousemove(e) {
        this._pointerX = e.pageX;
        this._pointerY = e.pageY;

        if (this._moveLook) {
            const rotateXSpeed = this.rotateXSpeed;
            const rotateYSpeed = this.rotateYSpeed;

            const degreesPerPixelMovedX = 0.5 * rotateXSpeed;
            const bearingDelta = (this._pointerX - this._pointerXLast) * degreesPerPixelMovedX;
            const degreesPerPixelMovedY = -0.3 * rotateYSpeed;
            const pitchDelta = (this._pointerY - this._pointerYLast) * degreesPerPixelMovedY;

            this.followCamera.cameraBearing += bearingDelta;
            this.followCamera.cameraPitch += pitchDelta;
        }

        this._pointerXLast = this._pointerX;
        this._pointerYLast = this._pointerY;
    }

    contextmenu(e) {
        e.preventDefault();
    }

    enable() {
        window.addEventListener('wheel', this.mousewheel);
        window.addEventListener('pointerdown', this.mousedown);
        window.addEventListener('pointerup', this.mouseup);
        window.addEventListener('pointermove', this.mousemove);
        window.addEventListener('contextmenu', this.contextmenu);
    }

    disable() {
        window.removeEventListener('wheel', this.mousewheel);
        window.removeEventListener('pointerdown', this.mousedown);
        window.removeEventListener('pointerup', this.mouseup);
        window.removeEventListener('pointermove', this.mousemove);
        window.removeEventListener('contextmenu', this.contextmenu);
    }

    public update(delta: number) {}
}
