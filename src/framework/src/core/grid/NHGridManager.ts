import proj4 from 'proj4';
import type { Converter } from 'proj4/dist/lib/core'

import {
    GridNode,
    GridContext,
    EDGE_CODE_WEST,
    EDGE_CODE_EAST,
    EDGE_CODE_NORTH,
    EDGE_CODE_SOUTH,
    EDGE_CODE_INVALID,
    type EDGE_CODE,
    GridTopologyInfo,
    StructuredGridRenderVertices,
} from './types';
import { MercatorCoordinate } from '../math/mercatorCoordinate';

proj4.defs(
    'EPSG:2326',
    '+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.243649,-1.158827,-1.094246 +units=m +no_defs'
);

export class GridEdgeManager {
    edgeKey_keyIndex_map: Map<string, number> = new Map();

    edgeKey_cache = new Array<string>();
    edge_adjGridStorageIds_cache = new Array<number[]>();

    constructor() {}

    release(): null {
        this.edgeKey_cache = [];
        this.edgeKey_keyIndex_map.clear();
        this.edge_adjGridStorageIds_cache = [];

        return null;
    }

    getEdgeKeyByInfo(
        grid_a: GridNode | null,
        grid_b: GridNode | null,
        direction: 'v' | 'h',
        range: [
            min: [number, number],
            max: [number, number],
            shared: [number, number]
        ]
    ): number {
        if (!grid_a && !grid_b)
            throw new Error('None grid provided for edge key aqusition.');

        // Encode key by range
        const key = direction + range.flat().join('-');

        // Try get key index
        let keyIndex = this.edgeKey_keyIndex_map.get(key);

        // Add key to key map
        if (keyIndex === undefined) {
            keyIndex = this.edgeKey_cache.length;
            this.edgeKey_keyIndex_map.set(key, keyIndex);

            const grids = new Array<number>();
            grid_a && grids.push(grid_a.storageId);
            grid_b && grids.push(grid_b.storageId);

            this.edgeKey_cache.push(key);
            this.edge_adjGridStorageIds_cache.push(grids);
        }

        return keyIndex;
    }

    get edgeNum(): number {
        return this.edgeKey_cache.length;
    }

    calcGridEdges(
        grid: GridNode,
        neighbours: [GridNode[], GridNode[], GridNode[], GridNode[]]
    ): void {
        // Calculate north edges
        this._calcHorizontalEdges(
            grid,
            neighbours[EDGE_CODE_NORTH],
            EDGE_CODE_NORTH,
            EDGE_CODE_SOUTH,
            grid.yMaxPercent
        );
        // Calculate sourth edges
        this._calcHorizontalEdges(
            grid,
            neighbours[EDGE_CODE_SOUTH],
            EDGE_CODE_SOUTH,
            EDGE_CODE_NORTH,
            grid.yMinPercent
        );
        // Calculate west edges
        this._calcVerticalEdges(
            grid,
            neighbours[EDGE_CODE_WEST],
            EDGE_CODE_WEST,
            EDGE_CODE_EAST,
            grid.xMinPercent
        );
        // Calculate east edges
        this._calcVerticalEdges(
            grid,
            neighbours[EDGE_CODE_EAST],
            EDGE_CODE_EAST,
            EDGE_CODE_WEST,
            grid.xMaxPercent
        );
    }

