import GridManager from '../grid/NHGridManager';
import { SubdivideRules } from '../grid/NHGrid';
import { Callback, WorkerSelf } from '../types';

export function checkIfReady(
  this: WorkerSelf,
  _: unknown,
  callback: Callback<any>
) {
  callback();
}

export function init(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  subdivideRules: SubdivideRules,
  callback: Callback<any>
) {
  this.nodeManager = new GridManager(subdivideRules);
  callback();
}

export function updateSubdividerules(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  subdivideRules: SubdivideRules,
  callback: Callback<any>
) {
  this.nodeManager.subdivideRules = subdivideRules;
  callback();
}

export async function subdivideGrid(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  [level, globalId]: [level: number, globalId: number],
  callback: Callback<any>
) {
  callback(null, this.nodeManager.subdivideGrid(level, globalId));
}

export async function subdivideGrids(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  subdivideInfos: Array<[level: number, globalId: number]>,
  callback: Callback<any>
) {
  callback(null, this.nodeManager.subdivideGrids(subdivideInfos));
}

export async function parseTopology(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  storageId_gridInfo_cache: Array<number>,
  callback: Callback<any>
) {
  callback(null, this.nodeManager.parseTopology(storageId_gridInfo_cache));
}

export async function calcEdgeRenderInfos(
  this: WorkerSelf & Record<'nodeManager', GridManager>,
  edgeInfos: { index: number; keys: string[] },
  callback: Callback<any>
) {
  const { index: actorIndex, keys: edgeKeys } = edgeInfos;
  callback(null, {
    actorIndex,
    vertexBuffer: this.nodeManager.getEdgeRenderInfos(edgeKeys),
  });
}

export async function initializeGrid(
  this: WorkerSelf,
  jsonData: any,
  callback: Callback<any>
) {
  if (!jsonData) {
    callback(new Error('No JSON data provided'), false);
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/grid/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(jsonData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();

    callback(null, responseData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function createSchema(
  this: WorkerSelf,
  schemaData: any,
  callback: Callback<any>
) {
  if (!schemaData) {
    callback(new Error('无数据提供'), false);
    return;
  }

  try {
    const response = await fetch('http://localhost:8000/schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(schemaData),
    });

    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const responseData = await response.json();

    callback(null, responseData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}

export async function fetchSchemas(
  this: WorkerSelf,
  params: { startIndex: number; endIndex: number },
  callback: Callback<any>
) {
  try {
    const { startIndex, endIndex } = params;
    const response = await fetch(
      `http://localhost:8000/schemas/?startIndex=${startIndex}&endIndex=${endIndex}`
    );

    if (!response.ok) {
      throw new Error(`HTTP错误! 状态码: ${response.status}`);
    }

    const responseData = await response.json();
    try {
      const countResponse = await fetch('http://localhost:8000/schemas/num');

      if (countResponse.ok) {
        const countText = await countResponse.text();

        try {
          const countData = JSON.parse(countText);

          if (typeof countData.count === 'number') {
            responseData.total_count = countData.count;
          } else if (typeof countData === 'number') {
            responseData.total_count = countData;
          } else if (countData && typeof countData.total === 'number') {
            responseData.total_count = countData.total;
          } else {
            const possibleCountFields = Object.entries(countData).find(
              ([key, value]) =>
                typeof value === 'number' &&
                (key.includes('count') ||
                  key.includes('total') ||
                  key.includes('num'))
            );

            if (possibleCountFields) {
              responseData.total_count = possibleCountFields[1] as number;
            } else {
              const numericValue = parseInt(countText.trim(), 10);
              if (!isNaN(numericValue)) {
                responseData.total_count = numericValue;
              } else {
                responseData.total_count = responseData.grid_schemas.length;
              }
            }
          }
        } catch (parseError) {
          const numericValue = parseInt(countText.trim(), 10);
          if (!isNaN(numericValue)) {
            responseData.total_count = numericValue;
          } else {
            responseData.total_count = responseData.grid_schemas.length;
          }
        }
      } else {
        responseData.total_count = responseData.grid_schemas.length;
      }
    } catch (error) {
      responseData.total_count = responseData.grid_schemas.length;
    }
    if (responseData.total_count < responseData.grid_schemas.length) {
      responseData.total_count = responseData.grid_schemas.length;
    }

    callback(null, responseData);
  } catch (error) {
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}
