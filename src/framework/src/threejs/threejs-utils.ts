import { type Map as MapboxMap, MercatorCoordinate, LngLatLike } from 'mapbox-gl';

import { Vector3, Quaternion, Euler, Matrix4 } from 'three';

import { WebGLRenderer } from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

import { Position } from './threejs-types.js';

export default class ThreejsUtils {
    static _renderer: WebGLRenderer | null = null;
    static _labelRenderer: CSS2DRenderer | null = null;

    // 创建 threejs 实例， 需要传入 map 和 gl 上下文
    static initRenderer({ map, gl }: { map: MapboxMap; gl: WebGL2RenderingContext }) {
        // Only create one threejs instance per context
        if (this._renderer && this._labelRenderer) {
            return;
        }

        let renderer: WebGLRenderer = new WebGLRenderer({
            alpha: true,
            antialias: true,
            canvas: map.getCanvas(),
            context: gl,
        });

        renderer.shadowMap.enabled = true;
        renderer.autoClear = false;

        let labelRenderer: CSS2DRenderer = new CSS2DRenderer();
        labelRenderer.setSize(map._containerWidth, map._containerHeight);
        labelRenderer.domElement.style.position = 'absolute';
        labelRenderer.domElement.style.top = '0px';
        labelRenderer.domElement.style.pointerEvents = 'none';
        map._container.appendChild(labelRenderer.domElement);
        map.on('resize', () => {
            labelRenderer.setSize(map._containerWidth, map._containerHeight);
        });

        this._renderer = renderer;
        this._labelRenderer = labelRenderer;
    }

    static getRenderer(): WebGLRenderer {
        return this._renderer;
    }
    static getLabelRenderer(): CSS2DRenderer {
        return this._labelRenderer;
    }

    // 更新世界矩阵， 需要根据 map 的中心点计算世界矩阵，将相对中心的坐标转换到墨卡托坐标系中
    static updateWorldMatrix(map: MapboxMap | null, refCenter: LngLatLike | null = null): Matrix4 {
        const mapCenter = refCenter ? refCenter : map.getCenter();

        // Calculate mercator coordinates and scale
        const worldOriginMercator = MercatorCoordinate.fromLngLat(mapCenter);
        const worldScale = worldOriginMercator.meterInMercatorCoordinateUnits();
        const worldRotate = [0, 0, 0];

        // Calculate world matrix
        const worldMatrix = new Matrix4();
        worldMatrix.compose(new Vector3(worldOriginMercator.x, worldOriginMercator.y, worldOriginMercator.z), new Quaternion().setFromEuler(new Euler(worldRotate[0], worldRotate[1], worldRotate[2])), new Vector3(worldScale, -worldScale, worldScale));

        return worldMatrix;
    }

    static toScenePositionMercator(worldMatrixInv: Matrix4, positionMercator: MercatorCoordinate): Vector3 {
        const positionRef = new Vector3(positionMercator.x, positionMercator.y, positionMercator.z).applyMatrix4(worldMatrixInv);
        return positionRef;
    }

    static toMapPositionMercator(worldMatrix: Matrix4, position: Vector3): MercatorCoordinate {
        const positionMercator = position.clone().applyMatrix4(worldMatrix);

        return new MercatorCoordinate(positionMercator.x, positionMercator.y, positionMercator.z);
    }

    static toScenePosition(worldMatrixInv: Matrix4, position: LngLatLike, altitude?: number): Vector3 {
        const positionMercator = MercatorCoordinate.fromLngLat(position, altitude);
        return this.toScenePositionMercator(worldMatrixInv, positionMercator);
    }

    static toMapPosition(worldMatrix: Matrix4, position: Vector3): Position {
        const positionMercator = this.toMapPositionMercator(worldMatrix, position);
        const lngLat = positionMercator.toLngLat();
        const altitude = positionMercator.toAltitude();
        return [lngLat.lng, lngLat.lat, altitude];
    }

    // 角度转弧度
    static degToRad(a: number): number {
        return (a / 180) * Math.PI;
    }
    // 角度转弧度
    static radToDeg(a: number): number {
        return (a / Math.PI) * 180;
    }

    // static loadGeojson(url: string): Promise<any> {
    //   return new Promise((resolve, reject) => {
    //     const xhr = new XMLHttpRequest();
    //     xhr.open("GET", url);
    //     xhr.onload = () => {
    //       if (xhr.status === 200) {
    //         resolve(JSON.parse(xhr.responseText));
    //       } else {
    //         reject(xhr.statusText);
    //       }
    //     };
    //     xhr.onerror = () => {
    //       reject(xhr.statusText);
    //     };
    //     xhr.send();
    //   });
    // }

    static toSceneGeometry(data: Position[]) {}
}