    private _calcHorizontalEdges(
        grid: GridNode,
        neighbours: GridNode[],
        edgeCode: number,
        opEdgeCode: number,
        sharedCoord: [number, number]
    ): void {
        // Case when no neighbour /////////////////////////////////////////////////////

        if (neighbours.length === 0) {
            const edge = this.getEdgeKeyByInfo(grid, null, 'h', [
                grid.xMinPercent,
                grid.xMaxPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
            return;
        }

        // Case when neighbour has lower level /////////////////////////////////////////////////////

        if (neighbours.length === 1 && neighbours[0].level < grid.level) {
            const edge = this.getEdgeKeyByInfo(grid, neighbours[0], 'h', [
                grid.xMinPercent,
                grid.xMaxPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
            neighbours[0].addEdge(edge, opEdgeCode);
            return;
        }

        // Case when neighbours have equal or higher levels ////////////////////////////////////////

        neighbours.sort(
            (neighbourA, neighbourB) => neighbourA.xMin - neighbourB.xMin
        );

        // Calculate edge between grid xMin and first neighbour if existed
        if (grid.xMin !== neighbours[0].xMin) {
            const edge = this.getEdgeKeyByInfo(grid, null, 'h', [
                grid.xMinPercent,
                neighbours[0].xMinPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
        }

        // Calculate edges between neighbours
        for (let i = 0; i < neighbours.length - 1; i++) {
            const neighbourFrom = neighbours[i];
            const neighbourTo = neighbours[i + 1];

            // Calculate edge of neighbourFrom
            const edge = this.getEdgeKeyByInfo(grid, neighbourFrom, 'h', [
                neighbourFrom.xMinPercent,
                neighbourFrom.xMaxPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
            neighbourFrom.addEdge(edge, opEdgeCode);

            // Calculate edge between neighbourFrom and neighbourTo if existed
            if (neighbourFrom.xMax !== neighbourTo.xMin) {
                const edge = this.getEdgeKeyByInfo(grid, null, 'h', [
                    neighbourFrom.xMaxPercent,
                    neighbourTo.xMinPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
            }
        }

        // Calculate edge of last neighbour
        const lastNeighbour = neighbours[neighbours.length - 1];
        const edge = this.getEdgeKeyByInfo(grid, lastNeighbour, 'h', [
            lastNeighbour.xMinPercent,
            lastNeighbour.xMaxPercent,
            sharedCoord,
        ]);
        grid.addEdge(edge, edgeCode);
        lastNeighbour.addEdge(edge, opEdgeCode);

        // Calculate edge between last neighbour and grid xMax if existed
        if (lastNeighbour.xMax !== grid.xMax) {
            const edge = this.getEdgeKeyByInfo(grid, null, 'h', [
                lastNeighbour.xMaxPercent,
                grid.xMaxPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
        }
    }

    private _calcVerticalEdges(
        grid: GridNode,
        neighbours: GridNode[],
        edgeCode: number,
        opEdgeCode: number,
        sharedCoord: [number, number]
    ): void {
        // Case when no neighbour /////////////////////////////////////////////////////

        if (neighbours.length === 0) {
            const edge = this.getEdgeKeyByInfo(grid, null, 'v', [
                grid.yMinPercent,
                grid.yMaxPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
            return;
        }

        // Case when neighbour has lower level /////////////////////////////////////////////////////

        if (neighbours.length === 1 && neighbours[0].level < grid.level) {
            const edge = this.getEdgeKeyByInfo(grid, neighbours[0], 'v', [
                grid.yMinPercent,
                grid.yMaxPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
            neighbours[0].addEdge(edge, opEdgeCode);
            return;
        }

        // Case when neighbours have equal or higher levels ////////////////////////////////////////

        neighbours.sort(
            (neighbourA, neighbourB) => neighbourA.yMin - neighbourB.yMin
        );

        // Calculate edge between grid yMin and first neighbour if existed
        if (grid.yMin !== neighbours[0].yMin) {
            const edge = this.getEdgeKeyByInfo(grid, null, 'v', [
                grid.yMinPercent,
                neighbours[0].yMinPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
        }

        // Calculate edges between neighbours
        for (let i = 0; i < neighbours.length - 1; i++) {
            const neighbourFrom = neighbours[i];
            const neighbourTo = neighbours[i + 1];

            // Calculate edge of neighbourFrom
            const edge = this.getEdgeKeyByInfo(grid, neighbourFrom, 'v', [
                neighbourFrom.yMinPercent,
                neighbourFrom.yMaxPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
            neighbourFrom.addEdge(edge, opEdgeCode);

            // Calculate edge between neighbourFrom and neighbourTo if existed
            if (neighbourFrom.yMax !== neighbourTo.yMin) {
                const edge = this.getEdgeKeyByInfo(grid, null, 'v', [
                    neighbourFrom.yMaxPercent,
                    neighbourTo.yMinPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
            }
        }

        // Calculate edge of last neighbour
        const lastNeighbour = neighbours[neighbours.length - 1];
        const edge = this.getEdgeKeyByInfo(grid, lastNeighbour, 'v', [
            lastNeighbour.yMinPercent,
            lastNeighbour.yMaxPercent,
            sharedCoord,
        ]);
        grid.addEdge(edge, edgeCode);
        lastNeighbour.addEdge(edge, opEdgeCode);

        // Calculate edge between last neighbour and grid yMax if existed
        if (lastNeighbour.yMax !== grid.yMax) {
            const edge = this.getEdgeKeyByInfo(grid, null, 'v', [
                lastNeighbour.yMaxPercent,
                grid.yMaxPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
        }
    }

    /** @deprecated */
    calcHorizontalEdges(
        grid: GridNode,
        neighbours: GridNode[],
        edgeCode: number,
        opEdgeCode: number,
        sharedCoord: [number, number]
    ): void {
        // Case when neighbour has lower level /////////////////////////////////////////////////////

        if (neighbours.length === 1 && neighbours[0].level < grid.level) {
            const edge = this.getEdgeKeyByInfo(grid, neighbours[0], 'h', [
                grid.xMinPercent,
                grid.xMaxPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
            neighbours[0].addEdge(edge, opEdgeCode);
            return;
        }

        // Case when neighbours have equal or higher levels ////////////////////////////////////////

        neighbours = neighbours.filter(
            (neighbour) => neighbour.level >= grid.level
        );
        neighbours.sort(
            (neighbourA, neighbourB) => neighbourA.xMin - neighbourB.xMin
        );
        const xSet = new Set([grid.xMin, grid.xMax]);
        neighbours.forEach((neighbour) => {
            xSet.add(neighbour.xMin);
            xSet.add(neighbour.xMax);
        });
        const xPercentList = [...xSet].sort((x1, x2) => x1 - x2);

        // Iterate sub-edges and find their neighbours
        // If a sub-edge:
        // - [Situation 1] belongs to a neighbour ( add it to <this> and <neighbour> )
        // - [Situation 2] does not belong to any neighbour ( only add it to <this> )
        for (let i = 0; i < xPercentList.length - 1; i++) {
            const from = xPercentList[i];
            const to = xPercentList[i + 1];

            let fromIndex = -1;
            let toIndex = -1;
            for (let j = 0; j < neighbours.length; j++) {
                const neighbour = neighbours[j];
                const xMin = neighbour.xMin;
                const xMax = neighbour.xMax;

                if (xMin === from || xMax === from) fromIndex = j;
                if (xMin === to || xMax === to) toIndex = j;
                if (fromIndex !== -1 && toIndex !== -1) break;
            }

            // Situation 1
            // X -->
            // From   Neighbour     To
            // |____________________|

            if (fromIndex === toIndex && fromIndex !== -1) {
                const neighbour = neighbours[fromIndex];
                const edge = this.getEdgeKeyByInfo(grid, neighbour, 'h', [
                    neighbour.xMinPercent,
                    neighbour.xMaxPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
                neighbour.addEdge(edge, opEdgeCode);
            }

            // Situation 2 - Case 1
            // X -->
            // From                 To
            // |____________________|
            else if (fromIndex === toIndex && fromIndex === -1) {
                const edge = this.getEdgeKeyByInfo(grid, null, 'h', [
                    grid.xMinPercent,
                    grid.xMaxPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
            }

            // Situation 2 - Case 2
            // X -->
            //      Neighbour_F     From                 To    Neighbour_T
            // |_ _ _ _ _ _ _ _ _ _ |____________________|_ _ _ _ _ _ _ _ _ _ ｜
            else if (
                fromIndex !== toIndex &&
                fromIndex !== -1 &&
                toIndex !== -1
            ) {
                const fromNeighbour = neighbours[fromIndex];
                const toNeighbour = neighbours[toIndex];
                const edge = this.getEdgeKeyByInfo(grid, null, 'h', [
                    fromNeighbour.xMaxPercent,
                    toNeighbour.xMinPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
            }

            // Situation 2 - Case 3
            // X -->
            //      Neighbour_F     From                 To
            // |_ _ _ _ _ _ _ _ _ _ |____________________|
            else if (fromIndex !== -1 && toIndex === -1) {
                const fromNeighbour = neighbours[fromIndex];
                const edge = this.getEdgeKeyByInfo(grid, null, 'h', [
                    fromNeighbour.xMaxPercent,
                    grid.xMaxPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
            }

            // Situation 2 - Case 4
            // X -->
            // From                 To    Neighbour_T
            // |____________________|_ _ _ _ _ _ _ _ _ _ ｜
            else if (fromIndex === -1 && toIndex !== -1) {
                const toNeighbour = neighbours[toIndex];
                const edge = this.getEdgeKeyByInfo(grid, null, 'h', [
                    grid.xMinPercent,
                    toNeighbour.xMinPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
            }
        }
    }

    /** @deprecated */
    calcVerticalEdges(
        grid: GridNode,
        neighbours: GridNode[],
        edgeCode: number,
        opEdgeCode: number,
        sharedCoord: [number, number]
    ): void {
        // Case when neighbour has lower level /////////////////////////////////////////////////////

        if (neighbours.length === 1 && neighbours[0].level < grid.level) {
            const edge = this.getEdgeKeyByInfo(grid, neighbours[0], 'v', [
                grid.yMinPercent,
                grid.yMaxPercent,
                sharedCoord,
            ]);
            grid.addEdge(edge, edgeCode);
            neighbours[0].addEdge(edge, opEdgeCode);
            return;
        }

        // Case when neighbours have equal or higher levels ////////////////////////////////////////

        neighbours = neighbours.filter(
            (neighbour) => neighbour.level >= grid.level
        );
        neighbours.sort(
            (neighbourA, neighbourB) => neighbourA.yMin - neighbourB.yMin
        );
        const ySet = new Set([grid.yMin, grid.yMax]);
        neighbours.forEach((neighbour) => {
            ySet.add(neighbour.yMin);
            ySet.add(neighbour.yMax);
        });
        const yList = [...ySet].sort((y1, y2) => y1 - y2);

        // Iterate sub-edges and find their neighbours
        // If a sub-edge:
        // - [Situation 1] belongs to a neighbour ( add it to <this> and <neighbour> )
        // - [Situation 2] does not belong to any neighbour ( only add it to <this> )
        for (let i = 0; i < yList.length - 1; i++) {
            const from = yList[i];
            const to = yList[i + 1];

            let fromIndex = -1;
            let toIndex = -1;
            for (let j = 0; j < neighbours.length; j++) {
                const neighbour = neighbours[j];
                const yMin = neighbour.yMin;
                const yMax = neighbour.yMax;

                if (yMin === from || yMax === from) fromIndex = j;
                if (yMin === to || yMax === to) toIndex = j;
                if (fromIndex !== -1 && toIndex !== -1) break;
            }

            // Situation 1
            // Y -->
            // From   Neighbour     To
            // |____________________|

            if (fromIndex === toIndex && fromIndex !== -1) {
                const neighbour = neighbours[fromIndex];
                const edge = this.getEdgeKeyByInfo(grid, neighbour, 'v', [
                    neighbour.yMinPercent,
                    neighbour.yMaxPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
                neighbour.addEdge(edge, opEdgeCode);
            }

            // Situation 2 - Case 1
            // Y -->
            // From                 To
            // |____________________|
            else if (fromIndex === toIndex && fromIndex === -1) {
                const edge = this.getEdgeKeyByInfo(grid, null, 'v', [
                    grid.yMinPercent,
                    grid.yMaxPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
            }

            // Situation 2 - Case 2
            // Y -->
            //      Neighbour_F     From                 To    Neighbour_T
            // |_ _ _ _ _ _ _ _ _ _ |____________________|_ _ _ _ _ _ _ _ _ _ ｜
            else if (
                fromIndex !== toIndex &&
                fromIndex !== -1 &&
                toIndex !== -1
            ) {
                const fromNeighbour = neighbours[fromIndex];
                const toNeighbour = neighbours[toIndex];
                const edge = this.getEdgeKeyByInfo(grid, null, 'v', [
                    fromNeighbour.yMaxPercent,
                    toNeighbour.yMinPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
            }

            // Situation 2 - Case 3
            // Y -->
            //      Neighbour_F     From                 To
            // |_ _ _ _ _ _ _ _ _ _ |____________________|
            else if (fromIndex !== -1 && toIndex === -1) {
                const fromNeighbour = neighbours[fromIndex];
                const edge = this.getEdgeKeyByInfo(grid, null, 'v', [
                    fromNeighbour.yMaxPercent,
                    grid.yMaxPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
            }

            // Situation 2 - Case 4
            // Y -->
            // From                 To    Neighbour_T
            // |____________________|_ _ _ _ _ _ _ _ _ _ ｜
            else if (fromIndex === -1 && toIndex !== -1) {
                const toNeighbour = neighbours[toIndex];
                const edge = this.getEdgeKeyByInfo(grid, null, 'v', [
                    grid.yMinPercent,
                    toNeighbour.yMinPercent,
                    sharedCoord,
                ]);
                grid.addEdge(edge, edgeCode);
            }
        }
    }
}

interface GridLevelInfo {
    width: number;
    height: number;
}

export type GridInfo = {
    uuId: string;
    level: number;
    globalId: number;
};

export default class GridManager {
    private _center: [number, number]
    private _levelInfos: GridLevelInfo[];
    private _context: GridContext;
    private _projConverter: Converter;

    constructor(context: GridContext) {
        this._projConverter = proj4(
            context.srcCS,
            context.targetCS
        );
        this._levelInfos = [{ width: 1, height: 1 }];

        this._context = context;
        this._context.rules.forEach((_, level, rules) => {
            let width: number, height: number;
            if (level == 0) {
                width = 1;
                height = 1;
            } else {
                width = this._levelInfos[level - 1].width * rules[level - 1][0];
                height =
                    this._levelInfos[level - 1].height * rules[level - 1][1];
            }
            this._levelInfos[level] = { width, height };
        });

        this._center = [
            (this._context.bBox.xMin + this._context.bBox.xMax) / 2.0,
            (this._context.bBox.yMin + this._context.bBox.yMax) / 2.0,
        ]
    }

    set context(context: GridContext) {
        // Update projection converter
        this._projConverter = proj4(context.srcCS, context.targetCS);

        // Update subdivide rules first
        this._context = context;

        // Update level infos then
        this._levelInfos = [{ width: 1, height: 1 }];
        this._context.rules.forEach((_, level, rules) => {
            let width: number, height: number;
            if (level == 0) {
                width = 1;
                height = 1;
            } else {
                width = this._levelInfos[level - 1].width * rules[level - 1][0];
                height =
                    this._levelInfos[level - 1].height * rules[level - 1][1];
            }
            this._levelInfos[level] = { width, height };
        });
    }

    getGridLocalId(level: number, globalId: number) {
        if (level === 0) return 0;

        const { width } = this._levelInfos[level];
        const [subWidth, subHeight] = this._context.rules[level - 1];

        const u = globalId % width;
        const v = Math.floor(globalId / width);

        return (v % subHeight) * subWidth + (u % subWidth);
    }

    getParentGlobalId(level: number, globalId: number): number {
        if (level === 0) return 0;

        const { width } = this._levelInfos[level];
        const [subWidth, subHeight] = this._context.rules[level - 1];

        const u = globalId % width;
        const v = Math.floor(globalId / width);

        return (
            Math.floor(v / subHeight) * this._levelInfos[level - 1].width +
            Math.floor(u / subWidth)
        );
    }

    getGridChildren(level: number, globalId: number): number[] | null {
        if (level >= this._levelInfos.length || level < 0) return null;

        const { width: levelWidth } = this._levelInfos[level];
        const globalU = globalId % levelWidth;
        const globalV = Math.floor(globalId / levelWidth);

        const [subWidth, subHeight] = this._context.rules[level];
        const subCount = subWidth * subHeight;

        const children = new Array<number>(subCount);
        const baseGlobalWidth = levelWidth * subWidth;
        for (let localId = 0; localId < subCount; localId++) {
            const subU = localId % subWidth;
            const subV = Math.floor(localId / subWidth);

            const subGlobalU = globalU * subWidth + subU;
            const subGlobalV = globalV * subHeight + subV;
            const subGlobalId = subGlobalV * baseGlobalWidth + subGlobalU;
            children[localId] = subGlobalId;
        }

        return children;
    }

    parseTopology(gridInfoCache: Array<number>): GridTopologyInfo {
        /* ------------------------------------------------------------------
                                            |
            Neighbours around a grid        |     Edges around a grid node   
                                            |
                      tGrid                 |         ----- 0b00 -----
                        |                   |        |                |
             lGrid -- GRID -- rGrid         |        0b01   NODE   0b11
                        |                   |        |                |
                      bGrid                 |         ----- 0b10 ----- 
                                            |
        ------------------------------------------------------------------ */

        let start = 0,
            end = 0;
        start = Date.now();

        const gridNum = gridInfoCache.length / 2;
        const edgeManager = new GridEdgeManager();
        const storageId_grid_cache = Array.from(
            { length: gridNum },
            ((_: unknown, storageId: number) => {
                const level = gridInfoCache[storageId * 2];
                const globalId = gridInfoCache[storageId * 2 + 1];
                const { width, height } = this._levelInfos[level];

                return new GridNode({
                    level,
                    globalId,
                    storageId,
                    globalRange: [width, height],
                });
            }).bind(this)
        );

        // Step 1: Find Neighbours /////////////////////////////////////////////////

        // Local map from uuId to storageId
        const uuId_storageId_map = new Map<string, number>();
        storageId_grid_cache.forEach((grid) =>
            uuId_storageId_map.set(grid.uuId, grid.storageId)
        );

        // Iterate all grids and find their neighbours
        storageId_grid_cache.forEach((grid) => {
            const width = this._levelInfos[grid.level].width;

            const globalU = grid.globalId % width;
            const globalV = Math.floor(grid.globalId / width);

            // Check top edge with tGrid
            const tGridInfo = this._getGridInfoFromUV(
                grid.level,
                globalU,
                globalV + 1
            );
            tGridInfo &&
                findNeighboursAlongEdge.call(
                    this,
                    grid,
                    EDGE_CODE_NORTH,
                    tGridInfo,
                    (localId: number, subWidth: number, _: number) =>
                        localId < subWidth
                );

            // Check left edge with lGrid
            const lGridinfo = this._getGridInfoFromUV(
                grid.level,
                globalU - 1,
                globalV
            );
            lGridinfo &&
                findNeighboursAlongEdge.call(
                    this,
                    grid,
                    EDGE_CODE_WEST,
                    lGridinfo,
                    (localId: number, subWidth: number, _: number) =>
                        localId % subWidth === subWidth - 1
                );

            // Check bottom edge with bGrid
            const bGridInfo = this._getGridInfoFromUV(
                grid.level,
                globalU,
                globalV - 1
            );
            bGridInfo &&
                findNeighboursAlongEdge.call(
                    this,
                    grid,
                    EDGE_CODE_SOUTH,
                    bGridInfo,
                    (localId: number, subWidth: number, subHeight: number) =>
                        localId >= subWidth * (subHeight - 1)
                );

            // Check right edge with rGrid
            const rGridInfo = this._getGridInfoFromUV(
                grid.level,
                globalU + 1,
                globalV
            );
            rGridInfo &&
                findNeighboursAlongEdge.call(
                    this,
                    grid,
                    EDGE_CODE_EAST,
                    rGridInfo,
                    (localId: number, subWidth: number, _: number) =>
                        localId % subWidth === 0
                );
        });

        // Release local map
        uuId_storageId_map.clear();

        // Step 2: Parse Edges /////////////////////////////////////////////////

        storageId_grid_cache.forEach((grid) =>
            edgeManager.calcGridEdges(grid, getGridNeighbours(grid))
        );

        // Step 3: Collect Results /////////////////////////////////////////////////

        // Generate result about storageId_edgeId_set
        const storageId_edgeId_set: Array<
            [Set<number>, Set<number>, Set<number>, Set<number>]
        > = Array.from({ length: gridNum }, (_, storageId) => {
            const grid = storageId_grid_cache[storageId];
            const edges = grid.edges;
            storageId_grid_cache[storageId] = grid.release() as any; // release grid memory
            return edges;
        });

        end = Date.now();
        console.log('Topology Parsing Time Cost:', end - start);

        return [
            edgeManager.edgeKey_cache,
            edgeManager.edge_adjGridStorageIds_cache,
            storageId_edgeId_set,
        ];

        // ---------------------------------------------------------------
        // Local helpers /////////////////////////////////////////////////

        function getToggleEdgeCode(
            code: number
        ): EDGE_CODE | typeof EDGE_CODE_INVALID {
            switch (code) {
                case EDGE_CODE_NORTH:
                    return EDGE_CODE_SOUTH;

                case EDGE_CODE_WEST:
                    return EDGE_CODE_EAST;

                case EDGE_CODE_SOUTH:
                    return EDGE_CODE_NORTH;

                case EDGE_CODE_EAST:
                    return EDGE_CODE_WEST;
                default:
                    console.error('Provided edge code is invalid.');
                    return EDGE_CODE_INVALID;
            }
        }

        function updateGridNeighbour(
            grid: GridNode,
            neighbour: GridNode,
            edgeCode: EDGE_CODE
        ) {
            const oppoCode = getToggleEdgeCode(edgeCode) as EDGE_CODE;
            grid.neighbours[edgeCode].add(neighbour.storageId);
            neighbour.neighbours[oppoCode].add(grid.storageId);
        }

        function findNeighboursAlongEdge(
            this: GridManager,
            grid: GridNode,
            edgeCode: EDGE_CODE,
            gridInfo: GridInfo,
            adjacentCheckFunc: Function
        ) {
            // Check if gridInfo has storageId (whether if this grid is a leaf node)
            const rootNeighbourGrid = uuId_storageId_map.get(gridInfo.uuId);
            if (rootNeighbourGrid) {
                const rootNeighbour = storageId_grid_cache[rootNeighbourGrid];
                updateGridNeighbour(grid, rootNeighbour, edgeCode);
            } else {
                // Get all children by gridInfo, adjacent to <grid>
                const adjChildren: GridNode[] = [];
                const infoStack: GridInfo[] = [gridInfo];

                while (infoStack.length) {
                    const { level: _level, globalId: _globalId } =
                        infoStack.pop()!;

                    const children = this.getGridChildren(_level, _globalId);
                    if (!children) continue;

                    const [subWidth, subHeight] =
                        this._context.rules[_level];
                    children.forEach((childGlobalId, childLocalId) => {
                        const isAdjacent = adjacentCheckFunc(
                            childLocalId,
                            subWidth,
                            subHeight
                        );
                        if (!isAdjacent) return;

                        const childLevel = _level + 1;
                        const childId = `${childLevel}-${childGlobalId}`;

                        // Check if child has storageId (whether if this child is a leaf node)
                        const childStorageId = uuId_storageId_map.get(childId);
                        if (childStorageId) {
                            adjChildren.push(
                                storageId_grid_cache[childStorageId]
                            );
                        } else {
                            infoStack.push({
                                uuId: childId,
                                level: childLevel,
                                globalId: childGlobalId,
                            });
                        }
                    });
                }

                adjChildren.forEach((child) =>
                    updateGridNeighbour(grid, child, edgeCode)
                );
            }
        }

        function getGridNeighbours(
            grid: GridNode
        ): [GridNode[], GridNode[], GridNode[], GridNode[]] {
            const neighbourStorageIds = grid.neighbours;
            const neighbours: [GridNode[], GridNode[], GridNode[], GridNode[]] =
                [
                    new Array<GridNode>(
                        neighbourStorageIds[EDGE_CODE_NORTH].size
                    ),
                    new Array<GridNode>(
                        neighbourStorageIds[EDGE_CODE_WEST].size
                    ),
                    new Array<GridNode>(
                        neighbourStorageIds[EDGE_CODE_SOUTH].size
                    ),
                    new Array<GridNode>(
                        neighbourStorageIds[EDGE_CODE_EAST].size
                    ),
                ];

            for (let edgeCode = 0; edgeCode < 4; edgeCode++) {
                let index = 0;
                for (const storageId of neighbourStorageIds[edgeCode]) {
                    neighbours[edgeCode][index++] =
                        storageId_grid_cache[storageId];
                }
            }

            return neighbours;
        }
    }

    getEdgeRenderInfos(keys: string[]): Float32Array {
        const vertexBuffer = new Float32Array(keys.length * 4);
        keys.forEach((key, index) =>
            this._getEdgeRenderInfo(index, key, vertexBuffer)
        );
        return vertexBuffer;
    }

    private _getEdgeRenderInfo(
        index: number,
        key: string,
        vertexBuffer: Float32Array
    ): void {
        const direction = key.substring(0, 1);
        const position = key.substring(1).split('-');

        const min = +position[0] / +position[1];
        const max = +position[2] / +position[3];
        const shared = +position[4] / +position[5];

        const bBox = this._context.bBox;
        const center = this._projConverter.forward([
            (bBox.xMin + bBox.xMax) / 2.0,
            (bBox.yMin + bBox.yMax) / 2.0,
        ]);
        const mercatorCenter = MercatorCoordinate.fromLonLat(
            center as [number, number]
        );

        if (direction === 'h') {
            const minX = lerp(bBox.xMin, bBox.xMax, min);
            const maxX = lerp(bBox.xMin, bBox.xMax, max);
            const sharedY = lerp(bBox.yMin, bBox.yMax, shared);

            const start = MercatorCoordinate.fromLonLat(
                this._projConverter.forward([minX, sharedY])
            );
            const end = MercatorCoordinate.fromLonLat(
                this._projConverter.forward([maxX, sharedY])
            );

            vertexBuffer[index * 4 + 0] = start[0] - mercatorCenter[0];
            vertexBuffer[index * 4 + 1] = start[1] - mercatorCenter[1];
            vertexBuffer[index * 4 + 2] = end[0] - mercatorCenter[0];
            vertexBuffer[index * 4 + 3] = end[1] - mercatorCenter[1];
        } else {
            const minY = lerp(bBox.yMin, bBox.yMax, min);
            const maxY = lerp(bBox.yMin, bBox.yMax, max);
            const sharedX = lerp(bBox.xMin, bBox.xMax, shared);

            const start = MercatorCoordinate.fromLonLat(
                this._projConverter.forward([sharedX, minY])
            );
            const end = MercatorCoordinate.fromLonLat(
                this._projConverter.forward([sharedX, maxY])
            );

            vertexBuffer[index * 4 + 0] = start[0] - mercatorCenter[0];
            vertexBuffer[index * 4 + 1] = start[1] - mercatorCenter[1];
            vertexBuffer[index * 4 + 2] = end[0] - mercatorCenter[0];
            vertexBuffer[index * 4 + 3] = end[1] - mercatorCenter[1];
        }
    }

    private _getGridInfoFromUV(
        level: number,
        u: number,
        v: number
    ): GridInfo | null {
        const { width, height } = this._levelInfos[level];

        // Check if valid
        if (u < 0 || u >= width || v < 0 || v >= height) return null;

        const globalId = v * width + u;

        return {
            level,
            globalId,
            uuId: `${level}-${globalId}`,
        };
    }

    createGridRenderVertices(
        level: number,
        globalId: number,
        vertices?: Float32Array,
        verticesLow?: Float32Array
    ): [Float32Array, Float32Array] {
        const bBox = this._context.bBox;
        const { width, height } = this._levelInfos[level];

        const globalU = globalId % width;
        const globalV = Math.floor(globalId / width);

        const xMin = lerp(bBox.xMin, bBox.xMax, globalU / width);
        const yMin = lerp(bBox.yMin, bBox.yMax, globalV / height);
        const xMax = lerp(bBox.xMin, bBox.xMax, (globalU + 1) / width);
        const yMax = lerp(bBox.yMin, bBox.yMax, (globalV + 1) / height);

        const targetCoords = [
            this._projConverter.forward([xMin, yMax]), // srcTL
            this._projConverter.forward([xMax, yMax]), // srcTR
            this._projConverter.forward([xMin, yMin]), // srcBL
            this._projConverter.forward([xMax, yMin]), // srcBR
        ];

        const relativeCenter: [number, number] = this._projConverter.forward(this._center);
        const mercatorCenter = MercatorCoordinate.fromLonLat(relativeCenter);
        const centerX = encodeFloatToDouble(mercatorCenter[0]);
        const centerY = encodeFloatToDouble(mercatorCenter[1]);

        const renderCoords: number[] = []
        const renderCoordsLow: number[] = []
        targetCoords.forEach((coord) => {
            const mercatorCoord = MercatorCoordinate.fromLonLat(coord as [number, number])
            const mercatorCoordX = encodeFloatToDouble(mercatorCoord[0])
            const mercatorCoordY = encodeFloatToDouble(mercatorCoord[1])
            renderCoords.push(mercatorCoordX[0] - centerX[0])
            renderCoordsLow.push(mercatorCoordX[1] - centerX[1])
            renderCoords.push(mercatorCoordY[0] - centerY[0])
            renderCoordsLow.push(mercatorCoordY[1] - centerY[1])
        })

        if (!vertices) vertices = new Float32Array(renderCoords.flat());
        else vertices.set(renderCoords.flat(), 0);
        if (!verticesLow) verticesLow = new Float32Array(renderCoordsLow.flat());
        else verticesLow.set(renderCoordsLow.flat(), 0);

        return [vertices, verticesLow];
    }

    createMultiGridRenderVertices(
        levels: number[] | Uint8Array,
        globalIds: number[] | Uint32Array
    ): [Float32Array, Float32Array] {
        const gridNum = levels.length;
        const vertices = new Float32Array(8);
        const verticesLow = new Float32Array(8);
        const vertexBuffer = new Float32Array(gridNum * 8);
        const vertexBufferLow = new Float32Array(gridNum * 8);
        
        for (let i = 0; i < gridNum; i++) {
            const level = levels[i]
            const globalId = globalIds[i]
            this.createGridRenderVertices(level, globalId, vertices, verticesLow);
            vertexBuffer[gridNum * 2 * 0 + i * 2 + 0] = vertices[0];
            vertexBuffer[gridNum * 2 * 0 + i * 2 + 1] = vertices[1];
            vertexBuffer[gridNum * 2 * 1 + i * 2 + 0] = vertices[2];
            vertexBuffer[gridNum * 2 * 1 + i * 2 + 1] = vertices[3];
            vertexBuffer[gridNum * 2 * 2 + i * 2 + 0] = vertices[4];
            vertexBuffer[gridNum * 2 * 2 + i * 2 + 1] = vertices[5];
            vertexBuffer[gridNum * 2 * 3 + i * 2 + 0] = vertices[6];
            vertexBuffer[gridNum * 2 * 3 + i * 2 + 1] = vertices[7];

            vertexBufferLow[gridNum * 2 * 0 + i * 2 + 0] = verticesLow[0];
            vertexBufferLow[gridNum * 2 * 0 + i * 2 + 1] = verticesLow[1];
            vertexBufferLow[gridNum * 2 * 1 + i * 2 + 0] = verticesLow[2];
            vertexBufferLow[gridNum * 2 * 1 + i * 2 + 1] = verticesLow[3];
            vertexBufferLow[gridNum * 2 * 2 + i * 2 + 0] = verticesLow[4];
            vertexBufferLow[gridNum * 2 * 2 + i * 2 + 1] = verticesLow[5];  
            vertexBufferLow[gridNum * 2 * 3 + i * 2 + 0] = verticesLow[6];
            vertexBufferLow[gridNum * 2 * 3 + i * 2 + 1] = verticesLow[7];
        };

        return [vertexBuffer, vertexBufferLow]
    }

    createStructuredGridRenderVertices(
        levels: number[] | Uint8Array,
        globalIds: number[] | Uint32Array
    ): StructuredGridRenderVertices {
        const gridNum = levels.length;
        const vertices = new Float32Array(8);
        const verticesLow = new Float32Array(8);
        const tlBuffer = new Float32Array(gridNum * 2);
        const trBuffer = new Float32Array(gridNum * 2);
        const blBuffer = new Float32Array(gridNum * 2);
        const brBuffer = new Float32Array(gridNum * 2);
        const tlBufferLow = new Float32Array(gridNum * 2);
        const trBufferLow = new Float32Array(gridNum * 2);
        const blBufferLow = new Float32Array(gridNum * 2);
        const brBufferLow = new Float32Array(gridNum * 2);
        
        for (let i = 0; i < gridNum; i++) {
            const level = levels[i]
            const globalId = globalIds[i]
            this.createGridRenderVertices(level, globalId, vertices, verticesLow);
            tlBuffer[i * 2 + 0] = vertices[0];
            tlBuffer[i * 2 + 1] = vertices[1];
            trBuffer[i * 2 + 0] = vertices[2];
            trBuffer[i * 2 + 1] = vertices[3];
            blBuffer[i * 2 + 0] = vertices[4];
            blBuffer[i * 2 + 1] = vertices[5];
            brBuffer[i * 2 + 0] = vertices[6];
            brBuffer[i * 2 + 1] = vertices[7];

            tlBufferLow[i * 2 + 0] = verticesLow[0];
            tlBufferLow[i * 2 + 1] = verticesLow[1];
            trBufferLow[i * 2 + 0] = verticesLow[2];
            trBufferLow[i * 2 + 1] = verticesLow[3];
            blBufferLow[i * 2 + 0] = verticesLow[4];
            blBufferLow[i * 2 + 1] = verticesLow[5];
            brBufferLow[i * 2 + 0] = verticesLow[6];
            brBufferLow[i * 2 + 1] = verticesLow[7];
        };

        return {
            tl: tlBuffer,
            tr: trBuffer,
            bl: blBuffer,
            br: brBuffer,
            tlLow: tlBufferLow,
            trLow: trBufferLow,
            blLow: blBufferLow,
            brLow: brBufferLow
        }
    }
}

// Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////

function lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
}

function encodeFloatToDouble(value: number) {
    const result = new Float32Array(2);
    result[0] = value;
  
    const delta = value - result[0];
    result[1] = delta;
    return result;
}