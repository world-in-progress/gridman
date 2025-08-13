import { Coroutine, createYieldingScheduler, runCoroutineAsync } from '../utils/coroutine';

export class GaussianSplattingSorter {
    vertexCount = 0;
    positions: Float32Array;

    hasInit: boolean = false;

    splatIndex: Uint32Array;
    depthValues: Int32Array;
    tempDepths: Int32Array;
    tempIndices: Uint32Array;
    
    abortController: AbortController | null = null;

    onmessage: ((this: GaussianSplattingSorter, ev) => any) | null = null;

    constructor() {}

    public terminate(): void {
        if(this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.vertexCount = 0;
        this.positions = null;
        this.splatIndex = null;
        this.onmessage = null;
    }

    private _initSortData() {
        if (this.hasInit) {
            return;
        }
        const count = this.vertexCount;
        if (count < 0) {
            return;
        }

        this.depthValues = new Int32Array(count);
        this.splatIndex = new Uint32Array(count);

        this.tempDepths = new Int32Array(count);
        this.tempIndices = new Uint32Array(count);
        this.hasInit = true;
    }

    private static _SplatBatchSize = 327680;
    private static _iWorkCount = 0;

    private *_sortData(viewProj, isAsync: boolean): Coroutine<void> {
        if (!this.hasInit) {
            this._initSortData();
        }

        const positions = this.positions;
        const count = this.vertexCount;
        const depthValues = this.depthValues;
        const indices = this.splatIndex;
        const tempDepths = this.tempDepths;
        const tempIndices = this.tempIndices;

        let maxDepth = -Infinity;
        let minDepth = Infinity;

        for (let i = 0; i < count; i++) {
            indices[i] = i;
            //const depth = positions[i * 3] * mv2 + positions[i * 3 + 1] * mv6 + positions[i * 3 + 2] * mv10;
            const depth = viewProj[2] * positions[4 * i] + viewProj[6] * positions[4 * i + 1] + viewProj[10] * positions[4 * i + 2];

            const depthInt = Math.floor(depth * 4096);
            depthValues[i] = depthInt;
            maxDepth = Math.max(maxDepth, depthInt);
            minDepth = Math.min(minDepth, depthInt);
        }

        if (isAsync) {
            GaussianSplattingSorter._iWorkCount += count;
            if (GaussianSplattingSorter._iWorkCount > GaussianSplattingSorter._SplatBatchSize) {
                GaussianSplattingSorter._iWorkCount = 0;
                yield;
            }
        }

        const depthOffset = -minDepth;
        for (let i = 0; i < count; i++) {
            depthValues[i] += depthOffset;
        }

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

            if (isAsync) {
                GaussianSplattingSorter._iWorkCount += count;
                if (GaussianSplattingSorter._iWorkCount > GaussianSplattingSorter._SplatBatchSize) {
                    GaussianSplattingSorter._iWorkCount = 0;
                    yield;
                }
            }
        }
    }

    public init(positions: Float32Array, vertexCount: number): void {
        this.positions = positions;
        this.vertexCount = vertexCount;
        this._initSortData();
    }

    public async sortDataAsync(viewProj): Promise<void> {
        this.abortController = new AbortController();
        const signal = this.abortController.signal;
        return runCoroutineAsync(this._sortData(viewProj, true), createYieldingScheduler(), signal).then(() => {
            if (this.onmessage) {
                this.onmessage(this.splatIndex);
            }
        }).catch((error) => {
            console.error(error);
        }).finally(() => {
            this.abortController = null;
        });
    }
}
