import { useState, useEffect, useCallback } from 'react';
import { OperatePanelProps, RectangleCoordinates, LayerSize, SubdivideRule } from './types/types';
import proj4 from 'proj4';

// Import utility functions
import { 
  epsgDefinitions, 
  registerCustomEPSG, 
  convertCoordinate, 
  calculateMinimumBoundingRectangle,
  formatCoordinate,
  formatNumber
} from './utils/coordinateUtils';
import { validateLayerHierarchy, calculateSubdivideRules } from './utils/gridUtils';
import { generateJSONData, downloadJSON } from './utils/jsonUtils';

// Import child components
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
export default function OperatePanel({ onDrawRectangle, rectangleCoordinates }: OperatePanelProps) {
  // State management
  const [isDrawing, setIsDrawing] = useState(false);
  const [targetEPSG, setTargetEPSG] = useState('4326');
  const [convertedCoordinates, setConvertedCoordinates] = useState<RectangleCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customEPSG, setCustomEPSG] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [expandedCoordinates, setExpandedCoordinates] = useState<RectangleCoordinates | null>(null);
  const [layers, setLayers] = useState<LayerSize[]>([]);
  const [nextLayerId, setNextLayerId] = useState(1);
  const [subdivideRules, setSubdivideRules] = useState<SubdivideRule[]>([]);
  const [layerErrors, setLayerErrors] = useState<{[key: number]: string}>({});

  // Process rectangle drawing
  const handleDrawRectangle = useCallback(() => {
    setIsDrawing(!isDrawing);
    if (onDrawRectangle) {
      onDrawRectangle();
    }
  }, [isDrawing, onDrawRectangle]);

  // Dynamic registration of EPSG definitions
  useEffect(() => {
    // Pre-register common coordinate systems
    Object.entries(epsgDefinitions).forEach(([code, def]) => {
      registerCustomEPSG(code, def);
    });
  }, []);

  // Execute coordinate conversion
  const handleConvertCoordinates = useCallback(() => {
    setTargetEPSG(customEPSG);
    setIsConverting(true);
  }, [customEPSG]);

  // Execute coordinate conversion when rectangle coordinates or target EPSG changes
  useEffect(() => {
    if (!rectangleCoordinates || !isConverting) {
      return;
    }

    // Try to get custom EPSG definition
    try {
      const epsgCode = `EPSG:${targetEPSG}`;
      const def = proj4.defs(epsgCode);
      
      if (!def && targetEPSG !== '4326') {
        setError(`Cannot find definition for EPSG:${targetEPSG}, please ensure the EPSG code is correct`);
        setConvertedCoordinates(null);
        return;
      }
      
      setError(null);
      
      // Convert all corner coordinates
      const convertedNE = convertCoordinate(rectangleCoordinates.northEast, '4326', targetEPSG);
      const convertedSE = convertCoordinate(rectangleCoordinates.southEast, '4326', targetEPSG);
      const convertedSW = convertCoordinate(rectangleCoordinates.southWest, '4326', targetEPSG);
      const convertedNW = convertCoordinate(rectangleCoordinates.northWest, '4326', targetEPSG);
      const convertedCenter = convertCoordinate(rectangleCoordinates.center, '4326', targetEPSG);

      // Calculate minimum bounding rectangle
      const points = [convertedNE, convertedSE, convertedSW, convertedNW];
      const mbr = calculateMinimumBoundingRectangle(points);
      
      // Ensure center point is based on boundary calculation
      mbr.center = convertedCenter;
      
      setConvertedCoordinates(mbr);
      
      // Expand rectangle (assuming 20% expansion)
      const expandFactor = 0.2;
      const width = Math.abs(mbr.northEast[0] - mbr.northWest[0]);
      const height = Math.abs(mbr.northEast[1] - mbr.southEast[1]);
      
      const expandedWidth = width * (1 + expandFactor);
      const expandedHeight = height * (1 + expandFactor);
      
      const widthDiff = (expandedWidth - width) / 2;
      const heightDiff = (expandedHeight - height) / 2;
      
      const expandedNE: [number, number] = [mbr.northEast[0] + widthDiff, mbr.northEast[1] + heightDiff];
      const expandedSE: [number, number] = [mbr.southEast[0] + widthDiff, mbr.southEast[1] - heightDiff];
      const expandedSW: [number, number] = [mbr.southWest[0] - widthDiff, mbr.southWest[1] - heightDiff];
      const expandedNW: [number, number] = [mbr.northWest[0] - widthDiff, mbr.northWest[1] + heightDiff];
      
      // Convert expanded coordinates back to WGS84
      const expandedNE_WGS84 = convertCoordinate(expandedNE, targetEPSG, '4326');
      const expandedSE_WGS84 = convertCoordinate(expandedSE, targetEPSG, '4326');
      const expandedSW_WGS84 = convertCoordinate(expandedSW, targetEPSG, '4326');
      const expandedNW_WGS84 = convertCoordinate(expandedNW, targetEPSG, '4326');
      const expandedCenter_WGS84 = convertCoordinate(mbr.center, targetEPSG, '4326');
      
      setExpandedCoordinates({
        northEast: expandedNE_WGS84,
        southEast: expandedSE_WGS84,
        southWest: expandedSW_WGS84,
        northWest: expandedNW_WGS84,
        center: expandedCenter_WGS84
      });
    } catch (e) {
      console.error('Coordinate conversion error:', e);
      setError(`Conversion failed: ${e instanceof Error ? e.message : String(e)}`);
      setConvertedCoordinates(null);
      setExpandedCoordinates(null);
    }
  }, [rectangleCoordinates, targetEPSG, isConverting]);

  // Validate layer size against hierarchy
  useEffect(() => {
    const newErrors = validateLayerHierarchy(layers);
    setLayerErrors(newErrors);
  }, [layers]);

  // Calculate subdivide rules based on layer size and rectangle size
  useEffect(() => {
    if (!convertedCoordinates && !rectangleCoordinates) return;
    
    const coords = targetEPSG !== '4326' && convertedCoordinates ? convertedCoordinates : rectangleCoordinates;
    if (!coords) return;
    
    const rules = calculateSubdivideRules(layers, coords);
    setSubdivideRules(rules);
  }, [layers, convertedCoordinates, rectangleCoordinates, targetEPSG]);

  // Layer management methods
  const addLayer = useCallback(() => {
    setLayers([...layers, { id: nextLayerId, width: '', height: '' }]);
    setNextLayerId(nextLayerId + 1);
  }, [layers, nextLayerId]);

  const updateLayerWidth = useCallback((id: number, width: string) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, width } : layer
    ));
  }, [layers]);

  const updateLayerHeight = useCallback((id: number, height: string) => {
    setLayers(layers.map(layer => 
      layer.id === id ? { ...layer, height } : layer
    ));
  }, [layers]);

  const removeLayer = useCallback((id: number) => {
    setLayers(layers.filter(layer => layer.id !== id));
  }, [layers]);

  // Generate JSON data
  const handleGenerateJSON = useCallback(() => {
    // Check if there are layers
    if (layers.length === 0) {
      setError("Please add at least one layer");
      return;
    }
    
    // Get the dimensions of the first layer
    const sortedLayers = [...layers].sort((a, b) => a.id - b.id);
    const firstLayer = sortedLayers[0];
    const firstLayerWidth = parseInt(firstLayer.width) || 0;
    const firstLayerHeight = parseInt(firstLayer.height) || 0;
    
    if (firstLayerWidth === 0 || firstLayerHeight === 0) {
      setError("The width and height of the first layer must be greater than 0");
      return;
    }
    
    // Generate JSON data
    const jsonData = generateJSONData(
      targetEPSG, 
      layers, 
      subdivideRules, 
      rectangleCoordinates || null, 
      convertedCoordinates
    );
    
    // Download JSON file
    if (jsonData) {
      downloadJSON(jsonData);
    } else {
      setError("Unable to generate JSON data");
    }
  }, [layers, targetEPSG, subdivideRules, rectangleCoordinates, convertedCoordinates]);

  return (
    <div className="h-full w-full bg-gray-100 p-4 overflow-y-auto">
      <h1 className="text-4xl font-semibold mb-4 text-center">Grid Operation Panel</h1>
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
            error={error} 
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
        
        {/* Generate JSON button */}
        {rectangleCoordinates && (
          <GenerateJSONButton onClick={handleGenerateJSON} />
        )}
      </div>
    </div>
  );
} 