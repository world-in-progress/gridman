import {
    BufferGeometry,
    Camera,
    ColorRepresentation,
    Group,
    Material,
    Mesh,
    Scene,
    Vector2,
    Vector3,
    Vector4,
    Quaternion,
    Matrix4,
    WebGLRenderer,
    DataTexture,
    PixelFormat,
    UnsignedIntType,
    FloatType,
    UnsignedByteType,
    HalfFloatType,
    DataUtils,
    RGBAFormat,
    RGBAIntegerFormat,
    RGIntegerFormat,
    ClampToEdgeWrapping,
    Box3,
    UVMapping,
    LinearFilter,
    NearestFilter,
    RGFormat,
    Sphere,
    AlphaFormat,
    ByteType,
    DepthFormat,
    DepthStencilFormat,
    IntType,
    RedFormat,
    RedIntegerFormat,
    RGBFormat,
    ShortType,
    UnsignedInt248Type,
    UnsignedInt5999Type,
    UnsignedShort4444Type,
    UnsignedShort5551Type,
    UnsignedShortType,
} from 'three';
import { GaussianSplattingGeometry } from './GaussianSplattingGeometry';
import { GaussianSplattingMaterial } from './GaussianSplattingMaterial';
import { GaussianSplattingSorter } from './GaussianSplattingSorter';
import { GaussianSplattingScene } from './GaussianSplattingScene';

/* eslint-disable @typescript-eslint/naming-convention */
/** Alias type for value that can be null */
export type Nullable<T> = T | null;

/**
 * Class used to render a gaussian splatting mesh
 */
export class GaussianSplattingMesh extends Mesh {
    private _sorter: Nullable<GaussianSplattingSorter> = null;

    private _centersData: Nullable<Float32Array> = null;
    private _covariancesAData: Nullable<Uint16Array> = null;
    private _covariancesBData: Nullable<Uint16Array> = null;
    private _colorsData: Nullable<Uint8Array> = null;

    covariancesATexture: Nullable<DataTexture> = null;
    covariancesBTexture: Nullable<DataTexture> = null;
    centersTexture: Nullable<DataTexture> = null;
    colorsTexture: Nullable<DataTexture> = null;
    shTextures: Nullable<DataTexture[]> = null;

    private _textureSize;
    private _maxVertexCount;

    renderer: WebGLRenderer;
    camera: Camera;
    boundingBox: Box3;
    boundingSphere: Sphere;

    // The individual splat scenes stored in this splat mesh, each containing their own transform
    scenes: GaussianSplattingScene[] = [];
    sortingScenes: GaussianSplattingScene[] = [];
    renderingScenes: GaussianSplattingScene[] = [];
    removeingScenes: GaussianSplattingScene[] = [];

    sortRunning: boolean = false;
    splatRenderCount: number;

    readonly isGaussianSplattingMesh: true = true;

    /**
     * Creates a new gaussian splatting mesh
     */
    constructor(renderer: WebGLRenderer, camera: Camera, textureSize: Vector2) {
        super();

        this.renderer = renderer;
        this.camera = camera;

        this._textureSize = textureSize;
        this._maxVertexCount = this._textureSize.x * this._textureSize.y;

        this.geometry = GaussianSplattingGeometry.build(this._maxVertexCount);
        this.material = GaussianSplattingMaterial.build();

        this._sorter = new GaussianSplattingSorter(this);

        this._initTextures(false);
    }

    async dispose() {}

