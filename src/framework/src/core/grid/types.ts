import BoundingBox2D from '../util/boundingBox2D';
import type { Converter } from 'proj4/dist/lib/core'
import { MercatorCoordinate } from '../math/mercatorCoordinate';

export const EDGE_CODE_INVALID = -1;
export const EDGE_CODE_NORTH = 0b00;
export const EDGE_CODE_WEST = 0b01;
export const EDGE_CODE_SOUTH = 0b10;
export const EDGE_CODE_EAST = 0b11;

export type EDGE_CODE =
    | typeof EDGE_CODE_NORTH
    | typeof EDGE_CODE_WEST
    | typeof EDGE_CODE_SOUTH
    | typeof EDGE_CODE_EAST;


export interface GridNodeParams {
    level?: number;
    globalId: number;
    parent?: GridNode;
    storageId: number;
    globalRange?: [number, number];
}

export interface MultiGridRenderInfo {
    levels: Uint8Array;
    globalIds: Uint32Array;
    deleted: Uint8Array;
    vertices: Float32Array;
    verticesLow: Float32Array;
}

export interface StructuredGridRenderVertices {
    tl: Float32Array;
    tr: Float32Array;
    bl: Float32Array;
    br: Float32Array;

    tlLow: Float32Array;
    trLow: Float32Array;
    blLow: Float32Array;
    brLow: Float32Array;
}

export type GridContext = {
    srcCS: string;
    targetCS: string;
    bBox: BoundingBox2D;
    rules: [number, number][];
}

export type MultiGridBaseInfo = {
    levels: Uint8Array;
    globalIds: Uint32Array;
    deleted?: Uint8Array;
}

export type GridSaveInfo = {
    success: boolean;
    message: string;
}

export type GridCheckingInfo = {
    storageId: number;
    level: number;
    globalId: number;
    localId: number;
    deleted: boolean;
}

export type GridTopologyInfo = [
    edgeKeys: string[],
    adjGrids: number[][],
    storageId_edgeId_set: Array<
        [Set<number>, Set<number>, Set<number>, Set<number>]
    >
];

export type GPUMultiGridUpdateInfo = [
    fromStorageId: number,
    levels: Uint8Array,
    vertices: Float32Array,
    verticesLow: Float32Array,
    deleted: Uint8Array,
]

export class GridNode {
    level: number;
    globalId: number;
    storageId: number;

    xMinPercent: [number, number];
    xMaxPercent: [number, number];
    yMinPercent: [number, number];
    yMaxPercent: [number, number];

    edges: [Set<number>, Set<number>, Set<number>, Set<number>];
    neighbours: [Set<number>, Set<number>, Set<number>, Set<number>];

    constructor(options: GridNodeParams) {
        this.globalId = options.globalId;
        this.storageId = options.storageId;

        if (options.level === undefined) {
            this.level =
                options.parent !== undefined ? options.parent.level + 1 : 0;
        } else {
            this.level = options.level === undefined ? 0 : options.level;
        }

        // Division Coordinates [ numerator, denominator ]
        // Use integer numerators and denominators to avoid coordinate precision issue
        this.xMinPercent = [0, 1];
        this.xMaxPercent = [1, 1];
        this.yMinPercent = [0, 1];
        this.yMaxPercent = [1, 1];

        this.edges = [
            new Set<number>(),
            new Set<number>(),
            new Set<number>(),
            new Set<number>(),
        ];

        this.neighbours = [
            new Set<number>(),
            new Set<number>(),
            new Set<number>(),
            new Set<number>(),
        ];

        // Update division coordinates if globalRange provided
        if (options.globalRange) {
            const [width, height] = options.globalRange;
            const globalU = this.globalId % width;
            const globalV = Math.floor(this.globalId / width);

            this.xMinPercent = simplifyFraction(globalU, width);
            this.xMaxPercent = simplifyFraction(globalU + 1, width);
            this.yMinPercent = simplifyFraction(globalV, height);
            this.yMaxPercent = simplifyFraction(globalV + 1, height);
        }
    }

    get uuId(): string {
        return `${this.level}-${this.globalId}`;
    }

    get xMin(): number {
        return this.xMinPercent[0] / this.xMinPercent[1];
    }

    get xMax(): number {
        return this.xMaxPercent[0] / this.xMaxPercent[1];
    }

    get yMin(): number {
        return this.yMinPercent[0] / this.yMinPercent[1];
    }

    get yMax(): number {
        return this.yMaxPercent[0] / this.yMaxPercent[1];
    }

    resetEdges(): void {
        this.edges.forEach((edge) => edge.clear());
    }

    addEdge(edgeIndex: number, edgeCode: number): void {
        this.edges[edgeCode].add(edgeIndex);
    }

