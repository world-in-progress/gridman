import { Object3D, Group, Camera, WebGLRenderer, Box3, Matrix4, Sphere, Vector2 } from 'three';
import { Tile, TilesRenderer } from '3d-tiles-renderer';
import { GaussianSplattingScene } from './GaussianSplattingScene';
import { GaussianSplattingMesh } from './GaussianSplattingMesh';
import { GaussianSplattingBufferWorker } from './GaussianSplattingBufferWorker';

export class GaussianSplattingTilesetPlugin {
    tiles;
    renderer: WebGLRenderer;
    camera: Camera;
    textureSize: Vector2;

    maxGaussianSplatingCount: number;

    splatMesh: GaussianSplattingMesh;
    bufferWorker: GaussianSplattingBufferWorker;

    private _onUpdateBefore: () => void;
    private _onUpdateAfter: () => void;
    private _onLoadTileSet: (tileSet: object, url: string) => void;
    private _onLoadModel: ({ tile, scene }: { tile: Tile; scene: Group }) => void;
    private _onDisposeModel: ({ tile, scene }: { tile: Tile; scene: Group }) => void;
    private _onTileVisibilityChange: ({ scene, tile, visible }: { scene: Object3D; tile: Tile; visible: boolean }) => void;

    constructor(renderer: WebGLRenderer, camera: Camera, maxGaussianSplatingCount?: number) {
        this.tiles = null;
        this.renderer = renderer;
        this.camera = camera;

        this.textureSize = new Vector2(8196, 4096);
        if (maxGaussianSplatingCount) this.textureSize.y = Math.ceil(maxGaussianSplatingCount / 8196);
        this.maxGaussianSplatingCount = this.textureSize.x * this.textureSize.y;

        // event callback initialization
        this._onLoadModel = ({ tile, scene }) => {
            this.onLoadModel(tile, scene);
        };
        this._onDisposeModel = ({ tile, scene }) => {
            this.onDisposeModel(tile, scene);
        };
        this._onUpdateBefore = () => {
            this.onUpdateBefore();
        };
        this._onUpdateAfter = () => {
            this.onUpdateAfter();
        };
        this._onLoadTileSet = (tileSet: object, url: string) => {
            this.onLoadTileSet(tileSet, url);
        };
        this._onTileVisibilityChange = ({ scene, tile, visible }) => {
            this.onTileVisibilityChange(scene, tile, visible);
        };
    }

    init(tiles) {
        this.tiles = tiles;
        tiles.addEventListener('load-tile-set', this._onLoadTileSet);
        tiles.addEventListener('tile-visibility-change', this._onTileVisibilityChange);
        tiles.addEventListener('load-model', this._onLoadModel);
        tiles.addEventListener('dispose-model', this._onDisposeModel);
        tiles.addEventListener('update-before', this._onUpdateBefore);
        tiles.addEventListener('update-after', this._onUpdateAfter);

        this.bufferWorker = new GaussianSplattingBufferWorker();
        this.bufferWorker.initialize(tiles.parseQueue.maxJobs);
    }

    dispose() {
        const tiles = this.tiles;
        tiles.removeEventListener('load-model', this._onLoadModel);
        tiles.removeEventListener('dispose-model', this._onDisposeModel);
        tiles.removeEventListener('update-before', this._onUpdateBefore);
        tiles.removeEventListener('update-after', this._onUpdateAfter);
        tiles.removeEventListener('load-tile-set', this._onLoadTileSet);
        tiles.removeEventListener('tile-visibility-change', this._onTileVisibilityChange);
    }