    resizeTextures(textureSize: Vector2) {
        if (this._textureSize.equals(textureSize)) {
            return;
        }

        const splatColors = this._colorsData;
        const splatPositions = this._centersData;
        const splatCovA = this._covariancesAData;
        const splatCovB = this._covariancesBData;

        this._textureSize.copy(textureSize);
        this._initTextures(true);

        const covBSItemSize = GaussianSplattingScene.covBSItemSize;
        const useRGBACovariants = GaussianSplattingScene.useRGBACovariants;

        const scenes = this.scenes;
        this.scenes = [];
        for (const scene of scenes) {
            const vertexCount = scene.vertexCount;

            // splatPositions is in RAM, so we need to create a new Float32Array with the new size
            // scene.splatPositions = new Float32Array(splatPositions.buffer, scene.lineStart * scene.lineWidth * 4, scene.vertexCount);
            scene.splatCovA = new Uint16Array(splatCovA.buffer, scene.lineStart * scene.lineWidth * 4, scene.vertexCount);
            scene.splatCovB = new Uint16Array(splatCovB.buffer, scene.lineStart * scene.lineWidth * covBSItemSize, scene.vertexCount);
            scene.splatColors = new Uint8Array(splatColors.buffer, scene.lineStart * scene.lineWidth * 4, scene.vertexCount);

            this._updateSceneTextureLines(scene);

            const lineStart = scene.lineStart;
            const lineCount = scene.lineCount;
            const lineWidth = scene.lineWidth;

            // copy data to mesh
            this._copyData(this._centersData, scene.splatPositions, lineWidth, 4, vertexCount, lineStart, lineCount);
            this._copyData(this._covariancesAData, scene.splatCovA, lineWidth, 4, vertexCount, lineStart, lineCount);
            this._copyData(this._covariancesBData, scene.splatCovB, lineWidth, covBSItemSize, vertexCount, lineStart, lineCount);
            this._copyData(this._colorsData, scene.splatColors, lineWidth, 4, vertexCount, lineStart, lineCount);

            scene.splatCovA = null;
            scene.splatCovB = null;
            scene.splatColors = null;

            scene.needSort = true;
            scene.readyToRender = true;
            this.scenes.push(scene);
        }
        this.covariancesATexture.needsUpdate = true;
        this.covariancesBTexture.needsUpdate = true;
        this.centersTexture.needsUpdate = true;
        this.colorsTexture.needsUpdate = true;

        this._maxVertexCount = this._textureSize.x * this._textureSize.y;
        const splatIndex = this.geometry.attributes.splatIndex.array;
        //@ts-ignore
        const instanceCount = this.geometry.instanceCount;
        this.geometry = GaussianSplattingGeometry.build(this._maxVertexCount);
        for (let i = 0; i < instanceCount; i++) {
            this.geometry.attributes.splatIndex.array[i] = splatIndex[i];
        }
        this.geometry.attributes.splatIndex.needsUpdate = true;
    }

