import { useState, useEffect, useCallback, useContext } from 'react';
import {
  OperatePanelProps,
  RectangleCoordinates,
  LayerSize,
  SubdivideRule,
} from './types/types';
import proj4 from 'proj4';
import {
  epsgDefinitions,
  registerCustomEPSG,
  convertCoordinate,
  calculateMinimumBoundingRectangle,
  formatCoordinate,
  formatNumber,
} from '../../core/util/coordinateUtils';
import {
  validateLayerHierarchy,
  calculateSubdivideRules,
} from './utils/gridUtils';
import {
  generateJSONData,
  downloadJSON,
  sendJSONToInit,
} from './utils/jsonUtils';
import DrawButton from './components/DrawButton';
import CoordinateBox from './components/CoordinateBox';
import EPSGInput from './components/EPSGInput';
import GridLevel from './components/GridLevel';
import SubdivideRules from './components/SubdivideRules';
import GenerateJSONButton from './components/GenerateJSONButton';
import DrawGridButton from './components/DrawGridButton';
import NHLayerGroup from '../mapComponent/utils/NHLayerGroup';
import { Map } from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { LanguageContext } from '../../context';

// Add mapInstance property to window object
declare global {
  interface Window {
    mapInstance?: Map;
    mapboxDrawInstance?: MapboxDraw;
  }
}

export type { RectangleCoordinates } from './types/types';

