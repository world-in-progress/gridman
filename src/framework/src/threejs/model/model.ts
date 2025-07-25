import { WebGLRenderer, Camera, Scene, Matrix4, Group } from 'three';

import ThreejsUtils from '../threejs-utils';

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// import { GLTFLoader } from "../tileset/plugins/gltf/GLTFLoader.js";

import { SceneObject } from '../object/scene-object';
import ThreejsSceneLayer from '../threejs-scene';
// import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
// import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

// import { IFCLoader } from '../loader/IFCLoader';
// import { IFCSPACE } from 'web-ifc';
// import { IFCModelUtiles } from "../loader/IFCModelUtiles";
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

import { LoaderUtils } from '../utils/LoaderUtils';
import { SplatLoader } from '../splats/loaders/SplatLoader';
import { PlySplatLoader } from '../splats/loaders/PlySplatLoader';
import { GLTFGaussianSplattingExtension } from '../splats/GLTFGaussianSplattingExtension';

export type ModelOptions = {
    id: string;
    rootUrl?: string;
    fileName?: string | null | undefined;
    fileNames?: string | readonly string[] | null | undefined;
    position: number[];
    offset?: number[];
    rotation?: number[];
    scale?: number;
    ifcWasmPath?: string;
    dracoLoaderPath?: string;
    ktx2LoaderPath?: string;
    callback?: (model: Group) => void;
};

export default class Model extends SceneObject {
    _options: ModelOptions;

    _animGroup: Group | undefined;

    constructor(options: ModelOptions) {
        super();

        this._options = options;
        this._animGroup = undefined;
    }

    override addToScene(scene: ThreejsSceneLayer): this {
        this._scene = scene;
        this.name = this._options.id + '-root';

        const animGroup = new Group();
        animGroup.name = this.id + '-anim';
        this.add(animGroup);
        this._animGroup = animGroup;

        const { rootUrl, fileName, fileNames, callback } = this._options;
        if (fileName) {
            this.loadAssetContainer(rootUrl, fileName, callback);
        } else if (Array.isArray(fileNames)) {
            fileNames.forEach((fileName) => {
                this.loadAssetContainer(rootUrl, fileName, callback);
            });
        } else if (typeof fileNames === 'string') {
            this.loadAssetContainer(rootUrl, fileNames, callback);
        } else if (fileNames === null || fileNames === undefined) {
            this.loadAssetContainer(rootUrl, '', callback);
        }

        return super.addToScene(scene);
    }

    override removeFromScene(): this {
        if (this._animGroup) {
            this._animGroup.clear();
            this.remove(this._animGroup);
            this._animGroup = undefined;
        }
        return super.removeFromScene();
    }

    private async onLoadModel(model: Group, callback?: (model: Group) => void) {
        // wait until the model can be added to the scene without blocking due to shader compilation
        await this._scene.compileAsync(model);
        this._animGroup.add(model);
        this.updateModelTransform(model);

        if (callback) {
            callback(this._animGroup);
        }
    }

    // 使用 SceneLoader.ImportMeshAsync 加载模型，支持 gltf、glb、 obj、splat 等格式
    private async loadAssetContainer(rootUrl: string, fileName: string | null | undefined, callback?: (model: Group) => void) {
        rootUrl = rootUrl || '';
        if (!fileName || fileName === '') {
            const index = rootUrl.lastIndexOf('/');
            fileName = rootUrl.substring(index + 1);
            rootUrl = rootUrl.substring(0, index + 1);
        }

        const fileType = (fileName || rootUrl).split('.').pop();

        const _this = this;
        switch (fileType) {
            case 'ifc':
                {
                    // const ifcLoader = new IFCLoader();
                    // const ifcWasmPath = this._options.ifcWasmPath || "https://cdn.jsdelivr.net/npm/web-ifc@0.0.68/";
                    // await ifcLoader.ifcManager.setWasmPath(ifcWasmPath, true);
                    // // await ifcLoader.ifcManager.setWasmPath( 'https://cdn.jsdelivr.net/npm/web-ifc@0.0.36/', true );
                    // await ifcLoader.ifcManager.parser.setupOptionalCategories( {
                    //   [ IFCSPACE ]: false,
                    // } );
                    // await ifcLoader.ifcManager.applyWebIfcConfig( {
                    //   USE_FAST_BOOLS: true
                    // } );
                    // ifcLoader.setPath(rootUrl);
                    // ifcLoader.load( fileName, function ( model ) {
                    //   _this.onLoadModel(model, callback);
                    // } );
                }
                break;
            case 'ply':
                {
                    const splatLoader = new PlySplatLoader();
                    splatLoader.setPath(rootUrl);
                    splatLoader.load(fileName, async (splatMesh) => {
                        _this.onLoadModel(splatMesh, callback);
                    });
                }

                break;
            case 'splat':
                {
                    const splatLoader = new SplatLoader();
                    splatLoader.setPath(rootUrl);
                    splatLoader.load(fileName, async (splatMesh) => {
                        _this.onLoadModel(splatMesh, callback);
                    });

                    // const splatMeshGroup = new SplatMeshGroup();
                    // splatMeshGroup.addSplatScene(rootUrl + fileName);
                    // _this.onLoadModel(splatMeshGroup, callback);
                }
                break;
            case 'gltf':
            case 'glb':
                {
                    const dracoLoader = LoaderUtils.getDracoLoader(this._options.dracoLoaderPath);
                    const ktxLoader = LoaderUtils.getKtxLoader(this._options.ktx2LoaderPath);

                    // @ts-expect-error
                    ktxLoader.detectSupport(this._scene.getWebGLRenderer());

                    const loader = new GLTFLoader();
                    loader.setDRACOLoader(dracoLoader);
                    loader.setKTX2Loader(ktxLoader);
                    loader.setMeshoptDecoder(MeshoptDecoder);

                    loader.register((parser) => new GLTFGaussianSplattingExtension(parser));

                    loader.setPath(rootUrl);
                    loader.load(fileName, async (gltf) => {
                        const model = gltf.scene;
                        _this.onLoadModel(model, callback);
                    });
                }
                break;
            case 'obj':
            // TODO: support obj
            case 'fbx':
            // TODO: support fbx
            default:
                {
                    if (fileType && fileType !== '') {
                        console.warn('Unsupported file type: ' + fileType);
                    }
                    const model = new Group();
                    _this.onLoadModel(model, callback);
                }
                return;
        }
    }

    override updateSceneTransform() {
        let position = this._options.position;
        if (!position || !this._scene) return;

        const meshToWorldOffsetInMeters = this._scene.toScenePosition(position);

        this.position.set(meshToWorldOffsetInMeters.x, meshToWorldOffsetInMeters.y, meshToWorldOffsetInMeters.z);
        this.updateMatrixWorld(true);
    }

    setPosition(position: number[]) {
        if (this._options.position[0] !== position[0] || this._options.position[1] !== position[1]) {
            this._options.position = position;
            this.updateSceneTransform();
        }
    }

    updateModelTransform(model: Group) {
        let offset = this._options.offset || [0, 0, 0];
        let rotation = this._options.rotation || [0, 0, 0];
        let scale = this._options.scale || 1;

        model.position.set(offset[0], offset[1], offset[2]);
        model.rotation.set(ThreejsUtils.degToRad(rotation[0]), ThreejsUtils.degToRad(rotation[1]), ThreejsUtils.degToRad(rotation[2]));
        model.scale.set(scale, scale, scale);
        model.updateMatrixWorld(true);
    }
}
