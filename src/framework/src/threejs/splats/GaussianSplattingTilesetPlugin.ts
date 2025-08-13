import { Object3D, Vector3, Camera, WebGLRenderer, Vector2 } from 'three';

export class GaussianSplattingTilesetPlugin {
    tiles;
    camera: Camera;
    _onUpdateBefore: () => void;
    _onUpdateAfter: () => void;
    constructor(renderer: WebGLRenderer, camera: Camera, maxGaussianSplatingCount?: number) {
        this.tiles = null;
        this.camera = camera;

        this._onUpdateBefore = () => {
            this.onUpdateBefore();
        };
        this._onUpdateAfter = () => {
            this.onUpdateAfter();
        };
    }

    init(tiles) {
        this.tiles = tiles;
        tiles.addEventListener('update-before', this._onUpdateBefore);
        tiles.addEventListener('update-after', this._onUpdateAfter);
    }

    dispose() {
        const tiles = this.tiles;
        tiles.removeEventListener('update-before', this._onUpdateBefore);
        tiles.removeEventListener('update-after', this._onUpdateAfter);
    }

    onUpdateBefore() {}

    onUpdateAfter() {
        const tiles = this.tiles;
        const camera = this.camera;

        if (!tiles || !camera) {
            return;
        }

        tiles.forEachLoadedModel((scene: Object3D, tile) => {
            if (scene) {
                scene.traverse((child) => {
                    // @ts-ignore
                    if (child.isGaussianSplattingMesh) {
                        const center = new Vector3();
                        // @ts-ignore
                        child.boundingBox.getCenter(center);
                        center.z = 0;
                        const cameraMatrix = camera.matrixWorldInverse;
                        center.applyMatrix4(child.matrixWorld);
                        center.applyMatrix4(cameraMatrix);
                        child.renderOrder = -center.length();
                    }
                });
            }
        });
    }
}