    get edgeKeys(): number[] {
        return [
            ...this.edges[EDGE_CODE_NORTH],
            ...this.edges[EDGE_CODE_WEST],
            ...this.edges[EDGE_CODE_SOUTH],
            ...this.edges[EDGE_CODE_EAST],
        ];
    }

    get serialization() {
        return {
            xMinPercent: this.xMinPercent,
            yMinPercent: this.yMinPercent,
            xMaxPercent: this.xMaxPercent,
            yMaxPercent: this.yMaxPercent,
        };
    }

    getVertices(converter: Converter, bBox: BoundingBox2D) {
        const xMin = lerp(bBox.xMin, bBox.xMax, this.xMin);
        const yMin = lerp(bBox.yMin, bBox.yMax, this.yMin);
        const xMax = lerp(bBox.xMin, bBox.xMax, this.xMax);
        const yMax = lerp(bBox.yMin, bBox.yMax, this.yMax);

        const targetTL = converter.forward([xMin, yMax]); // srcTL
        const targetTR = converter.forward([xMax, yMax]); // srcTR
        const targetBL = converter.forward([xMin, yMin]); // srcBL
        const targetBR = converter.forward([xMax, yMin]); // srcBR

        const renderTL = MercatorCoordinate.fromLonLat(
            targetTL as [number, number]
        );
        const renderTR = MercatorCoordinate.fromLonLat(
            targetTR as [number, number]
        );
        const renderBL = MercatorCoordinate.fromLonLat(
            targetBL as [number, number]
        );
        const renderBR = MercatorCoordinate.fromLonLat(
            targetBR as [number, number]
        );

        return new Float32Array([
            ...renderTL,
            ...renderTR,
            ...renderBL,
            ...renderBR,
        ]);
    }

    release(): null {
        this.level = -1;
        this.globalId = -1;
        this.storageId = -1;

        this.xMinPercent = [0, 0];
        this.xMaxPercent = [0, 0];
        this.yMinPercent = [0, 0];
        this.yMaxPercent = [0, 0];

        this.edges = null as any;
        this.neighbours = null as any;

        return null;
    }

    equal(grid: GridNode): boolean {
        return this.level === grid.level && this.globalId === grid.globalId;
    }

    within(bBox: BoundingBox2D, lon: number, lat: number): boolean {
        const xMin = lerp(bBox.xMin, bBox.xMax, this.xMin);
        const yMin = lerp(bBox.yMin, bBox.yMax, this.yMin);
        const xMax = lerp(bBox.xMin, bBox.xMax, this.xMax);
        const yMax = lerp(bBox.yMin, bBox.yMax, this.yMax);

        if (lon < xMin || lat < yMin || lon > xMax || lat > yMax) return false;
        return true;
    }
}

export class MultiGridInfoParser {

    static fromBuffer(buffer: ArrayBuffer): MultiGridBaseInfo {
        if (buffer.byteLength < 4) {
            return {
                levels: new Uint8Array(0),
                globalIds: new Uint32Array(0),
            }
        }

        const prefixView = new DataView(buffer, 0, 4);
        const gridNum = prefixView.getUint32(0, true);
        const alignedOffset = 4 + gridNum + ((4 - (gridNum % 4 || 4)) % 4);

        const levels = new Uint8Array(buffer, 4, gridNum);
        const globalIds = new Uint32Array(buffer, alignedOffset);

        return {
            levels,
            globalIds,
        }
    }

    static toBuffer(gridInfo: MultiGridBaseInfo): ArrayBuffer {
        const gridNum = gridInfo.levels.length;
        const buffer = new ArrayBuffer(4 + gridNum + ((4 - (gridNum % 4 || 4)) % 4) + gridNum * 4);
        const prefixView = new DataView(buffer, 0, 4);
        prefixView.setUint32(0, gridNum, true);
        const levelsView = new Uint8Array(buffer, 4, gridNum);
        levelsView.set(gridInfo.levels);
        const globalIdsView = new Uint32Array(buffer, 4 + gridNum + ((4 - (gridNum % 4 || 4)) % 4), gridNum);
        globalIdsView.set(gridInfo.globalIds);
        return buffer;
    }

    static async fromGetUrl(url: string): Promise<MultiGridBaseInfo> {
        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const buffer = await response.arrayBuffer();
        return MultiGridInfoParser.fromBuffer(buffer);
    }

