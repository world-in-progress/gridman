import React, { useEffect, useState, ForwardRefRenderFunction } from 'react'
import mapboxgl from 'mapbox-gl'
import NHMap from './NHMap'
import 'mapbox-gl/dist/mapbox-gl.css'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { RectangleCoordinates } from '../operatePanel/operatePanel'

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
          viewMode == 'Dark'
            ? 'mapbox://styles/ycsoku/cm3zhjxbs00pa01sd6hx7grtr'
            : 'mapbox://styles/mapbox/light-v10',
        center: [initialLongitude, initialLatitude],
        zoom: initialZoom,
        maxZoom: maxZoom
      })

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
              'circle-stroke-color': '#FFFF00'
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
              'line-color': '#FFFF00',
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
              'fill-opacity': 0.7
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
              'fill-opacity': 1
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
        console.log('Drawing completed:', e.features);
        
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
        console.log('Drawing mode changed:', e.mode);
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
        viewMode == 'Dark'
          ? 'mapbox://styles/ycsoku/cm3zhjxbs00pa01sd6hx7grtr'
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

  React.useImperativeHandle(
    ref,
    () => ({
      startDrawRectangle
    })
  );

  return <div id="map-container" className="w-full h-full" />
}

export default React.forwardRef(MapInit)
