import { WorkerSelf } from '../types';
import GridManager from './NHGridManager';
import { MultiGridBaseInfo, MultiGridInfoParser, MultiGridRenderInfo, StructuredGridRenderVertices } from "./types";

const DELETED_FLAG = 1
const UNDELETED_FLAG = 0

export default class GridUtils {
    static async subdivideGrids(
        worker: WorkerSelf & Record<"gridManager", GridManager>,
        gridInfo: MultiGridBaseInfo
    ): Promise<MultiGridBaseInfo> {
        return await MultiGridInfoParser.fromPostUrlByBuffer('/api/grid/operation/subdivide', gridInfo);
    }

    static async mergeGrids(
        worker: WorkerSelf & Record<"gridManager", GridManager>,
        gridInfo: MultiGridBaseInfo
    ) {
        const { levels, globalIds } = await MultiGridInfoParser.fromPostUrlByBuffer('/api/grid/operation/merge', gridInfo);
        const [vertices, verticesLow] = worker.gridManager.createMultiGridRenderVertices(levels, globalIds);
        const renderInfo: MultiGridRenderInfo = {
            levels,
            globalIds,
            vertices,
            verticesLow,
            deleted: new Uint8Array(levels.length).fill(UNDELETED_FLAG)
        };
        return renderInfo;
    }

    static async removeGrids(gridInfo: MultiGridBaseInfo) {
        try {
            await MultiGridInfoParser.toPostUrl('/api/grid/operation/delete', gridInfo);
        } catch (error) {
            console.error('Failed to delete MultiGridInfo:', error);
            throw error;
        }
    }

    static async recoverGrids(gridInfo: MultiGridBaseInfo) {
        try {
            await MultiGridInfoParser.toPostUrl('/api/grid/operation/recover', gridInfo);
        } catch (error) {
            console.error('Failed to recover MultiGridInfo:', error);
            throw error;
        }
    }

    static async getGridInfoByFeature(path: string) {

        const multiGridInfo = await MultiGridInfoParser.fromGetUrl(`/api/grid/operation/pick?feature_dir=${path}`);
        return multiGridInfo
    }

    static async saveGrids() {
        const response = await fetch('/api/grid/operation/save', { method: 'GET' })
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const gridInfo = await response.json();
        return gridInfo;
    }

    static getMultiGridRenderVertices(
        worker: WorkerSelf & Record<"gridManager", GridManager>,
        levels: Uint8Array, globalIds: Uint32Array
    ): StructuredGridRenderVertices {
        return worker.gridManager.createStructuredGridRenderVertices(levels, globalIds);
    }
}
