import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

export class LoaderUtils {
    static _dracoLoader: DRACOLoader | null = null;
    static _ktx2Loader: KTX2Loader | null = null;

    static getDracoLoader(dracoLoaderPath?: string): DRACOLoader {
        if (!this._dracoLoader) {
            // Note the DRACO compression files need to be supplied via an explicit source.
            // We use unpkg here but in practice should be provided by the application.
            dracoLoaderPath = dracoLoaderPath || 'https://unpkg.com/three@0.173.0/examples/jsm/libs/draco/gltf/';
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath(dracoLoaderPath);

            this._dracoLoader = dracoLoader;
        }

        return this._dracoLoader;
    }
    static getKtxLoader(ktx2LoaderPath?: string): KTX2Loader {
        if (!this._ktx2Loader) {
            // Note the ktx2 compression files need to be supplied via an explicit source.
            // We use unpkg here but in practice should be provided by the application.
            ktx2LoaderPath = ktx2LoaderPath || 'https://unpkg.com/three@0.173.0/examples/jsm/libs/basis/';
            const ktxLoader = new KTX2Loader();
            ktxLoader.setTranscoderPath(ktx2LoaderPath);

            this._ktx2Loader = ktxLoader;
        }

        return this._ktx2Loader;
    }

    static getMeshoptDecoder(meshoptDecoder) {
        return meshoptDecoder || MeshoptDecoder;
    }
}
