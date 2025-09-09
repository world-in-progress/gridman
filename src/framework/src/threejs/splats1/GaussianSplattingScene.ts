import { Object3D, BufferGeometry, Box3, Sphere } from 'three';

type Nullable<T> = T | null;

/**
 * SplatScene: Descriptor for a single splat scene managed by an instance of SplatMesh.
 */
export class GaussianSplattingScene extends Object3D {
    
    static useRGBACovariants = true;
    static covBSItemSize = GaussianSplattingScene.useRGBACovariants ? 4 : 2;

    readonly isGaussianSplattingScene: true = true;


    lineStart: number = 0;
    lineCount: number = 0;
    lineWidth: number = 1;

    vertexCount: number = 0;
    splatPositions: Nullable<Float32Array> = null;
    splatCovA: Nullable<Uint16Array> = null;
    splatCovB: Nullable<Uint16Array> = null;
    splatColors: Nullable<Uint8Array> = null;

    boundingBox: Box3;
    boundingSphere: Sphere;

    needSort: boolean = false;
    needRemove: boolean = false;
    readyToRender: boolean = false;

    geometry: BufferGeometry = null;

}