    updateSceneTexture(scene: GaussianSplattingScene): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this._updateSceneTextureLines(scene)) {
                // // try to resize texture to fit new scene
                // const newTextureSize = new Vector2(this._textureSize.x, this._textureSize.y );
                // while(true){
                //     newTextureSize.x *= 2;
                //     newTextureSize.y *= 2;
                //     if(newTextureSize.x * newTextureSize.y * 0.75 > scene.vertexCount) {
                //         break;
                //     }
                //     if(newTextureSize.x > this._MaxTextureSize || newTextureSize.y > this._MaxTextureSize) {
                //         return reject('Failed to add new scene, max texture size reached');
                //     }
                // }
                // this.resizeTextures(newTextureSize);

                // if (!this._updateSceneTextureLines(scene))
                return reject('Failed to add new scene');
            }

            // TODO:
            // this.scenes.push(scene);

            this._updateSceneTexture(scene);

            resolve();
        });
    }

    addSplatScene(scene: GaussianSplattingScene): void {
        this.scenes.push(scene);
    }

    removeSplatScene(scene: GaussianSplattingScene): void {
        const index = this.scenes.indexOf(scene);
        if (index === -1) return;

        if (this.sortingScenes.includes(scene) || this.renderingScenes.includes(scene)) {
            this.removeingScenes.push(scene);
            return;
        }

        this.scenes.splice(index, 1);
    }

    async runSplatSort(visibleScenes: GaussianSplattingScene[]): Promise<void> {
        if (this.removeingScenes.length > 0) {
            for (let i = this.removeingScenes.length - 1; i >= 0; i--) {
                const scene = this.removeingScenes[i];
                if (!this.renderingScenes.includes(scene) && !this.sortingScenes.includes(scene)) {
                    const index = this.scenes.indexOf(scene);
                    this.scenes.splice(index, 1);
                    this.removeingScenes.splice(i, 1);
                }
            }
        }

        if (this.sortRunning) {
            return;
        }

        this.sortRunning = true;
        this.sortingScenes = visibleScenes;
        this._sorter
            .sortSplatMesh(visibleScenes, this.camera)
            .then((result) => {
                if (result.updateCount > 0) {
                    for (let i = result.updateStart; i < result.updateCount; i++) {
                        this.geometry.attributes.splatIndex.array[i] = result.splatIndex[i];
                    }
                    //@ts-ignore
                    this.geometry.attributes.splatIndex.addUpdateRange(result.updateStart, result.updateCount);
                    this.geometry.attributes.splatIndex.needsUpdate = true;
                }

                //@ts-ignore
                this.geometry.instanceCount = result.vertexCount;
                this.renderingScenes = this.sortingScenes;
            })
            .finally(() => {
                this.sortingScenes = [];
                this.sortRunning = false;
            });
    }

    private _updateSceneTextureLines(scene: GaussianSplattingScene) {
        const width = this._textureSize.x;
        const height = this._textureSize.y;
        const vertexCount = scene.vertexCount;
        const lineCount = Math.ceil(vertexCount / width);

        const lineStart = this._findBestLineStart(height, this.scenes, lineCount);
        if (lineStart === null) {
            console.error('No space available to add new line');
            return false;
        }

        scene.lineCount = lineCount;
        scene.lineStart = lineStart;
        scene.lineWidth = width;
        scene.readyToRender = false;

        return true;
    }

    private _findBestLineStart(maxLineCount: number, scenes: GaussianSplattingScene[], newLineCount: number): number | null {
        if (scenes.length === 0) {
            return newLineCount <= maxLineCount ? 0 : null;
        }

        // 按 lineStart 排序
        scenes.sort((a, b) => a.lineStart - b.lineStart);

        // 检查场景列表的开头是否有足够的空间
        if (scenes[0].lineStart >= newLineCount) {
            return 0;
        }

        // 遍历场景列表，查找两个场景之间的空隙是否有足够的空间
        for (let i = 0; i < scenes.length - 1; i++) {
            const currentEnd = scenes[i].lineStart + scenes[i].lineCount;
            const nextStart = scenes[i + 1].lineStart;

            if (nextStart - currentEnd >= newLineCount) {
                return currentEnd;
            }
        }

        // 检查场景列表的结尾是否有足够的空间
        const lastEnd = scenes[scenes.length - 1].lineStart + scenes[scenes.length - 1].lineCount;
        if (maxLineCount - lastEnd >= newLineCount) {
            return lastEnd;
        }

        // 如果没有找到合适的位置，返回 null
        return null;
    }

    private _initTextures(useData: boolean): void {
        // Update the textures
        const createTextureFromData = (data: Float32Array, width: number, height: number, format: PixelFormat) => {
            const texture = new DataTexture(data, width, height, format, FloatType, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearFilter);
            texture.generateMipmaps = false;
            texture.needsUpdate = true;
            return texture;
        };

        const createTextureFromDataU8 = (data: Uint8Array, width: number, height: number, format: PixelFormat) => {
            const texture = new DataTexture(data, width, height, format, UnsignedByteType, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearFilter);
            texture.generateMipmaps = false;
            texture.needsUpdate = true;
            return texture;
        };

        const createTextureFromDataU32 = (data: Uint32Array, width: number, height: number, format: PixelFormat) => {
            const texture = new DataTexture(data, width, height, format, UnsignedIntType, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearFilter);
            texture.generateMipmaps = false;
            texture.needsUpdate = true;
            return texture;
        };

        const createTextureFromDataF16 = (data: Uint16Array, width: number, height: number, format: PixelFormat) => {
            const texture = new DataTexture(data, width, height, format, HalfFloatType, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearFilter);
            texture.generateMipmaps = false;
            texture.needsUpdate = true;
            return texture;
        };

        const textureSize = this._textureSize;
        const covBSItemSize = GaussianSplattingScene.covBSItemSize;
        const useRGBACovariants = GaussianSplattingScene.useRGBACovariants;

        this._centersData = new Float32Array(textureSize.x * textureSize.y * 4);
        this._covariancesAData = new Uint16Array(textureSize.x * textureSize.y * 4);
        this._covariancesBData = new Uint16Array(textureSize.x * textureSize.y * covBSItemSize);
        this._colorsData = new Uint8Array(textureSize.x * textureSize.y * 4);

        // no data to save time, but has gl warning
        this.covariancesATexture = createTextureFromDataF16(useData ? this._covariancesAData : null, textureSize.x, textureSize.y, RGBAFormat);
        this.covariancesBTexture = createTextureFromDataF16(useData ? this._covariancesBData : null, textureSize.x, textureSize.y, useRGBACovariants ? RGBAFormat : RGFormat);
        this.centersTexture = createTextureFromData(useData ? this._centersData : null, textureSize.x, textureSize.y, RGBAFormat);
        this.colorsTexture = createTextureFromDataU8(useData ? this._colorsData : null, textureSize.x, textureSize.y, RGBAFormat);
    }

    private _convert(gl, p) {
        if (p === UnsignedByteType) return gl.UNSIGNED_BYTE;
        if (p === UnsignedShort4444Type) return gl.UNSIGNED_SHORT_4_4_4_4;
        if (p === UnsignedShort5551Type) return gl.UNSIGNED_SHORT_5_5_5_1;
        if (p === UnsignedInt5999Type) return gl.UNSIGNED_INT_5_9_9_9_REV;

        if (p === ByteType) return gl.BYTE;
        if (p === ShortType) return gl.SHORT;
        if (p === UnsignedShortType) return gl.UNSIGNED_SHORT;
        if (p === IntType) return gl.INT;
        if (p === UnsignedIntType) return gl.UNSIGNED_INT;
        if (p === FloatType) return gl.FLOAT;
        if (p === HalfFloatType) return gl.HALF_FLOAT;

        if (p === AlphaFormat) return gl.ALPHA;
        if (p === RGBFormat) return gl.RGB;
        if (p === RGBAFormat) return gl.RGBA;
        if (p === DepthFormat) return gl.DEPTH_COMPONENT;
        if (p === DepthStencilFormat) return gl.DEPTH_STENCIL;

        // WebGL2 formats.

        if (p === RedFormat) return gl.RED;
        if (p === RedIntegerFormat) return gl.RED_INTEGER;
        if (p === RGFormat) return gl.RG;
        if (p === RGIntegerFormat) return gl.RG_INTEGER;
        if (p === RGBAIntegerFormat) return gl.RGBA_INTEGER;

        //

        if (p === UnsignedInt248Type) return gl.UNSIGNED_INT_24_8;

        // if "p" can't be resolved, assume the user defines a WebGL constant as a string (fallback/workaround for packed RGB formats)

        return gl[p] !== undefined ? gl[p] : null;
    }

    private _copyData(data0: ArrayBufferView, data1: ArrayBufferView, width: number, elementCount: number, vertexCount: number, lineStart: number, lineCount: number) {
        const offset = lineStart * width * elementCount;
        for (let i = 0; i < vertexCount; i++) {
            const index1 = i * elementCount;
            const index0 = i * elementCount + offset;
            for (let j = 0; j < elementCount; j++) {
                data0[index0 + j] = data1[index1 + j];
            }
        }
    }

    private _updateSceneTexture(scene: GaussianSplattingScene): void {
        const updateTextureFromData = (texture: DataTexture, data: ArrayBufferView, width: number, lineStart: number, lineCount: number) => {
            const gl = this.renderer.getContext();
            const textureSize = this._textureSize;

            const textureProps = this.renderer ? this.renderer.properties.get(texture) : null;
            //@ts-ignore
            if (!textureProps || !textureProps.__webglTexture) {
                texture.needsUpdate = true;
            } else {
                const glType = this._convert(gl, texture.type);
                const glFormat = this._convert(gl, texture.format);
                const currentTexture = gl.getParameter(gl.TEXTURE_BINDING_2D);
                //@ts-ignore
                gl.bindTexture(gl.TEXTURE_2D, textureProps.__webglTexture);
                gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, lineStart, textureSize.x, lineCount, glFormat, glType, data);
                gl.bindTexture(gl.TEXTURE_2D, currentTexture);
            }
        };

        const lineStart = scene.lineStart;
        const lineCount = scene.lineCount;
        const lineWidth = scene.lineWidth;
        const vertexCount = scene.vertexCount;
        const covBSItemSize = GaussianSplattingScene.covBSItemSize;

        // copy data to mesh
        this._copyData(this._centersData, scene.splatPositions, lineWidth, 4, vertexCount, lineStart, lineCount);
        this._copyData(this._covariancesAData, scene.splatCovA, lineWidth, 4, vertexCount, lineStart, lineCount);
        this._copyData(this._covariancesBData, scene.splatCovB, lineWidth, covBSItemSize, vertexCount, lineStart, lineCount);
        this._copyData(this._colorsData, scene.splatColors, lineWidth, 4, vertexCount, lineStart, lineCount);
        // splatBuffer.splatPositions = null; // used for sorting, keep in ram
        scene.splatCovA = null; // don't need anymore
        scene.splatCovB = null; // don't need anymore
        scene.splatColors = null; // don't need anymore

        const texelStart = lineStart * lineWidth;
        const texelCount = lineCount * lineWidth;
        const covAView = new Uint16Array(this._covariancesAData.buffer, texelStart * 4 * Uint16Array.BYTES_PER_ELEMENT, texelCount * 4);
        const covBView = new Uint16Array(this._covariancesBData.buffer, texelStart * covBSItemSize * Uint16Array.BYTES_PER_ELEMENT, texelCount * covBSItemSize);
        const colorsView = new Uint8Array(this._colorsData.buffer, texelStart * 4, texelCount * 4);
        const centersView = new Float32Array(this._centersData.buffer, texelStart * 4 * Float32Array.BYTES_PER_ELEMENT, texelCount * 4);

        updateTextureFromData(this.covariancesATexture!, covAView, lineWidth, lineStart, lineCount);
        updateTextureFromData(this.covariancesBTexture!, covBView, lineWidth, lineStart, lineCount);
        updateTextureFromData(this.centersTexture!, centersView, lineWidth, lineStart, lineCount);
        updateTextureFromData(this.colorsTexture!, colorsView, lineWidth, lineStart, lineCount);

        scene.readyToRender = true;
    }

    override onBeforeRender(renderer: WebGLRenderer, scene: Scene, camera: Camera, geometry: BufferGeometry, material: Material, group: Group): void {
        this.updateWorldMatrix(true, false);
        GaussianSplattingMaterial.updateUniforms(renderer, camera, this);
        super.onBeforeRender(renderer, scene, camera, geometry, material, group);
    }
}
