import { TypedArray, Vector3, BufferGeometry, BufferAttribute, InterleavedBufferAttribute, Box3, Sphere } from 'three';

import { AutoReleaseWorkerPool } from '../utils/workerPool';
import { GaussianSplattingScene } from './GaussianSplattingScene';

type BufferAttributeInfo = {
    count: number;
    array: TypedArray;
    itemSize: number;
    normalized: boolean;
};

type UpdateWorkerInput = {
    positionBuffer: BufferAttributeInfo;
    scaleBuffer: BufferAttributeInfo;
    rotationBuffer: BufferAttributeInfo;
    colorBuffer: BufferAttributeInfo;
    opacityBuffer: BufferAttributeInfo;
    vertexCount: number;
    useRGBACovariants: boolean;
    covBSItemSize: number;
    SplatBatchSize: number;
};

type UpdateWorkerOutput = {
    vertexCount: number;
    splatPositions: Float32Array;
    splatCovA: Uint16Array;
    splatCovB: Uint16Array;
    splatColors: Uint8Array;
    boundingBox: {
        min: [number, number, number];
        max: [number, number, number];
    };
    boundingSphere: {
        center: [number, number, number];
        radius: number;
    };
};

function getBufferAttributeInfo(attribute: BufferAttribute | InterleavedBufferAttribute): BufferAttributeInfo {
    const array = attribute.array;
    const itemSize = attribute.itemSize;
    const count = attribute.count;
    const normalized = attribute.normalized;
    return { array, itemSize, count, normalized };
}

