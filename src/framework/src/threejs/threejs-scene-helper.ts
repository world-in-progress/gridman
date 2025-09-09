import { type Map as MapboxMap } from 'mapbox-gl';

import { Scene, PerspectiveCamera, Matrix4, Group, EquirectangularReflectionMapping, DirectionalLight, AmbientLight, Vector3, Quaternion, Euler } from 'three';

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import ThreejsUtils from './threejs-utils';

export default class ThreejsSceneHelper {
    // 创建场景
    createScene(creatLight: boolean = true): Scene {
        const scene = new Scene();

        if (creatLight) {
            // lights
            const dirLight = new DirectionalLight(0xffffff, 4);
            dirLight.position.set(1, 2, 3);
            scene.add(dirLight);

            const ambLight = new AmbientLight(0xffffff, 0.2);
            scene.add(ambLight);
        }

        return scene;
    }

    // 创建渲染组
    createGroup(parent: Scene | Group, name: string): Group {
        const group = new Group();
        group.name = name;
        parent.add(group);
        return group;
    }

    // 创建相机， 默认使用 PerspectiveCamera
    createCamera(sceneRoot: Group, name: string): PerspectiveCamera {
        const camera = new PerspectiveCamera();
        camera.name = name;

        const group = new Group();
        group.name = name + '-parent';
        group.add(camera);

        sceneRoot.add(group);
        return camera;
    }

    _calcProjectionMatrices(transform) {
        const offset = transform.centerOffset;
        let cameraToClip;

        const cameraToClipPerspective = transform._camera.getCameraToClipPerspective(transform._fov, transform.width / transform.height, transform._nearZ, transform._farZ);
        // Apply offset/padding
        cameraToClipPerspective[8] = (-offset.x * 2) / transform.width;
        cameraToClipPerspective[9] = (offset.y * 2) / transform.height;

        if (transform.isOrthographic) {
            const OrthographicPitchTranstionValue = 15;
            const lerp = (x: number, y: number, t: number) => {
                return (1 - t) * x + t * y;
            };
            const easeIn = (x: number) => {
                return x * x * x * x * x;
            };
            const lerpMatrix = (out, a, b, value: number) => {
                for (let i = 0; i < 16; i++) {
                    out[i] = lerp(a[i], b[i], value);
                }

                return out;
            };

            const cameraToCenterDistance = ((0.5 * transform.height) / Math.tan(transform._fov / 2.0)) * 1.0;

            // Calculate bounds for orthographic view
            let top = cameraToCenterDistance * Math.tan(transform._fov * 0.5);
            let right = top * transform.aspect;
            let left = -right;
            let bottom = -top;
            // Apply offset/padding
            right -= offset.x;
            left -= offset.x;
            top += offset.y;
            bottom += offset.y;

            cameraToClip = transform._camera.getCameraToClipOrthographic(left, right, bottom, top, transform._nearZ, transform._farZ);

            const mixValue = transform.pitch >= OrthographicPitchTranstionValue ? 1.0 : transform.pitch / OrthographicPitchTranstionValue;
            lerpMatrix(cameraToClip, cameraToClip, cameraToClipPerspective, easeIn(mixValue));
        } else {
            cameraToClip = cameraToClipPerspective;
        }

        return new Matrix4().fromArray(cameraToClip);
    }

    // 更新相机矩阵，需要将 mapbox 的矩阵转换为 threejs 的矩阵
    // 转换过程中，需要将 viewMatrix 和 projectionMatrix 拆分， 以便设置正确的 view 和 projection 矩阵
    updateCameraForRender(camera: PerspectiveCamera, map: MapboxMap, matrix: number[], worldMatrix: Matrix4, worldMatrixInv: Matrix4) {
        const mapMatrix = new Matrix4().fromArray(matrix);
        const mvpMatrix = new Matrix4().multiplyMatrices(mapMatrix, worldMatrix);

        // 计算投影矩阵
        // camera.fov = ThreejsUtils.radToDeg(map.transform.fovY);
        camera.fov = ThreejsUtils.radToDeg(map.transform.fovX);
        camera.aspect = map.transform.aspect;
        camera.near = map.transform._nearZ;
        camera.far = map.transform._farZ;
        // camera.updateProjectionMatrix();

        // 基于 mapbox 的 transform 计算投影矩阵
        const transform = map.transform;
        this._calcProjectionMatrices(transform);
        const cameraToClip = this._calcProjectionMatrices(transform);
        camera.projectionMatrix.copy(cameraToClip);
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

        const projectionMatrixInverse = camera.projectionMatrixInverse;

        // 计算相机矩阵
        const viewMatrix = new Matrix4().multiplyMatrices(projectionMatrixInverse, mvpMatrix);
        const viewMatrixInvert = viewMatrix.clone().invert();
        camera.matrixWorld.copy(viewMatrixInvert);
        camera.matrixWorldInverse.copy(viewMatrix);
        camera.matrixAutoUpdate = false;
        camera.matrixWorldAutoUpdate = false;

        const position = new Vector3();
        const quaternion = new Quaternion();
        const scale = new Vector3();
        camera.matrixWorld.decompose(position, quaternion, scale);
        camera.position.set(position.x, position.y, position.z);
        const euler = new Euler().setFromQuaternion(quaternion, 'YXZ');
        camera.rotation.set(euler.x, euler.y, euler.z);
    }

    // 创建环境贴图， 支持通用的 hdr 贴图和官方的压缩 env 贴图
    createEnvTexture(envTexture: string, scene: Scene) {
        if (envTexture && envTexture.length > 3 && envTexture.indexOf('.hdr') === envTexture.length - 4) {
            const rgbeLoader = new RGBELoader();
            rgbeLoader.load(envTexture, (environmentMap) => {
                environmentMap.mapping = EquirectangularReflectionMapping;
                // scene.background = environmentMap;
                // scene.backgroundRotation.x = Math.PI / 2;

                scene.environment = environmentMap;
                scene.environmentRotation.x = Math.PI / 2;
            });
        }
    }
}
