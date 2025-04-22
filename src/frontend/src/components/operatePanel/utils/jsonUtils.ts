import { LayerSize, SubdivideRule, RectangleCoordinates } from '../types/types';
import WorkerPool from '../../../core/worker/workerPool';
import Actor from '../../../core/message/actor';

export const generateJSONData = (
  targetEPSG: string,
  layers: LayerSize[],
  subdivideRules: SubdivideRule[],
  rectangleCoordinates: RectangleCoordinates | null,
  convertedCoordinates: RectangleCoordinates | null
) => {
  const sortedLayers = [...layers].sort((a, b) => a.id - b.id);
  const sortedRules = [...subdivideRules].sort((a, b) => a.id - b.id);

  const coords =
    targetEPSG !== '4326' && convertedCoordinates
      ? convertedCoordinates
      : rectangleCoordinates;
  if (!coords) return null;

  const adjustedBounds = [
    coords.southWest[0],
    coords.southWest[1],
    coords.northEast[0],
    coords.northEast[1],
  ];

  const subdivideRulesArray = [];

  const firstRule = sortedRules[0];
  if (firstRule && firstRule.cols > 0 && firstRule.rows > 0) {
    subdivideRulesArray.push([firstRule.cols, firstRule.rows]);
    
    if (sortedLayers.length === 1) {
      subdivideRulesArray.push([1, 1]);
    } else {
      for (let i = 1; i < sortedLayers.length; i++) {
        if (i < sortedRules.length) {
          const rule = sortedRules[i];
          if (rule && rule.xRatio > 0 && rule.yRatio > 0) {
            if (i === sortedLayers.length - 1) {
              subdivideRulesArray.push([1, 1]);
            } else {
              subdivideRulesArray.push([
                Math.round(rule.xRatio),
                Math.round(rule.yRatio),
              ]);
            }
          }
        }
      }
    }
  }

  const firstLayer = sortedLayers[0];
  if (!firstLayer) return null;

  return {
    epsg: targetEPSG === '4326' ? 4326 : parseInt(targetEPSG),
    bounds: [
      adjustedBounds[0], // minx (adjusted)
      adjustedBounds[1], // miny (adjusted)
      adjustedBounds[2], // maxx (adjusted)
      adjustedBounds[3], // maxy (adjusted)
    ],
    first_size: [
      parseInt(firstLayer.width) || 0,
      parseInt(firstLayer.height) || 0,
    ],
    subdivide_rules: subdivideRulesArray,
  };
};

export const downloadJSON = (jsonData: any) => {
  if (!jsonData) return false;
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'schema.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return true;
};

if (!WorkerPool.workerCount) {
  WorkerPool.workerCount = 4;
  WorkerPool.extensions = [];
}

export const sendJSONToInit = async (jsonData: any) => {
  if (!jsonData) return false;

  return new Promise((resolve) => {
    const workerId = 'json-init-worker';
    const workers = WorkerPool.instance.acquire(workerId);
    if (workers.length === 0) {
      console.error('No worker available');
      resolve(false);
      return;
    }

    const worker = workers[0];
    const actor = new Actor(worker, worker);

    actor.send(
      'initializeGrid',
      jsonData,
      (error?: Error | null, result?: any) => {
        WorkerPool.instance.release(workerId);

        if (error) {
          console.error('Error sending JSON to init endpoint:', error);
          resolve(false);
        } else {
          resolve(result);
        }
      }
    );
  });
};