export default function OperatePanel({
  onDrawRectangle,
  rectangleCoordinates,
  isDrawing = false,
}: OperatePanelProps) {
  const { language } = useContext(LanguageContext);
  const [targetEPSG, setTargetEPSG] = useState('4326');
  const [convertedCoordinates, setConvertedCoordinates] =
    useState<RectangleCoordinates | null>(null);
  const [epsgError, setEpsgError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [customEPSG, setCustomEPSG] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [expandedCoordinates, setExpandedCoordinates] =
    useState<RectangleCoordinates | null>(null);
  const [layers, setLayers] = useState<LayerSize[]>([]);
  const [nextLayerId, setNextLayerId] = useState(1);
  const [subdivideRules, setSubdivideRules] = useState<SubdivideRule[]>([]);
  const [layerErrors, setLayerErrors] = useState<{ [key: number]: string }>({});

  const translations = {
    pageTitle: {
      en: 'Grid Operation Panel',
      zh: '网格操作面板',
    },
    coordinates: {
      wgs84: {
        en: 'Rectangle Coordinates (EPSG:4326)',
        zh: '矩形坐标 (EPSG:4326)',
      },
      converted: {
        en: `Converted Coordinates (EPSG:${targetEPSG})`,
        zh: `转换后的坐标 (EPSG:${targetEPSG})`,
      },
      expanded: {
        en: 'Expanded Coordinates (EPSG:4326)',
        zh: '扩展后的坐标 (EPSG:4326)',
      },
    },
    epsg: {
      error: {
        notFound: {
          en: `Cannot find definition for EPSG:${targetEPSG}, please ensure the EPSG code is correct`,
          zh: `找不到EPSG:${targetEPSG}的定义，请确保EPSG代码正确`,
        },
      },
    },
    gridLevel: {
      addLevel: {
        en: 'Add Level',
        zh: '添加层级',
      },
    },
    error: {
      addLayer: {
        en: 'Please add at least one layer',
        zh: '请至少添加一个层级',
      },
      firstLayer: {
        en: 'The width and height of the first layer must be greater than 0',
        zh: '第一层的宽度和高度必须大于0',
      },
      jsonData: {
        en: 'Unable to generate JSON data',
        zh: '无法生成JSON数据',
      },
      sendJson: {
        en: 'Failed to send JSON data to init endpoint',
        zh: '无法将JSON数据发送到初始化端点',
      },
      mapInstance: {
        en: 'Unable to get map instance',
        zh: '无法获取地图实例',
      },
      gridData: {
        en: 'Unable to generate grid data',
        zh: '无法生成网格数据',
      },
      gridLevel: {
        en: 'Please add at least one grid level',
        zh: '请至少添加一个网格层级',
      },
    },
  };

  const handleDrawRectangle = useCallback(() => {
    if (onDrawRectangle) {
      onDrawRectangle(isDrawing);
    }
  }, [isDrawing, onDrawRectangle]);

  useEffect(() => {
    Object.entries(epsgDefinitions).forEach(([code, def]) => {
      registerCustomEPSG(code, def);
    });
  }, []);

  const handleConvertCoordinates = useCallback(() => {
    setTargetEPSG(customEPSG);
    setIsConverting(true);
  }, [customEPSG]);

  useEffect(() => {
    if (!rectangleCoordinates || !isConverting) {
      return;
    }

    try {
      const epsgCode = `EPSG:${targetEPSG}`;
      const def = proj4.defs(epsgCode);

      if (!def && targetEPSG !== '4326') {
        setEpsgError(
          language === 'zh'
            ? translations.epsg.error.notFound.zh
            : translations.epsg.error.notFound.en
        );
        setConvertedCoordinates(null);
        return;
      }

      setEpsgError(null);

      const convertedNE = convertCoordinate(
        rectangleCoordinates.northEast,
        '4326',
        targetEPSG
      );
      const convertedSE = convertCoordinate(
        rectangleCoordinates.southEast,
        '4326',
        targetEPSG
      );
      const convertedSW = convertCoordinate(
        rectangleCoordinates.southWest,
        '4326',
        targetEPSG
      );
      const convertedNW = convertCoordinate(
        rectangleCoordinates.northWest,
        '4326',
        targetEPSG
      );
      const convertedCenter = convertCoordinate(
        rectangleCoordinates.center,
        '4326',
        targetEPSG
      );

      const points = [convertedNE, convertedSE, convertedSW, convertedNW];
      const mbr = calculateMinimumBoundingRectangle(points);

      mbr.center = convertedCenter;

      setConvertedCoordinates(mbr);

      const expandFactor = 0.2;
      const width = Math.abs(mbr.northEast[0] - mbr.northWest[0]);
      const height = Math.abs(mbr.northEast[1] - mbr.southEast[1]);

      const expandedWidth = width * (1 + expandFactor);
      const expandedHeight = height * (1 + expandFactor);

      const widthDiff = (expandedWidth - width) / 2;
      const heightDiff = (expandedHeight - height) / 2;

      const expandedNE: [number, number] = [
        mbr.northEast[0] + widthDiff,
        mbr.northEast[1] + heightDiff,
      ];
      const expandedSE: [number, number] = [
        mbr.southEast[0] + widthDiff,
        mbr.southEast[1] - heightDiff,
      ];
      const expandedSW: [number, number] = [
        mbr.southWest[0] - widthDiff,
        mbr.southWest[1] - heightDiff,
      ];
      const expandedNW: [number, number] = [
        mbr.northWest[0] - widthDiff,
        mbr.northWest[1] + heightDiff,
      ];

      const expandedNE_WGS84 = convertCoordinate(
        expandedNE,
        targetEPSG,
        '4326'
      );
      const expandedSE_WGS84 = convertCoordinate(
        expandedSE,
        targetEPSG,
        '4326'
      );
      const expandedSW_WGS84 = convertCoordinate(
        expandedSW,
        targetEPSG,
        '4326'
      );
      const expandedNW_WGS84 = convertCoordinate(
        expandedNW,
        targetEPSG,
        '4326'
      );
      const expandedCenter_WGS84 = convertCoordinate(
        mbr.center,
        targetEPSG,
        '4326'
      );

      setExpandedCoordinates({
        northEast: expandedNE_WGS84,
        southEast: expandedSE_WGS84,
        southWest: expandedSW_WGS84,
        northWest: expandedNW_WGS84,
        center: expandedCenter_WGS84,
      });
    } catch (e) {
      console.error('Coordinate conversion error:', e);
      setEpsgError(
        `Conversion failed: ${e instanceof Error ? e.message : String(e)}`
      );
      setConvertedCoordinates(null);
      setExpandedCoordinates(null);
    }
  }, [rectangleCoordinates, targetEPSG, isConverting, language]);

  useEffect(() => {
    const newErrors = validateLayerHierarchy(layers, language);
    setLayerErrors(newErrors);
  }, [layers, language]);

  useEffect(() => {
    if (!convertedCoordinates && !rectangleCoordinates) return;

    const coords =
      targetEPSG !== '4326' && convertedCoordinates
        ? convertedCoordinates
        : rectangleCoordinates;
    if (!coords) return;

    const rules = calculateSubdivideRules(layers, coords);
    setSubdivideRules(rules);
  }, [layers, convertedCoordinates, rectangleCoordinates, targetEPSG]);

  const addLayer = useCallback(() => {
    setLayers([...layers, { id: nextLayerId, width: '', height: '' }]);
    setNextLayerId(nextLayerId + 1);
  }, [layers, nextLayerId]);

  const updateLayerWidth = useCallback(
    (id: number, width: string) => {
      setLayers(
        layers.map((layer) => (layer.id === id ? { ...layer, width } : layer))
      );
    },
    [layers]
  );

  const updateLayerHeight = useCallback(
    (id: number, height: string) => {
      setLayers(
        layers.map((layer) => (layer.id === id ? { ...layer, height } : layer))
      );
    },
    [layers]
  );

  const removeLayer = useCallback(
    (id: number) => {
      setLayers(layers.filter((layer) => layer.id !== id));
    },
    [layers]
  );

  const handleGenerateJSON = useCallback(async () => {
    if (layers.length === 0) {
      setGeneralError(
        language === 'zh'
          ? translations.error.addLayer.zh
          : translations.error.addLayer.en
      );
      return;
    }

    const sortedLayers = [...layers].sort((a, b) => a.id - b.id);
    const firstLayer = sortedLayers[0];
    const firstLayerWidth = parseInt(firstLayer.width) || 0;
    const firstLayerHeight = parseInt(firstLayer.height) || 0;

    if (firstLayerWidth === 0 || firstLayerHeight === 0) {
      setGeneralError(
        language === 'zh'
          ? translations.error.firstLayer.zh
          : translations.error.firstLayer.en
      );
      return;
    }

    const jsonData = generateJSONData(
      targetEPSG,
      layers,
      subdivideRules,
      rectangleCoordinates || null,
      convertedCoordinates
    );

    if (jsonData) {
      downloadJSON(jsonData);

      try {
        const response = await sendJSONToInit(jsonData);

        if (!response) {
          setGeneralError(
            language === 'zh'
              ? translations.error.sendJson.zh
              : translations.error.sendJson.en
          );
        } else {
          setGeneralError(null);
        }
      } catch (error) {
        console.error('Error in handleGenerateJSON:', error);
        setGeneralError(
          `Error: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else {
      setGeneralError(
        language === 'zh'
          ? translations.error.jsonData.zh
          : translations.error.jsonData.en
      );
    }
  }, [
    targetEPSG,
    layers,
    subdivideRules,
    rectangleCoordinates,
    convertedCoordinates,
    language,
  ]);

  const createTopologyLayer = (
    map: Map,
    config: {
      epsg: number | string;
      boundaryCondition: [number, number, number, number];
      firstLevelSize: [number, number];
      subdivideRules: [number, number][];
    }
  ) => {
    const layerGroupId = 'grid-layer-group';

    try {
      if (map.getLayer(layerGroupId)) {
        map.removeLayer(layerGroupId);
      }
      if (map.getSource(layerGroupId)) {
        map.removeSource(layerGroupId);
      }
    } catch (error) {}

    // const topologyLayer = new GridLayer(
    //   map,
    //   `EPSG:${config.epsg}`,
    //   config.firstLevelSize,
    //   config.subdivideRules,
    //   config.boundaryCondition,
    //   { maxGridNum: 4096 * 4096 }
    // );

    const layerGroup = new NHLayerGroup();
    layerGroup.id = layerGroupId;
    // layerGroup.addLayer(topologyLayer);
    map.addLayer(layerGroup);
  };

  const handleDrawGrid = useCallback(() => {
    if (layers.length === 0) {
      setGeneralError(
        language === 'zh'
          ? translations.error.gridLevel.zh
          : translations.error.gridLevel.en
      );
      return;
    }

    const sortedLayers = [...layers].sort((a, b) => a.id - b.id);
    const firstLayer = sortedLayers[0];
    const firstLayerWidth = parseInt(firstLayer.width) || 0;
    const firstLayerHeight = parseInt(firstLayer.height) || 0;

    if (firstLayerWidth === 0 || firstLayerHeight === 0) {
      setGeneralError(
        language === 'zh'
          ? translations.error.firstLayer.zh
          : translations.error.firstLayer.en
      );
      return;
    }

    const jsonData = generateJSONData(
      targetEPSG,
      layers,
      subdivideRules,
      rectangleCoordinates || null,
      convertedCoordinates
    );

    if (jsonData) {
      const map = window.mapInstance;
      if (map) {
        const gridConfig = {
          epsg: jsonData.epsg,
          boundaryCondition: jsonData.bounds as [
            number,
            number,
            number,
            number
          ],
          firstLevelSize: jsonData.first_size as [number, number],
          subdivideRules: jsonData.subdivide_rules as [number, number][],
        };

        createTopologyLayer(map, gridConfig);
        setGeneralError(null);

        try {
          if (window.mapboxDrawInstance) {
            window.mapboxDrawInstance.deleteAll();
          }
        } catch (error) {
          console.error('Failed to remove rectangle:', error);
        }
      } else {
        setGeneralError(
          language === 'zh'
            ? translations.error.mapInstance.zh
            : translations.error.mapInstance.en
        );
      }
    } else {
      setGeneralError(
        language === 'zh'
          ? translations.error.gridData.zh
          : translations.error.gridData.en
      );
    }
  }, [
    targetEPSG,
    layers,
    subdivideRules,
    rectangleCoordinates,
    convertedCoordinates,
    language,
  ]);

  return (
    <div className="h-full w-full bg-gray-100 p-4 overflow-y-auto">
      <h1 className="text-4xl font-semibold mb-4 text-center">
        {language === 'zh'
          ? translations.pageTitle.zh
          : translations.pageTitle.en}
      </h1>
      <div className="space-y-1">
        {/* Draw button */}
        <DrawButton
          isDrawing={isDrawing}
          rectangleCoordinates={rectangleCoordinates}
          onClick={handleDrawRectangle}
        />

        {/* Rectangle WGS84 coordinate box */}
        {rectangleCoordinates && (
          <CoordinateBox
            title={
              language === 'zh'
                ? translations.coordinates.wgs84.zh
                : translations.coordinates.wgs84.en
            }
            coordinates={rectangleCoordinates}
            formatCoordinate={formatCoordinate}
          />
        )}

        {/* Target EPSG input box */}
        {rectangleCoordinates && (
          <EPSGInput
            customEPSG={customEPSG}
            error={epsgError}
            rectangleCoordinates={rectangleCoordinates}
            onEpsgChange={setCustomEPSG}
            onConvert={handleConvertCoordinates}
          />
        )}

        {/* Converted rectangle coordinate box */}
        {convertedCoordinates &&
          targetEPSG !== '4326' &&
          rectangleCoordinates && (
            <CoordinateBox
              title={
                language === 'zh'
                  ? translations.coordinates.converted.zh
                  : translations.coordinates.converted.en
              }
              coordinates={convertedCoordinates}
              formatCoordinate={formatCoordinate}
            />
          )}

        {/* Expanded rectangle WGS84 coordinate box */}
        {expandedCoordinates &&
          targetEPSG !== '4326' &&
          rectangleCoordinates && (
            <CoordinateBox
              title={
                language === 'zh'
                  ? translations.coordinates.expanded.zh
                  : translations.coordinates.expanded.en
              }
              coordinates={expandedCoordinates}
              formatCoordinate={formatCoordinate}
            />
          )}

        {/* Grid level section */}
        {rectangleCoordinates && convertedCoordinates && (
          <GridLevel
            layers={layers}
            layerErrors={layerErrors}
            onAddLayer={addLayer}
            onUpdateWidth={updateLayerWidth}
            onUpdateHeight={updateLayerHeight}
            onRemoveLayer={removeLayer}
          />
        )}

        {/* Subdivide rules section */}
        {rectangleCoordinates && layers.length > 0 && (
          <SubdivideRules
            subdivideRules={subdivideRules}
            layers={layers}
            formatNumber={formatNumber}
            language={language}
          />
        )}

        {/* General error message */}
        {generalError && (
          <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded-md border border-red-200">
            {generalError}
          </div>
        )}

        {/* Generate JSON button */}
        {rectangleCoordinates && (
          <GenerateJSONButton onClick={handleGenerateJSON} />
        )}

        {/* Draw Grid button */}
        {rectangleCoordinates && layers.length > 0 && (
          <DrawGridButton onClick={handleDrawGrid} />
        )}
      </div>
    </div>
  );
}