    onLoadTileSet(tileSet: object, url: string) {
        const tiles = this.tiles;

        const boundingBox = new Box3();
        const boundingSphere = new Sphere();

        if ('sphere' in tiles.root.boundingVolume) {
            const { x, y, z, radius } = tiles.root.boundingVolume.sphere;
            boundingSphere.center.set(x, y, z);
            boundingSphere.radius = radius;
            boundingSphere.getBoundingBox(boundingBox);
        } else if ('box' in tiles.root.boundingVolume) {
            const box = tiles.root.boundingVolume.box;
            boundingBox.min.set(box[0] - box[3], box[1] - box[7], box[2] - box[11]);
            boundingBox.max.set(box[0] + box[3], box[1] + box[7], box[2] + box[11]);
            boundingBox.getBoundingSphere(boundingSphere);
        } else {
            // if ( 'region' in tiles.root.boundingVolume )
            const rootTransform = tiles.root.cached.transform;
            const boundingVolume = tiles.root.cached.boundingVolume;
            const rootTransfromInverse = new Matrix4().copy(rootTransform).invert();
            boundingVolume.getAABB(boundingBox);
            boundingBox.applyMatrix4(rootTransfromInverse);
            boundingBox.getBoundingSphere(boundingSphere);
        }

        this.splatMesh = new GaussianSplattingMesh(this.renderer, this.camera, this.textureSize);
        this.splatMesh.frustumCulled = false;

        this.splatMesh.matrix = tiles.root.cached.transform;
        this.splatMesh.matrixAutoUpdate = false;
        tiles.group.add(this.splatMesh);
        this.splatMesh.matrixWorldAutoUpdate = true;
        this.splatMesh.boundingBox = boundingBox;
        this.splatMesh.boundingSphere = boundingSphere;
    }
    // async parseToMesh(buffer, tile, extension, uri, abortSignal) {
    //     if (abortSignal.aborted) {
    //         return null;
    //     }

    //     if (extension === 'spz') {
    //     }
    // }

    processTileModel(scene, tile) {
        const promises = [];

        scene.traverse((child) => {
            const splatScene = child as GaussianSplattingScene;
            if (splatScene && splatScene.isGaussianSplattingScene) {
                const pr = this.bufferWorker.updateDataFromGeometryAsync(splatScene).then(() => {
                    this.splatMesh?.updateSceneTexture(splatScene).catch((error) => {
                        throw new Error(`Failed to updateSceneTexture, try more maxGaussianSplatingCount: ${this.maxGaussianSplatingCount}`);
                    });
                });

                promises.push(pr);
            }
        });

        return Promise.all(promises);
    }

    onTileVisibilityChange(scene: Object3D, tile: Tile, visible: boolean) {
        scene.traverse((child) => {
            const splatScene = child as GaussianSplattingScene;
            if (splatScene && splatScene.isGaussianSplattingScene) {
                splatScene.visible = visible;
            }
        });
    }

    onDisposeModel(tile: object, scene: Group) {
        scene.traverse((child) => {
            const splatScene = child as GaussianSplattingScene;
            if (splatScene && splatScene.isGaussianSplattingScene) {
                splatScene.visible = false;
                this.splatMesh?.removeSplatScene(splatScene);
            }
        });
    }
    onLoadModel(tile: object, scene: Group) {
        scene.traverse((child) => {
            const splatScene = child as GaussianSplattingScene;
            if (splatScene && splatScene.isGaussianSplattingScene) {
                splatScene.visible = false;
                this.splatMesh?.addSplatScene(splatScene);
            }
        });
    }

    onUpdateBefore() {}

    onUpdateAfter() {
        const tiles = this.tiles;
        const camera = this.camera;

        if (!tiles || !camera) {
            return;
        }

        let visibleScenes = [];

        tiles.forEachLoadedModel((scene: Object3D, tile) => {
            if (scene) {
                scene.traverse((child) => {
                    const splatScene = child as GaussianSplattingScene;
                    if (splatScene && splatScene.isGaussianSplattingScene && splatScene.visible) {
                        if (!splatScene.readyToRender) console.log('splatScene not ready to render');
                        visibleScenes.push(splatScene);
                    }
                });
            }
        });

        this.splatMesh?.runSplatSort(visibleScenes);
    }
}