export class GaussianSplattingBufferWorker {
    private static _CreateWorker = function (self: Worker) {
        const _tables = /*@__PURE__*/ _generateTables();

        function clamp(value, min, max) {
            return Math.max(min, Math.min(max, value));
        }

        function _generateTables() {
            // float32 to float16 helpers

            const buffer = new ArrayBuffer(4);
            const floatView = new Float32Array(buffer);
            const uint32View = new Uint32Array(buffer);

            const baseTable = new Uint32Array(512);
            const shiftTable = new Uint32Array(512);

            for (let i = 0; i < 256; ++i) {
                const e = i - 127;

                // very small number (0, -0)

                if (e < -27) {
                    baseTable[i] = 0x0000;
                    baseTable[i | 0x100] = 0x8000;
                    shiftTable[i] = 24;
                    shiftTable[i | 0x100] = 24;

                    // small number (denorm)
                } else if (e < -14) {
                    baseTable[i] = 0x0400 >> (-e - 14);
                    baseTable[i | 0x100] = (0x0400 >> (-e - 14)) | 0x8000;
                    shiftTable[i] = -e - 1;
                    shiftTable[i | 0x100] = -e - 1;

                    // normal number
                } else if (e <= 15) {
                    baseTable[i] = (e + 15) << 10;
                    baseTable[i | 0x100] = ((e + 15) << 10) | 0x8000;
                    shiftTable[i] = 13;
                    shiftTable[i | 0x100] = 13;

                    // large number (Infinity, -Infinity)
                } else if (e < 128) {
                    baseTable[i] = 0x7c00;
                    baseTable[i | 0x100] = 0xfc00;
                    shiftTable[i] = 24;
                    shiftTable[i | 0x100] = 24;

                    // stay (NaN, Infinity, -Infinity)
                } else {
                    baseTable[i] = 0x7c00;
                    baseTable[i | 0x100] = 0xfc00;
                    shiftTable[i] = 13;
                    shiftTable[i | 0x100] = 13;
                }
            }

            // float16 to float32 helpers

            const mantissaTable = new Uint32Array(2048);
            const exponentTable = new Uint32Array(64);
            const offsetTable = new Uint32Array(64);

            for (let i = 1; i < 1024; ++i) {
                let m = i << 13; // zero pad mantissa bits
                let e = 0; // zero exponent

                // normalized
                while ((m & 0x00800000) === 0) {
                    m <<= 1;
                    e -= 0x00800000; // decrement exponent
                }

                m &= ~0x00800000; // clear leading 1 bit
                e += 0x38800000; // adjust bias

                mantissaTable[i] = m | e;
            }

            for (let i = 1024; i < 2048; ++i) {
                mantissaTable[i] = 0x38000000 + ((i - 1024) << 13);
            }

            for (let i = 1; i < 31; ++i) {
                exponentTable[i] = i << 23;
            }

            exponentTable[31] = 0x47800000;
            exponentTable[32] = 0x80000000;

            for (let i = 33; i < 63; ++i) {
                exponentTable[i] = 0x80000000 + ((i - 32) << 23);
            }

            exponentTable[63] = 0xc7800000;

            for (let i = 1; i < 64; ++i) {
                if (i !== 32) {
                    offsetTable[i] = 1024;
                }
            }

            return {
                floatView: floatView,
                uint32View: uint32View,
                baseTable: baseTable,
                shiftTable: shiftTable,
                mantissaTable: mantissaTable,
                exponentTable: exponentTable,
                offsetTable: offsetTable,
            };
        }

        // float32 to float16
        function toHalfFloat(val) {
            if (Math.abs(val) > 65504) console.warn('THREE.DataUtils.toHalfFloat(): Value out of range.');

            val = clamp(val, -65504, 65504);

            _tables.floatView[0] = val;
            const f = _tables.uint32View[0];
            const e = (f >> 23) & 0x1ff;
            return _tables.baseTable[e] + ((f & 0x007fffff) >> _tables.shiftTable[e]);
        }

        function denormalize(value, array) {
            switch (array.constructor) {
                case Float32Array:
                    return value;

                case Uint32Array:
                    return value / 4294967295.0;

                case Uint16Array:
                    return value / 65535.0;

                case Uint8Array:
                    return value / 255.0;

                case Int32Array:
                    return Math.max(value / 2147483647.0, -1.0);

                case Int16Array:
                    return Math.max(value / 32767.0, -1.0);

                case Int8Array:
                    return Math.max(value / 127.0, -1.0);

                default:
                    throw new Error('Invalid component type.');
            }
        }

        function getComponent(buffer, index, component) {
            let value = buffer.array[index * buffer.itemSize + component];

            if (buffer.normalized) value = denormalize(value, buffer.array);

            return value;
        }

        function getComponents(buffer, index, count) {
            const components = [count];
            for (let i = 0; i < count; i++) {
                components[i] = getComponent(buffer, index, i);
            }
            return components;
        }

        function normalizeQuaternion(quat) {
            let lengthSq = quat[0] * quat[0] + quat[1] * quat[1] + quat[2] * quat[2] + quat[3] * quat[3];
            if (lengthSq === 0) {
                quat[0] = 0;
                quat[1] = 0;
                quat[2] = 0;
                quat[3] = 1;
                return;
            }
            let invLength = 1.0 / Math.sqrt(lengthSq);
            quat[0] *= invLength;
            quat[1] *= invLength;
            quat[2] *= invLength;
            quat[3] *= invLength;
        }

        self.onmessage = async (event) => {
            const { positionBuffer, scaleBuffer, rotationBuffer, colorBuffer, opacityBuffer, vertexCount, useRGBACovariants, covBSItemSize } = event.data;

            const colorScale = 255;

            const splatPositions = new Float32Array(4 * vertexCount);
            const splatCovA = new Uint16Array(vertexCount * 4);
            const splatCovB = new Uint16Array(vertexCount * covBSItemSize);
            const splatColors = new Uint8Array(vertexCount * 4);

            let min = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
            let max = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];

            for (let i = 0; i < vertexCount; i++) {
                const position = getComponents(positionBuffer, i, 3);

                const scale = getComponents(scaleBuffer, i, 3);

                const rotation = getComponents(rotationBuffer, i, 4);

                const color = opacityBuffer ? [...getComponents(colorBuffer, i, 3), ...getComponents(opacityBuffer, i, 1)] : getComponents(colorBuffer, i, 4);

                // Normalize quaternion
                normalizeQuaternion(rotation);

                // Update bounding box
                for (let j = 0; j < 3; j++) {
                    if (position[j] < min[j]) min[j] = position[j];
                    if (position[j] > max[j]) max[j] = position[j];
                }

                // Calculate matrix and covariances
                const x = rotation[0],
                    y = rotation[1],
                    z = rotation[2],
                    w = -rotation[3]; // flip the quaternion to match the right handed system
                const x2 = x + x,
                    y2 = y + y,
                    z2 = z + z;
                const xx = x * x2,
                    xy = x * y2,
                    xz = x * z2;
                const yy = y * y2,
                    yz = y * z2,
                    zz = z * z2;
                const wx = w * x2,
                    wy = w * y2,
                    wz = w * z2;
                const sx = scale[0] * 2, // we need to convert it to the geometry space (-2, 2)
                    sy = scale[1] * 2,
                    sz = scale[2] * 2;

                const te = Array(12);
                te[0] = (1 - (yy + zz)) * sx;
                te[1] = (xy + wz) * sy;
                te[2] = (xz - wy) * sz;
                te[4] = (xy - wz) * sx;
                te[5] = (1 - (xx + zz)) * sy;
                te[6] = (yz + wx) * sz;
                te[8] = (xz + wy) * sx;
                te[9] = (yz - wx) * sy;
                te[10] = (1 - (xx + yy)) * sz;
                const M = te;

                const covariances = Array(6);

                covariances[0] = M[0] * M[0] + M[1] * M[1] + M[2] * M[2];
                covariances[1] = M[0] * M[4] + M[1] * M[5] + M[2] * M[6];
                covariances[2] = M[0] * M[8] + M[1] * M[9] + M[2] * M[10];
                covariances[3] = M[4] * M[4] + M[5] * M[5] + M[6] * M[6];
                covariances[4] = M[4] * M[8] + M[5] * M[9] + M[6] * M[10];
                covariances[5] = M[8] * M[8] + M[9] * M[9] + M[10] * M[10];

                // Find factor for normalization
                let factor = -10000;
                for (let j = 0; j < 6; j++) {
                    factor = Math.max(factor, Math.abs(covariances[j]));
                }

                const destinationIndex = i;
                const covAIndex = destinationIndex * 4;
                const covBIndex = destinationIndex * covBSItemSize;

                splatPositions[4 * i + 0] = position[0];
                splatPositions[4 * i + 1] = position[1];
                splatPositions[4 * i + 2] = position[2];
                splatPositions[4 * i + 3] = factor;

                splatCovA[covAIndex + 0] = toHalfFloat(covariances[0] / factor);
                splatCovA[covAIndex + 1] = toHalfFloat(covariances[1] / factor);
                splatCovA[covAIndex + 2] = toHalfFloat(covariances[2] / factor);
                splatCovA[covAIndex + 3] = toHalfFloat(covariances[3] / factor);

                splatCovB[covBIndex + 0] = toHalfFloat(covariances[4] / factor);
                splatCovB[covBIndex + 1] = toHalfFloat(covariances[5] / factor);

                splatColors[4 * i + 0] = color[0] * colorScale;
                splatColors[4 * i + 1] = color[1] * colorScale;
                splatColors[4 * i + 2] = color[2] * colorScale;
                splatColors[4 * i + 3] = color[3] * colorScale;
            }

            const center = [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2];
            const radius = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) / 2;