    static async fromPostUrl(url: string, data: any): Promise<MultiGridBaseInfo> {
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const buffer = await response.arrayBuffer();
            return MultiGridInfoParser.fromBuffer(buffer);
            
        } catch (error) {
            console.error('Failed to fetch MultiGridInfo:', error);
            throw error;
        }
    }

    static async fromPostUrlByBuffer(url: string, gridInfo: MultiGridBaseInfo): Promise<MultiGridBaseInfo> {
        const buffer = MultiGridInfoParser.toBuffer(gridInfo);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: buffer,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const resBuffer = await response.arrayBuffer();
            return MultiGridInfoParser.fromBuffer(resBuffer);
        } catch (error) {
            console.error('Failed to post MultiGridInfo:', error);
            throw error;
        }
    }

    static async toPostUrl(url: string, gridInfo: MultiGridBaseInfo): Promise<void> {
        try {
            const buffer = MultiGridInfoParser.toBuffer(gridInfo);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: buffer,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to post MultiGridInfo:', error);
            throw error;
        }
    }
}

export class GridKeyHashTable {
    private _gridKeyHashTable: Uint32Array
    private _gridStorageIdTable: Uint32Array
    private _hashTableSize: number
    private _hashTableMask: number

    constructor(size: number) {
        this._hashTableSize = Math.max(8192, size * 2)
        this._hashTableSize = Math.pow(2, Math.ceil(Math.log2(this._hashTableSize)))
        this._hashTableMask = this._hashTableSize - 1
        
        this._gridKeyHashTable = new Uint32Array(this._hashTableSize * 2)
        this._gridStorageIdTable = new Uint32Array(this._hashTableSize)
        this._gridStorageIdTable.fill(0xFFFFFFFF)
    }
    
    private _hash(level: number, globalId: number): number {
        // Simplified version of FNV-1a hash algorithm
        let hash = 2166136261
        hash ^= level
        hash *= 16777619
        hash ^= globalId
        hash *= 16777619
        return (hash >>> 0) & this._hashTableMask // ensure positive value and limit within table size
    }
    
    private _findSlot(level: number, globalId: number): number {
        let hash = this._hash(level, globalId)
        
        while (this._gridStorageIdTable[hash] !== 0xFFFFFFFF) {
            const storedLevel = this._gridKeyHashTable[hash * 2]
            const storedGlobalId = this._gridKeyHashTable[hash * 2 + 1]
            
            if (storedLevel === level && storedGlobalId === globalId) {
                return hash
            }
            
            hash = (hash + 1) & this._hashTableMask
        }
        
        return hash
    }
    
    get(level: number, globalId: number): number | undefined {
        let hash = this._hash(level, globalId)
        
        while (this._gridStorageIdTable[hash] !== 0xFFFFFFFF) {
            const storedLevel = this._gridKeyHashTable[hash * 2]
            const storedGlobalId = this._gridKeyHashTable[hash * 2 + 1]
            
            if (storedLevel === level && storedGlobalId === globalId) {
                return this._gridStorageIdTable[hash]
            }
            
            hash = (hash + 1) & this._hashTableMask
        }
        
        return undefined
    }
    
    update(storageId: number, level: number, globalId: number) {
        const slot = this._findSlot(level, globalId)
        this._gridKeyHashTable[slot * 2] = level
        this._gridKeyHashTable[slot * 2 + 1] = globalId
        this._gridStorageIdTable[slot] = storageId
    }
    
    delete(level: number, globalId: number) {
        let hash = this._hash(level, globalId)
        
        while (this._gridStorageIdTable[hash] !== 0xFFFFFFFF) {
            const storedLevel = this._gridKeyHashTable[hash * 2]
            const storedGlobalId = this._gridKeyHashTable[hash * 2 + 1]
            
            if (storedLevel === level && storedGlobalId === globalId) {
                this._gridStorageIdTable[hash] = 0xFFFFFFFF
                
                let nextHash = (hash + 1) & this._hashTableMask
                while (this._gridStorageIdTable[nextHash] !== 0xFFFFFFFF) {
                    const nextLevel = this._gridKeyHashTable[nextHash * 2]
                    const nextGlobalId = this._gridKeyHashTable[nextHash * 2 + 1]
                    const nextStorageId = this._gridStorageIdTable[nextHash]
                    
                    this._gridStorageIdTable[nextHash] = 0xFFFFFFFF
                    this.update(nextStorageId, nextLevel, nextGlobalId)
                    
                    nextHash = (nextHash + 1) & this._hashTableMask
                }
                break
            }
            
            hash = (hash + 1) & this._hashTableMask
        }
    }
}


// Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////

function lerp(a: number, b: number, t: number): number {
    return (1.0 - t) * a + t * b;
}

function simplifyFraction(n: number, m: number): [number, number] {
    let a = n,
        b = m;
    while (b !== 0) {
        [a, b] = [b, a % b];
    }

    return [n / a, m / a];
}
