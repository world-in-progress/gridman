import React, { useEffect, useState, ForwardRefRenderFunction } from 'react'
import mapboxgl from 'mapbox-gl'
import NHMap from './NHMap'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { RectangleCoordinates } from '../operatePanel/operatePanel'
import GridLayer from './layers/GridLayer'
import NHLayerGroup from './NHLayerGroup'

// Import rectangle drawing mode
// @ts-ignore
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode';

interface MapInitProps {
  initialLongitude?: number
  initialLatitude?: number
  initialZoom?: number
  maxZoom?: number
  viewMode?: string
  onRectangleDrawn?: (coordinates: RectangleCoordinates) => void
}

interface MapInitHandle {
  startDrawRectangle: () => void;
}

const MapInit: ForwardRefRenderFunction<MapInitHandle, MapInitProps> = ({
  initialLongitude = 114.051537,
  initialLatitude = 22.446937,
  initialZoom = 11,
  maxZoom = 22,
  viewMode = 'Dark',
  onRectangleDrawn
}, ref) => {
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [draw, setDraw] = useState<MapboxDraw | null>(null)
  const [isDrawMode, setIsDrawMode] = useState(false)
  const [hasDrawnRectangle, setHasDrawnRectangle] = useState(false)
  const [currentRectangleId, setCurrentRectangleId] = useState<string | null>(null)

  // Calculate the four corners and center point of the rectangle (EPSG:4326)
  const calculateRectangleCoordinates = (feature: any): RectangleCoordinates => {
    const coordinates = feature.geometry.coordinates[0];
    
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    
    coordinates.forEach((coord: [number, number]) => {
      if (coord[0] < minLng) minLng = coord[0];
      if (coord[0] > maxLng) maxLng = coord[0];
      if (coord[1] < minLat) minLat = coord[1];
      if (coord[1] > maxLat) maxLat = coord[1];
    });
    
    const northEast: [number, number] = [maxLng, maxLat];
    const southEast: [number, number] = [maxLng, minLat];
    const southWest: [number, number] = [minLng, minLat];
    const northWest: [number, number] = [minLng, maxLat];
    const center: [number, number] = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];
    
    return {
      northEast,
      southEast,
      southWest,
      northWest,
      center
    };
  };

  useEffect(() => {
    mapboxgl.accessToken =
      'pk.eyJ1IjoieWNzb2t1IiwiYSI6ImNrenozdWdodDAza3EzY3BtdHh4cm5pangifQ.ZigfygDi2bK4HXY1pWh-wg'

    const initializeMap = () => {
      const mapInstance = new NHMap({
        container: 'map-container',
        style:
          viewMode === 'light'
            ? 'mapbox://styles/mapbox/light-v10'
            : 'mapbox://styles/mapbox/dark-v10',
        center: [initialLongitude, initialLatitude],
        zoom: initialZoom,
        maxZoom: maxZoom
      })

      // 将地图实例存储为全局可访问的变量
      window.mapInstance = mapInstance;

      // Initialize drawing tool
      const drawInstance = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          trash: true
        },
        modes: {
          ...MapboxDraw.modes,
          draw_rectangle: DrawRectangle,
        },
        // Set style
        styles: [
          // Default point style
          {
            'id': 'gl-draw-point',
            'type': 'circle',
            'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
            'paint': {
              'circle-radius': 5,
              'circle-color': '#fff',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF'
            }
          },
          {
            'id': 'gl-draw-line',
            'type': 'line',
            'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#FFFFFF',
              'line-width': 3
            }
          },
          {
            'id': 'gl-draw-polygon-fill',
            'type': 'fill',
            'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            'paint': {
              'fill-color': '#FFFF00',
              'fill-outline-color': '#FFFF00',
              'fill-opacity': 0.5
            }
          },
          {
            'id': 'gl-draw-polygon-stroke',
            'type': 'line',
            'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#FFFF00',
              'line-width': 3
            }
          },
          {
            'id': 'gl-draw-polygon-fill-static',
            'type': 'fill',
            'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
            'paint': {
              'fill-color': '#FFFF00',
              'fill-outline-color': '#FFFF00',
              'fill-opacity': 0.5
            }
          },
          {
            'id': 'gl-draw-polygon-stroke-static',
            'type': 'line',
            'filter': ['all', ['==', '$type', 'Polygon'], ['==', 'mode', 'static']],
            'layout': {
              'line-cap': 'round',
              'line-join': 'round'
            },
            'paint': {
              'line-color': '#FFFF00',
              'line-dasharray': [2, 2],
              'line-width': 3.5
            }
          }
        ]
      });
      
      mapInstance.addControl(drawInstance);
      
      // Event handler after drawing completion
      mapInstance.on('draw.create', (e: any) => {
        if (e.features && e.features.length > 0) {
          const feature = e.features[0];
          setIsDrawMode(false);
          setHasDrawnRectangle(true);
          setCurrentRectangleId(feature.id);
          
          const rectangleCoordinates = calculateRectangleCoordinates(feature);
          if (onRectangleDrawn) {
            onRectangleDrawn(rectangleCoordinates);
          }
        }
      });
      
      // Delete shape event
      mapInstance.on('draw.delete', (e: any) => {
        console.log('Deleting shape');
        setHasDrawnRectangle(false);
        setCurrentRectangleId(null);
        
        if (onRectangleDrawn) {
          onRectangleDrawn(null as any);
        }
      });

      // Monitor mode changes
      mapInstance.on('draw.modechange', (e: any) => {
        // console.log('Drawing mode changed:', e.mode);
        setIsDrawMode(e.mode === 'draw_rectangle');
      });

      setMap(mapInstance)
      setDraw(drawInstance)

      return (): void => {
        mapInstance.remove()
      }
    }

    if (!map) {
      initializeMap()
    } else {
      map.setStyle(
        viewMode === 'Dark'
          ? 'mapbox://styles/mapbox/dark-v10'
          : 'mapbox://styles/mapbox/light-v10'
      )
    }
  }, [viewMode, onRectangleDrawn])

  // Method to start drawing rectangle
  const startDrawRectangle = () => {
    if (!draw) return;
    
    if (hasDrawnRectangle) {
      // If a rectangle already exists, delete it first
      draw.deleteAll();
      setHasDrawnRectangle(false);
      setCurrentRectangleId(null);
      
      if (onRectangleDrawn) {
        onRectangleDrawn(null as any);
      }
    }
    
    // Switch to rectangle drawing mode
    if (!isDrawMode) {
      draw.changeMode('draw_rectangle');
    } else {
      // If already in drawing mode, cancel drawing
      draw.changeMode('simple_select');
    }
  };

  // 添加创建网格的函数
  const createGridFromRectangle = (mapInstance: NHMap, coords: RectangleCoordinates) => {
    // 从矩形坐标创建边界条件
    const boundaryCondition = [
      coords.southWest[0],  // xMin
      coords.southWest[1],  // yMin
      coords.northEast[0],  // xMax
      coords.northEast[1]   // yMax
    ];
    
    // 默认的第一层大小和分割规则 (可以根据需要调整)
    const firstLevelSize: [number, number] = [100, 100]; // 默认大小，单位为米
    const subdivideRules: [number, number][] = [[2, 2]]; // 默认规则：每个网格分为2x2
    
    // 创建网格图层
    const gridLayer = new GridLayer(
      mapInstance,
      'EPSG:4326', // 默认使用WGS84坐标系
      firstLevelSize,
      subdivideRules,
      boundaryCondition as [number, number, number, number],
      { maxGridNum: 4096 } // 可选配置
    );
    
    // 创建图层组并添加网格图层
    const layerGroup = new NHLayerGroup();
    layerGroup.addLayer(gridLayer);
    
    // 添加图层组到地图
    const layerGroupId = 'grid-layer-group';
    if (mapInstance.getLayer(layerGroupId)) {
      mapInstance.removeLayer(layerGroupId);
    }
    
    layerGroup.id = layerGroupId;
    mapInstance.addLayer(layerGroup);
  };

  React.useImperativeHandle(
    ref,
    () => ({
      startDrawRectangle
    })
  );

  return <div id="map-container" className="w-full h-full">
    <div id="control-panel-container" className="absolute top-4 left-4 z-10"></div>
  </div>
}

export default React.forwardRef(MapInit)