            self.postMessage(
                {
                    vertexCount,
                    splatPositions,
                    splatCovA,
                    splatCovB,
                    splatColors,
                    boundingBox: { min, max },
                    boundingSphere: { center, radius },
                },
                [splatPositions.buffer, splatCovA.buffer, splatCovB.buffer, splatColors.buffer],
            );
        };
    };

    _WorkerPool?: AutoReleaseWorkerPool;

    initialize(numberOfWorkers: number = 1) {
        const workerContent = `(${GaussianSplattingBufferWorker._CreateWorker.toString()})(self)`;
        const workerBlobUrl = URL.createObjectURL(new Blob([workerContent], { type: 'application/javascript' }));

        this._WorkerPool = new AutoReleaseWorkerPool(numberOfWorkers, (): Promise<Worker> => {
            const worker = new Worker(workerBlobUrl);
            return Promise.resolve(worker);
        });
    }


    updateDataFromGeometryAsync(scene: GaussianSplattingScene): Promise<void> {
        const geometry = scene.geometry;
        if (!geometry) {
            return Promise.reject('No geometry found.');
        }

        return new Promise<void>((resolve, reject) => {
            // 提取 geometry 的相关数据为基本数组结构
            const positionBuffer = getBufferAttributeInfo(geometry.attributes.position);
            const scaleBuffer = getBufferAttributeInfo(geometry.attributes.scale);
            const rotationBuffer = getBufferAttributeInfo(geometry.attributes.rotation);
            const colorBuffer = getBufferAttributeInfo(geometry.attributes.color);
            const opacityBuffer = geometry.attributes.opacity ? getBufferAttributeInfo(geometry.attributes.opacity) : null;

            const vertexCount = geometry.attributes.position.count;

            this._WorkerPool.push((worker, onComplete) => {
                const onError = (error: ErrorEvent) => {
                    worker.removeEventListener('error', onError);
                    worker.removeEventListener('message', onMessage);
                    // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                    reject(error);
                    onComplete();
                };

                const onMessage = (event: MessageEvent<UpdateWorkerOutput>) => {
                    worker.removeEventListener('error', onError);
                    worker.removeEventListener('message', onMessage);

                    try {
                        const { vertexCount, splatPositions, splatCovA, splatCovB, splatColors, boundingBox, boundingSphere } = event.data;
                        scene.vertexCount = vertexCount;
                        scene.splatPositions = splatPositions;
                        scene.splatCovA = splatCovA;
                        scene.splatCovB = splatCovB;
                        scene.splatColors = splatColors;
                        scene.boundingBox = new Box3(new Vector3(boundingBox.min[0], boundingBox.min[1], boundingBox.min[2]), new Vector3(boundingBox.max[0], boundingBox.max[1], boundingBox.max[2]));
                        scene.boundingSphere = new Sphere(new Vector3(boundingSphere.center[0], boundingSphere.center[1], boundingSphere.center[2]), boundingSphere.radius);
                        scene.needSort = true;

                        scene.geometry.dispose(); // Dispose the geometry after use to free memory
                        scene.geometry = null;
                        
                        resolve();
                    } catch (err) {
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject({ message: err });
                    }

                    onComplete();
                };
                worker.addEventListener('error', onError);
                worker.addEventListener('message', onMessage);
                worker.postMessage(
                    {
                        positionBuffer,
                        scaleBuffer,
                        rotationBuffer,
                        colorBuffer,
                        opacityBuffer,
                        vertexCount,
                        useRGBACovariants: GaussianSplattingScene.useRGBACovariants,
                        covBSItemSize: GaussianSplattingScene.covBSItemSize,
                    },
                    [positionBuffer.array.buffer, scaleBuffer.array.buffer, rotationBuffer.array.buffer, colorBuffer.array.buffer, ...(opacityBuffer ? [opacityBuffer.array.buffer] : [])],
                );
            });
        });
    }
}
