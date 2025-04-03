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
    console.log('Using worker for grid initialization...');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const responseData = await response.json();
    console.log('Worker received data:', responseData);
    console.log('Worker received data type:', typeof responseData);
    console.log('Worker received data keys:', Object.keys(responseData));
    console.log('Worker received JSON string:', JSON.stringify(responseData, null, 2));
    
    callback(null, responseData);
  } catch (error) {
    console.error('Error sending JSON to init endpoint:', error);
    callback(error instanceof Error ? error : new Error(String(error)), false);
  }
}
