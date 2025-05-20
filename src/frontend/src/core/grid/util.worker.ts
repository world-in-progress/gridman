import { Callback } from "../types";
import { WorkerSelf } from "../types";
import { MultiGridRenderInfo } from "./NHGrid";
import GridManager from "./NHGridManager";
import { MultiGridInfo } from "./type";

const DELETED_FLAG = 1
const UNDELETED_FLAG = 0

export default class GridUtils {
  static async subdivideGrids(
    worker: WorkerSelf & Record<"gridManager", GridManager>,
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array }
  ) {
    const body = {
      levels: Array.from(gridInfo.levels),
      global_ids: Array.from(gridInfo.globalIds),
    };

    const multiGridInfo = await MultiGridInfo.fromPostUrl(
      "/api/grid/operation/subdivide",
      body
    );
    const { levels, globalIds } = multiGridInfo;
    const [vertices, verticesLow] = worker.gridManager.createMultiRenderVertices(levels, globalIds);
    const renderInfo: MultiGridRenderInfo = {
      levels,
      globalIds,
      vertices,
      verticesLow,
      deleted: new Uint8Array(levels.length).fill(UNDELETED_FLAG)
    };
    return renderInfo;
  }

  static async mergeGrids(
    worker: WorkerSelf & Record<"gridManager", GridManager>,
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array }
  ) {
    const body = {
      levels: Array.from(gridInfo.levels),
      global_ids: Array.from(gridInfo.globalIds),
    };

    const multiGridInfo = await MultiGridInfo.fromPostUrl(
      "/api/grid/operation/merge",
      body
    );
    const { levels, globalIds } = multiGridInfo;
    const [vertices, verticesLow] = worker.gridManager.createMultiRenderVertices(levels, globalIds);
    const renderInfo: MultiGridRenderInfo = {
      levels,
      globalIds,
      vertices,
      verticesLow,
      deleted: new Uint8Array(levels.length).fill(UNDELETED_FLAG)
    };
    return renderInfo;
  }

  static async removeGrids(gridInfo: {
    levels: Uint8Array;
    globalIds: Uint32Array;
  }) {
    const body = {
      levels: Array.from(gridInfo.levels),
      global_ids: Array.from(gridInfo.globalIds),
    };

    const response = await fetch("/api/grid/operation/delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  }

  static async recoverGrids(gridInfo: {
    levels: Uint8Array;
    globalIds: Uint32Array;
  }) {
    const body = {
        levels: Array.from(gridInfo.levels),
        global_ids: Array.from(gridInfo.globalIds),
    }

    const response = await fetch('/api/grid/operation/recover', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  }

  static async getGridInfoByFeature(path: string) {

    const multiGridInfo = await MultiGridInfo.fromGetUrl(`/api/grid/operation/pick?feature_dir=${path}`);
    return multiGridInfo
  }
}
