import { FileLoader, LoaderUtils, Loader, LoadingManager } from 'three';
import { GaussianSplattingMesh } from '../GaussianSplattingMesh';

class SplatLoader extends Loader {
    constructor(manager?: LoadingManager) {
        super(manager);
    }

    override load(url: string, onLoad: (data: any) => void, onProgress?: (event: ProgressEvent) => void, onError?: (event: ErrorEvent) => void): void {
        const loader = new FileLoader(this.manager);

        loader.setPath(this.path);
        loader.setResponseType('arraybuffer');
        loader.setRequestHeader(this.requestHeader);
        loader.setWithCredentials(this.withCredentials);

        loader.load(
            url,
            (buffer) => {
                this.parse(buffer, onLoad, onError);
            },
            onProgress,
            onError,
        );
    }

    parse(buffer, onLoad, onError) {
        const gaussianSplattingMesh = new GaussianSplattingMesh();
        gaussianSplattingMesh
            .loadDataAsync(buffer)
            .then(() => {
                onLoad(gaussianSplattingMesh);
            })
            .catch((error) => {
                if (onError) {
                    onError(error);
                } else {
                    console.error(error);
                }
            });
    }
}

export { SplatLoader };
