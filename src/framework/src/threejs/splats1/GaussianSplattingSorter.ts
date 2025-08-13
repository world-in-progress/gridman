import { Box3, Camera, Matrix4, Vector3 } from 'three';
import { GaussianSplattingScene } from './GaussianSplattingScene';
import { GaussianSplattingMesh } from './GaussianSplattingMesh';

export type GaussianSplattingSceneType = {
    splatPositions: Float32Array;
    vertexCount: number;
    lineStart: number;
    lineWidth: number;
    lineCount: number;
};

export type SortWorkerInput = {
    visibleScenes: GaussianSplattingSceneType[];
    cameraPosition: { x: number; y: number; z: number };
    cameraDirection: { x: number; y: number; z: number };
    boundMin: { x: number; y: number; z: number };
    boundMax: { x: number; y: number; z: number };
};

export type SortWorkerOutput = {
    splatIndex: Float32Array;
    updateStart: number;
    updateCount: number;
    vertexCount: number;
    visibleScenes: GaussianSplattingSceneType[];
};

export class GaussianSplattingSorter {
    splatMesh: GaussianSplattingMesh;
    worker: Worker;

    private static _CreateWorker = function (self: Worker) {
        self.onmessage = (event: any) => {
            const {
                visibleScenes,
                cameraPosition,
                cameraDirection,
                boundMin,
                boundMax,
            } = event.data;

            const transferables = [];
            visibleScenes.forEach(scene => {
                transferables.push(scene.splatPositions.buffer);
            });

            if (visibleScenes.length === 0) {
                self.postMessage({
                    visibleScenes,
                    splatIndex: null,
                    updateStart: 0,
                    updateCount: 0,
                    vertexCount: 0,
                }, transferables);
                return;
            }

            const dx = cameraDirection.x;
            const dy = cameraDirection.y;
            const dz = cameraDirection.z;

            let vertexCountSum = 0;
            for (let s = 0; s < visibleScenes.length; s++) {
                const scene = visibleScenes[s];
                const numVertices = scene.vertexCount;
                vertexCountSum += numVertices;
            }

            
            let minDist;
            let maxDist;
            for (let i = 0; i < 8; ++i) {
                const x = i & 1 ? boundMin.x : boundMax.x;
                const y = i & 2 ? boundMin.y : boundMax.y;
                const z = i & 4 ? boundMin.z : boundMax.z;
                const d = x * dx + y * dy + z * dz;
                if (i === 0) {
                    minDist = maxDist = d;
                } else {
                    minDist = Math.min(minDist, d);
                    maxDist = Math.max(maxDist, d);
                }
            }

            const range = maxDist - minDist;
            if (range < 1e-6) {
                self.postMessage({
                    visibleScenes,
                    splatIndex: null,
                    updateStart: 0,
                    updateCount: 0,
                    vertexCount: 0,
                }, transferables);
                return;
            }

            const depthValues = new Int32Array(vertexCountSum);
            const indices = new Uint32Array(vertexCountSum);
            const tempDepths = new Int32Array(vertexCountSum);
            const tempIndices = new Uint32Array(vertexCountSum);

            // 计算每个顶点的距离和索引
            let count = 0;
            for (let s = 0; s < visibleScenes.length; s++) {
                const scene = visibleScenes[s];
                const numVertices = scene.vertexCount;
                const offset = scene.lineStart * scene.lineWidth;
                for (let i = 0; i < numVertices; ++i) {
                    const x = scene.splatPositions[i * 4 + 0];
                    const y = scene.splatPositions[i * 4 + 1];
                    const z = scene.splatPositions[i * 4 + 2];
                    const d = x * dx + y * dy + z * dz - minDist;
                    depthValues[count] = Math.floor(d * 4096);
                    indices[count] = offset + i;
                    count++;
                }
            }

            // 排序算法
            count = vertexCountSum;
            const counts = new Uint32Array(256);
            for (let shift = 0; shift < 32; shift += 8) {
                counts.fill(0);

                for (let i = 0; i < count; i++) {
                    const byte = (depthValues[i] >> shift) & 0xff;
                    counts[byte] += 1;
                }

                let total = 0;
                for (let i = 0; i < counts.length; i++) {
                    const current = counts[i];
                    counts[i] = total;
                    total += current;
                }

                for (let i = 0; i < count; i++) {
                    const byte = (depthValues[i] >> shift) & 0xff;
                    const pos = counts[byte];
                    counts[byte] += 1;

                    tempDepths[pos] = depthValues[i];
                    tempIndices[pos] = indices[i];
                }

                depthValues.set(tempDepths);
                indices.set(tempIndices);
            }

            // 输出数据
            const splatIndex = new Float32Array(vertexCountSum);
            for(let i = 0; i < vertexCountSum; i++){
                splatIndex[i] = indices[i];
            }
            transferables.push(splatIndex.buffer);

            self.postMessage({
                visibleScenes,
                splatIndex,
                updateStart: 0,
                updateCount: vertexCountSum,
                vertexCount: vertexCountSum,
                //@ts-ignore
            }, transferables);
        };
    }

