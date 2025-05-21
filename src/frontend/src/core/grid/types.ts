import proj4 from 'proj4';
import BoundingBox2D from '../util/boundingBox2D';
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
    vertices: Float32Array;
    verticesLow: Float32Array;
    deleted: Uint8Array;
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

    getVertices(converter: proj4.Converter, bBox: BoundingBox2D) {
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
