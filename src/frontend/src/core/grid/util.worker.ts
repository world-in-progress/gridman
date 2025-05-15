import { Callback } from "../types";
import { WorkerSelf } from "../types";
import { MultiGridRenderInfo } from "./NHGrid";
import GridManager from "./NHGridManager";
import { MultiGridInfo } from "./type";

export default class GridUtils {
  // static async subdivideGrids(
  //   this: WorkerSelf & Record<"gridManager", GridManager>,
  //   gridInfo: { levels: Uint8Array; globalIds: Uint32Array },
  //   callback: Callback<any>
  // ) {
  //   const multiGridInfo = await MultiGridInfo.fromPostUrl(
  //     "/api/grid/operation/subdivide",
  //     gridInfo
  //   );
  //   const { levels, globalIds } = multiGridInfo;
  //   const [vertices, verticesLow] = this.gridManager.createMultiRenderVertices(
  //     levels,
  //     globalIds
  //   );
  //   const renderInfo: MultiGridRenderInfo = {
  //     levels,
  //     globalIds,
  //     vertices,
  //     verticesLow,
  //   };
  //   callback(null, renderInfo);
  // }

  static async subdivideGrids(
    worker: WorkerSelf & Record<"gridManager", GridManager>,
    gridInfo: { levels: Uint8Array; globalIds: Uint32Array },
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
    const [vertices, verticesLow] = worker.gridManager.createMultiRenderVertices(
      levels,
      globalIds
    );
    const renderInfo: MultiGridRenderInfo = {
      levels,
      globalIds,
      vertices,
      verticesLow,
    };
    return renderInfo;
  }
}
