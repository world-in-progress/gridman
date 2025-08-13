import { Matrix4, Object3D, Camera, Vector3, Quaternion, AnimationMixer, AnimationAction } from 'three';

export type CharacterAnimationType = 'idle' | 'walk' | 'run';

export class Character {
    model: Object3D;
    mixer?: AnimationMixer;
    camera?: Camera;

    idleAnimationAction?: AnimationAction;
    walkAnimationAction?: AnimationAction;
    runAnimationAction?: AnimationAction;

    // 常量参数
    runVelocity: number = 5;
    walkVelocity: number = 2;
    upVelocity: number = 0.01;
    rotateVeclocity: number = 0.02;
    scaleVeclocity: number = 1;
    fadeDuration: number = 0.2;
    modelRotateOffset: boolean = true;
    modelRotateAxis = new Vector3(0, 1, 0);

    // 状态参数，用于控制器操作
    currentAction: CharacterAnimationType;
    toggleRun: boolean = false;
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    moveUp = false;
    moveDown = false;

    constructor(model: Object3D, mixer: AnimationMixer, camera: Camera) {
        this.model = model;
        this.mixer = mixer;
        this.camera = camera;
    }

    public toggleVisible() {
        this.model.visible = !this.model.visible;
    }

    private _getAnimation(type: CharacterAnimationType) {
        switch (type) {
            case 'idle':
                return this.idleAnimationAction;
            case 'walk':
                return this.walkAnimationAction || this.runAnimationAction || this.idleAnimationAction;
            case 'run':
                return this.runAnimationAction || this.walkAnimationAction || this.idleAnimationAction;
        }
        return undefined;
    }

    public toggleAction(newAction: CharacterAnimationType) {
        if (this.currentAction != newAction) {
            const toPlay = this._getAnimation(newAction);
            const current = this._getAnimation(this.currentAction);
            if (toPlay !== current) {
                current?.fadeOut(this.fadeDuration);
                toPlay?.reset().fadeIn(this.fadeDuration).play();
            } else {
                toPlay?.play();
            }
            this.currentAction = newAction;
        }
    }

    public update(delta: number) {
        if (this.moveUp || this.moveDown) {
            const moveZ = this.upVelocity * this.scaleVeclocity * (this.moveUp ? 1.0 : -1.0);
            this.moveWorldPosition(0, 0, moveZ);
        }

        var walkOrRun = false;
        if (this.moveBackward || this.moveForward || this.moveLeft || this.moveRight) {
            walkOrRun = true;
            // 获取模型和相机的世界坐标位置
            const cameraWorldPosition = new Vector3(0, 0, 1);
            this.camera?.getWorldPosition(cameraWorldPosition);

            const modelWorldPosition = new Vector3();
            this.model.getWorldPosition(modelWorldPosition);

            // 计算朝向相机的方向
            // 由于模型在世界坐标系中是沿着 Z 轴方向的，因此需要使用 X 和 Y 坐标计算角度
            var angleZCameraDirection = Math.atan2(cameraWorldPosition.x - modelWorldPosition.x, -(cameraWorldPosition.y - modelWorldPosition.y));

            // 对角移动角度偏移
            var directionOffset = this.directionOffset();

            // 旋转模型
            const rotateQuarternion = new Quaternion();
            rotateQuarternion.setFromAxisAngle(this.modelRotateAxis, angleZCameraDirection + (this.modelRotateOffset ? directionOffset : 0.0));
            this.model.quaternion.rotateTowards(rotateQuarternion, this.rotateVeclocity);

            // 计算移动方向
            const rotateAxis2 = new Vector3(0, 0, 1); // Z轴旋转
            const walkDirection = new Vector3(0, 1, 0);
            this.camera?.getWorldDirection(walkDirection);
            walkDirection.z = 0; // 由于模型是沿着 Z 轴方向的，需要将 Z 分量置为 0
            walkDirection.normalize();
            walkDirection.applyAxisAngle(rotateAxis2, directionOffset);

            // 运行/行走速度
            const deltaTime = 0.01; // delta; TODO: 由于帧率不稳定会导致抖动，设置为常数
            const velocity = (this.toggleRun ? this.runVelocity : this.walkVelocity) * deltaTime * this.scaleVeclocity;

            // 移动模型
            const moveX = walkDirection.x * velocity;
            const moveY = walkDirection.y * velocity;
            this.moveWorldPosition(moveX, moveY, 0);
        }

        // update animations
        if (walkOrRun) {
            this.toggleAction(this.toggleRun ? 'run' : 'walk');
        } else {
            this.toggleAction('idle');
        } // todo: jump or fly ...
        this.mixer?.update(delta);
    }

    private moveWorldPosition(moveX, moveY, moveZ) {
        const modelWorldPosition = new Vector3();
        this.model.getWorldPosition(modelWorldPosition);

        modelWorldPosition.x += moveX;
        modelWorldPosition.y += moveY;
        modelWorldPosition.z += moveZ;

        // 如果对象有父对象，需要计算相对于父对象的局部位置
        if (this.model.parent) {
            // 使用父对象的世界矩阵的逆矩阵来转换世界位置为局部位置
            const worldToLocalMatrix = new Matrix4().copy(this.model.parent.matrixWorld).invert();
            const localPosition = modelWorldPosition.clone().applyMatrix4(worldToLocalMatrix);
            this.model.position.copy(localPosition);
        } else {
            // 如果没有父对象，直接设置世界位置
            this.model.position.copy(modelWorldPosition);
        }
    }

    private directionOffset() {
        var directionOffset = 0;

        if (this.moveForward) {
            if (this.moveLeft) {
                directionOffset = Math.PI / 4;
            } else if (this.moveRight) {
                directionOffset = -Math.PI / 4;
            }
        } else if (this.moveBackward) {
            if (this.moveLeft) {
                directionOffset = Math.PI / 4 + Math.PI / 2;
            } else if (this.moveRight) {
                directionOffset = -Math.PI / 4 - Math.PI / 2;
            } else {
                directionOffset = Math.PI;
            }
        } else if (this.moveLeft) {
            directionOffset = Math.PI / 2;
        } else if (this.moveRight) {
            directionOffset = -Math.PI / 2;
        }

        return directionOffset;
    }
}
