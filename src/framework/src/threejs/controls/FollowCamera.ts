import { MathUtils, Object3D, Vector3 } from 'three';

export class FollowCamera {
    object: Object3D | null = null;
    objectPosition: Vector3 = new Vector3(0, 0, 0);
    objectHeight: number = 1;
    cameraPitch: number = 0;
    cameraBearing: number = 0;
    cameraDistance: number = 10;

    cameraMaxDistance: number = 100;
    cameraMinDistance: number = 1;
    cameraMaxPitch: number = 85;
    cameraMinPitch: number = 0;
    cameraMaxBearing: number = 0;
    cameraMinBearing: number = 0;

    private _cameraPosition: Vector3 = new Vector3();
    private _targetPosition: Vector3 = new Vector3();

    private _limitCamera() {
        if (this.cameraMinBearing < this.cameraMaxBearing) {
            this.cameraBearing = MathUtils.clamp(this.cameraBearing, this.cameraMinBearing, this.cameraMaxBearing);
        }

        if (this.cameraMinPitch < this.cameraMaxPitch) {
            this.cameraPitch = MathUtils.clamp(this.cameraPitch, this.cameraMinPitch, this.cameraMaxPitch);
        }

        if (this.cameraMinDistance < this.cameraMaxDistance) {
            this.cameraDistance = MathUtils.clamp(this.cameraDistance, this.cameraMinDistance, this.cameraMaxDistance);
        }
    }

    private _calcCameraPosition() {
        this.object?.getWorldPosition(this.objectPosition);
        this.objectPosition.z += this.objectHeight;
        if (this.objectPosition.z < 0.01) this.objectPosition.z = 0.01;

        const phi = MathUtils.degToRad(this.cameraPitch);
        const theta = MathUtils.degToRad(this.cameraBearing);
        const sinPhiRadius = Math.sin(phi);
        const x = -sinPhiRadius * Math.sin(theta);
        const y = -sinPhiRadius * Math.cos(theta);
        const z = Math.cos(phi);
        const cameraDirection = new Vector3(x, y, z);

        let targetDistance = this.objectPosition.z / z;

        this._targetPosition.copy(this.objectPosition).addScaledVector(cameraDirection, -targetDistance);

        this._cameraPosition.copy(this.objectPosition).addScaledVector(cameraDirection, this.cameraDistance);
    }

    update(time: number) {
        this._limitCamera();
        this._calcCameraPosition();
    }

    public getCameraPosition(): Vector3 {
        return this._cameraPosition;
    }

    public getTargetPosition(): Vector3 {
        return this._targetPosition;
    }
}
