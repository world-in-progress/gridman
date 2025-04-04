import { useState, useEffect, useCallback } from 'react';
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
} from './utils/coordinateUtils';
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

export type { RectangleCoordinates } from './types/types';

/**
 * Operation Panel Component
 * Integrates all child components, provides rectangle drawing, coordinate conversion, layer settings and JSON generation functions
 */
export default function OperatePanel({
  onDrawRectangle,
  rectangleCoordinates,
}: OperatePanelProps) {
  const [isDrawing, setIsDrawing] = useState(false);
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

  const handleDrawRectangle = useCallback(() => {
    setIsDrawing(!isDrawing);
    if (onDrawRectangle) {
      onDrawRectangle();
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
          `Cannot find definition for EPSG:${targetEPSG}, please ensure the EPSG code is correct`
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
  }, [rectangleCoordinates, targetEPSG, isConverting]);

  useEffect(() => {
    const newErrors = validateLayerHierarchy(layers);
    setLayerErrors(newErrors);
  }, [layers]);

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
      setGeneralError('Please add at least one layer');
      return;
    }

    const sortedLayers = [...layers].sort((a, b) => a.id - b.id);
    const firstLayer = sortedLayers[0];
    const firstLayerWidth = parseInt(firstLayer.width) || 0;
    const firstLayerHeight = parseInt(firstLayer.height) || 0;

    if (firstLayerWidth === 0 || firstLayerHeight === 0) {
      setGeneralError(
        'The width and height of the first layer must be greater than 0'
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
        console.log('Response from sendJSONToInit:', response);
        
        if (!response) {
          setGeneralError('Failed to send JSON data to init endpoint');
        } else {
          // 处理成功响应
          setGeneralError(null);
          console.log('Successfully initialized grid with response:', response);
        }
      } catch (error) {
        console.error('Error in handleGenerateJSON:', error);
        setGeneralError(`Error: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      setGeneralError('Unable to generate JSON data');
    }
  }, [
    layers,
    targetEPSG,
    subdivideRules,
    rectangleCoordinates,
    convertedCoordinates,
  ]);

  return (
    <div className="h-full w-full bg-gray-100 p-4 overflow-y-auto">
      <h1 className="text-4xl font-semibold mb-4 text-center">
        Grid Operation Panel
      </h1>
      <div className="space-y-4">
        {/* Draw button */}
        <DrawButton
          isDrawing={isDrawing}
          rectangleCoordinates={rectangleCoordinates}
          onClick={handleDrawRectangle}
        />

        {/* Rectangle WGS84 coordinate box */}
        {rectangleCoordinates && (
          <CoordinateBox
            title="Rectangle Coordinates (EPSG:4326)"
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
        {convertedCoordinates && targetEPSG !== '4326' && (
          <CoordinateBox
            title={`Converted Coordinates (EPSG:${targetEPSG})`}
            coordinates={convertedCoordinates}
            formatCoordinate={formatCoordinate}
          />
        )}

        {/* Expanded rectangle WGS84 coordinate box */}
        {expandedCoordinates && targetEPSG !== '4326' && (
          <CoordinateBox
            title="Expanded Coordinates (EPSG:4326)"
            coordinates={expandedCoordinates}
            formatCoordinate={formatCoordinate}
          />
        )}

        {/* Grid level section */}
        {rectangleCoordinates && (
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
      </div>
    </div>
  );
}