    constructor(splatMesh: GaussianSplattingMesh) {
        this.splatMesh = splatMesh;

        const workerContent = `(${GaussianSplattingSorter._CreateWorker.toString()})(self)`;
        const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: 'application/javascript' }));
        this.worker = new Worker(new URL(workerBlobUrl));
        this.worker.onmessage = (event: MessageEvent<SortWorkerOutput>) => {
            const result = event.data;
        };
    }

    private _cameraPositionLast = new Vector3();
    private _cameraDirectionLast = new Vector3();

    async sortSplatMesh(visibleScenes: GaussianSplattingScene[], camera: Camera, forceUpdate = false): Promise<SortWorkerOutput> {
        if (visibleScenes.length === 0) {
            return new Promise<SortWorkerOutput>((resolve) => {
                resolve({
                    visibleScenes:[],
                    splatIndex: null,
                    updateStart: 0,
                    updateCount: 0,
                    vertexCount: 0,
                });
            });
        }

        const cameraPosition = new Vector3();
        const cameraDirection = new Vector3();

        camera.getWorldPosition(cameraPosition);
        const modelViewMatrix = new Matrix4();
        modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, this.splatMesh.matrixWorld);
        cameraDirection.set(modelViewMatrix.elements[2], modelViewMatrix.elements[6], modelViewMatrix.elements[10]).normalize();

        // 初始化信息
        let needSort = false;
        let vertexCountSum = 0;
        const boundingBox = new Box3();
        for (let i = 0; i < visibleScenes.length; i++) {
            const scene = visibleScenes[i];
            vertexCountSum += scene.vertexCount;
            if (i === 0) boundingBox.copy(scene.boundingBox);
            else boundingBox.union(scene.boundingBox);
            if (scene.needSort) needSort = true;
        }

        const epsilon = 0.001;
        if (!needSort && !forceUpdate && this._cameraPositionLast.distanceTo(cameraPosition) < epsilon && this._cameraDirectionLast.distanceTo(cameraDirection) < epsilon) {
            return new Promise<SortWorkerOutput>((resolve) => {
                resolve({
                    visibleScenes:[],
                    splatIndex: null,
                    updateStart: 0,
                    updateCount: 0,
                    vertexCount: vertexCountSum,
                });
            });
        }

        this._cameraPositionLast.copy(cameraPosition);
        this._cameraDirectionLast.copy(cameraDirection);

        // 准备传递给 Worker 的数据
        const workerInput: SortWorkerInput = {
            visibleScenes: visibleScenes.map((scene) => {
                return {
                    lineStart: scene.lineStart,
                    lineCount: scene.lineCount,
                    lineWidth: scene.lineWidth,
                    splatPositions: scene.splatPositions,
                    vertexCount: scene.vertexCount,
                };
            }),
            cameraPosition: { x: cameraPosition.x, y: cameraPosition.y, z: cameraPosition.z },
            cameraDirection: { x: cameraDirection.x, y: cameraDirection.y, z: cameraDirection.z },
            boundMin: { x: boundingBox.min.x, y: boundingBox.min.y, z: boundingBox.min.z },
            boundMax: { x: boundingBox.max.x, y: boundingBox.max.y, z: boundingBox.max.z },
        };

        // 使用 Transferable 对象传递数据
        const transferables: Transferable[] = [];
        visibleScenes.forEach(scene => {
            transferables.push(scene.splatPositions.buffer);
        });


        return new Promise<SortWorkerOutput>((resolve, reject) => {
            
            const worker = this.worker;

            const onError = (error: ErrorEvent) => {
                worker.removeEventListener('error', onError);
                worker.removeEventListener('message', onMessage);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(error);
            };

            const onMessage = (event: MessageEvent<SortWorkerOutput>) => {
                worker.removeEventListener('error', onError);
                worker.removeEventListener('message', onMessage);

                event.data.visibleScenes.forEach((scene, index) => {
                    visibleScenes[index].splatPositions = scene.splatPositions;
                    visibleScenes[index].needSort = false;
                });
                resolve(event.data);

            };
            worker.addEventListener('error', onError);
            worker.addEventListener('message', onMessage);
            
            worker.postMessage(workerInput, transferables);
        });
    }
}
