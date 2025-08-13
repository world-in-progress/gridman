// 为了解决 gltf 加载ktx2压缩格式图片时，无法正常加载的 bug
//
// 问题说明：
// 当 gltf 中有 ktx2 格式的图片，但是没有添加 KHR_texture_basisu 的 extension 时，
// 使用 ktx2Loader 加载 texture，否则使用 TextureLoader
// https://github.com/mrdoob/three.js/issues/28258
// 官方对此 issues 的建议是使用 gltf-transform 修改数据
// 但由于用户的数据可能已经是有问题的数据无法修改时，则通过修改 loader 加载的方式来解决
//
// 解决方案：
// 1. 修改 'three/examples/jsm/loaders/GLTFLoader.js' 的 GLTFParser 类的构造函数
// 2. 仅修改以上几行代码，但是需要将整个 GLTFLoader.js 及相关引用的文件全部拷贝过来
// 3. 需要 "3d-tiles-renderer/plugins" 中的 GLTFExtensionsPlugin 替换成本文件中的 GLTFExtensionsPlugin
// 4. 然后在使用时，将 GLTFLoader 实例化时传入 ktx2Loader 实例，即可正常加载 ktx2 格式的图片

// import {GLTFExtensionsPlugin} from "3d-tiles-renderer/plugins";
// export {GLTFExtensionsPlugin};

// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFLoader } from './gltf/GLTFLoader.js';

import { GLTFStructuralMetadataExtension } from './gltf/GLTFStructuralMetadataExtension.js';
import { GLTFMeshFeaturesExtension } from './gltf/GLTFMeshFeaturesExtension.js';
import { GLTFCesiumRTCExtension } from './gltf/GLTFCesiumRTCExtension.js';

export class GLTFExtensionsPlugin {
    constructor(options) {
        options = {
            metadata: true,
            rtc: true,

            plugins: [],

            dracoLoader: null,
            ktxLoader: null,
            meshoptDecoder: null,
            autoDispose: true,
            ...options,
        };

        this.tiles = null;

        this.metadata = options.metadata;
        this.rtc = options.rtc;
        this.plugins = options.plugins;

        this.autoDispose = options.autoDispose;
        this.dracoLoader = options.dracoLoader;
        this.ktxLoader = options.ktxLoader;
        this.meshoptDecoder = options.meshoptDecoder;
        this._gltfRegex = /\.(gltf|glb)$/g;
        this._dracoRegex = /\.drc$/g;
        this._loader = null;
    }

    init(tiles) {
        const loader = new GLTFLoader(tiles.manager);
        if (this.dracoLoader) {
            loader.setDRACOLoader(this.dracoLoader);
            tiles.manager.addHandler(this._dracoRegex, this.dracoLoader);
        }

        if (this.ktxLoader) {
            loader.setKTX2Loader(this.ktxLoader);
        }

        if (this.meshoptDecoder) {
            loader.setMeshoptDecoder(this.meshoptDecoder);
        }

        if (this.rtc) {
            loader.register(() => new GLTFCesiumRTCExtension());
        }

        if (this.metadata) {
            loader.register(() => new GLTFStructuralMetadataExtension());
            loader.register(() => new GLTFMeshFeaturesExtension());
        }

        this.plugins.forEach((plugin) => loader.register(plugin));

        tiles.manager.addHandler(this._gltfRegex, loader);
        this.tiles = tiles;
        this._loader = loader;
    }

    dispose() {
        this.tiles.manager.removeHandler(this._gltfRegex);
        this.tiles.manager.removeHandler(this._dracoRegex);
        if (this.autoDispose) {
            this.ktxLoader.dispose();
            this.dracoLoader.dispose();
        }
    }

    disposeTile(tile) {
        const cached = tile.cached;
        if (cached.scene) {
            const scene = cached.scene;
            scene.traverse((child) => {
                if (child.dispose) {
                    child.dispose();
                }
            });
        }
    }
}
