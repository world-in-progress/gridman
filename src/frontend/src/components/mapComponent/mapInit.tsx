import React, { useEffect, useState, ForwardRefRenderFunction, useContext } from 'react';
import mapboxgl from 'mapbox-gl';
import NHMap from './utils/NHMap';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { RectangleCoordinates } from '../operatePanel/operatePanel';
import { CustomLayer } from './layers/customLayer';
import ThreejsSceneLayer from './threejs/threejs-scene';
// Import rectangle drawing mode
// @ts-ignore
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode';
import GLMapRectangleLayer from './layers/glMapRectangleLayer';
import CustomRectangleDraw from './layers/customRectangleDraw';
import ProjectBoundsLayer from './layers/projectBoundsLayer';
import { convertCoordinate } from '../../core/util/coordinateUtils';
import { generateRandomHexColor } from '../../utils/colorUtils';
import { ProjectService } from '../projectPanel/utils/ProjectService';
import { LanguageContext } from '../../context';
import { SubprojectBoundsManager } from './layers/subprojectBoundsManager';

// Add mapInstance property to window object
declare global {
    interface Window {
        mapInstance?: mapboxgl.Map;
        mapboxDrawInstance?: MapboxDraw;
    }
}

interface MapInitProps {
    initialLongitude?: number;
    initialLatitude?: number;
    initialZoom?: number;
    maxZoom?: number;
    onRectangleDrawn?: (coordinates: RectangleCoordinates) => void;
    onPointSelected?: (coordinates: [number, number]) => void;
}

interface MapInitHandle {
    startDrawRectangle: (cancel?: boolean) => void;
    startPointSelection: (cancel?: boolean) => void;
    flyToSubprojectBounds: (projectName: string, subprojectName: string) => Promise<void>;
    showSubprojectBounds: (projectName: string, subprojects: any[], show: boolean) => void;
}

let scene: ThreejsSceneLayer | null = null;
let rectangleLayer: GLMapRectangleLayer | null = null;
let customRectangleDraw: CustomRectangleDraw | null = null;
let projectBoundsLayer: ProjectBoundsLayer | null = null;
let subprojectBoundsManager: SubprojectBoundsManager | null = null;

const MapInit: ForwardRefRenderFunction<MapInitHandle, MapInitProps> = (
    {
        initialLongitude = 114.051537,
        initialLatitude = 22.446937,
        initialZoom = 11,
        maxZoom = 22,
        onRectangleDrawn,
        onPointSelected,
    },
    ref
) => {
    const [map, setMap] = useState<mapboxgl.Map | null>(null);
    const [draw, setDraw] = useState<MapboxDraw | null>(null);
    const [isDrawMode, setIsDrawMode] = useState(false);
    const [isPointSelectionMode, setIsPointSelectionMode] = useState(false);
    const [hasDrawnRectangle, setHasDrawnRectangle] = useState(false);
    const [currentRectangleId, setCurrentRectangleId] = useState<string | null>(
        null
    );
    const [currentMarker, setCurrentMarker] = useState<mapboxgl.Marker | null>(
        null
    );
    const [showingProjectBounds, setShowingProjectBounds] = useState(false);

    // Calculate the four corners and center point of the rectangle (EPSG:4326)
    const calculateRectangleCoordinates = (
        feature: any
    ): RectangleCoordinates => {
        const coordinates = feature.geometry.coordinates[0];

        let minLng = Infinity,
            maxLng = -Infinity,
            minLat = Infinity,
            maxLat = -Infinity;

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
        const center: [number, number] = [
            (minLng + maxLng) / 2,
            (minLat + maxLat) / 2,
        ];

        return {
            northEast,
            southEast,
            southWest,
            northWest,
            center,
        };
    };

    // Handle click for point selection
    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        if (!isPointSelectionMode || !map) return;

        // Remove any existing marker
        if (currentMarker) {
            currentMarker.remove();
        }

        // Create a new marker at the clicked location
        const marker = new mapboxgl.Marker({
            color: '#FFFF00',
        })
            .setLngLat(e.lngLat)
            .addTo(map);

        setCurrentMarker(marker);

        // Return coordinates to parent component
        if (onPointSelected) {
            onPointSelected([e.lngLat.lng, e.lngLat.lat]);
        }

        // Exit point selection mode
        setIsPointSelectionMode(false);

        // Make cursor pointer normal again
        if (map.getCanvas()) {
            map.getCanvas().style.cursor = '';
        }
    };

    useEffect(() => {
        mapboxgl.accessToken =
            'pk.eyJ1IjoieWNzb2t1IiwiYSI6ImNrenozdWdodDAza3EzY3BtdHh4cm5pangifQ.ZigfygDi2bK4HXY1pWh-wg';

        const initializeMap = () => {
            const mapInstance = new NHMap({
                container: 'map-container',
                style: 'mapbox://styles/mapbox/navigation-night-v1',
                center: [initialLongitude, initialLatitude],
                zoom: initialZoom,
                maxZoom: maxZoom,
                attributionControl: false,
            });

            window.mapInstance = mapInstance;

            // Initialize drawing tool
            const drawInstance = new MapboxDraw({
                displayControlsDefault: false,

                modes: {
                    ...MapboxDraw.modes,
                    draw_rectangle: DrawRectangle,
                },
                styles: [
                    {
                        id: 'gl-draw-point',
                        type: 'circle',
                        filter: [
                            'all',
                            ['==', '$type', 'Point'],
                            ['==', 'meta', 'vertex'],
                        ],
                        paint: {
                            'circle-radius': 5,
                            'circle-color': '#fff',
                            'circle-stroke-width': 2,
                            'circle-stroke-color': '#FFFFFF',
                        },
                    },
                    {
                        id: 'gl-draw-polygon-fill',
                        type: 'fill',
                        filter: [
                            'all',
                            ['==', '$type', 'Polygon'],
                            ['!=', 'mode', 'static'],
                        ],
                        paint: {
                            'fill-color': '#FFFF00',
                            'fill-outline-color': '#FFFF00',
                            'fill-opacity': 0.1,
                        },
                    },
                    {
                        id: 'gl-draw-polygon-stroke',
                        type: 'line',
                        filter: [
                            'all',
                            ['==', '$type', 'Polygon'],
                            ['!=', 'mode', 'static'],
                        ],
                        layout: {
                            'line-cap': 'round',
                            'line-join': 'round',
                        },
                        paint: {
                            'line-color': '#FFFF00',
                            'line-width': 2,
                        },
                    },
                    {
                        id: 'gl-draw-polygon-fill-static',
                        type: 'fill',
                        filter: [
                            'all',
                            ['==', '$type', 'Polygon'],
                            ['==', 'mode', 'static'],
                        ],
                        paint: {
                            'fill-color': '#FFFF00',
                            'fill-outline-color': '#FFFF00',
                            'fill-opacity': 0.1,
                        },
                    },
                ],
            });

            mapInstance.addControl(drawInstance);

////////////////////// Test draw custom rectangle layer //////////////////////

            mapInstance.on('load', () => {
                
                {/* Load 3d scene */}
                // scene = new ThreejsSceneLayer({
                //     id: 'test-scene',
                //     refCenter: [initialLongitude, initialLatitude],
                // });
                // mapInstance.addLayer(scene);

                {/* Load custom rectangle layer with shaking */}
                const customLayer = CustomLayer({
                    center: { lng: initialLongitude, lat: initialLatitude },
                    width: 0.00002, // Mercator
                    height: 0.00002, // Mercator
                });
                // mapInstance.addLayer(customLayer);

                {/* Load custom rectangle layer without shaking */}
                rectangleLayer = new GLMapRectangleLayer({
                    id: 'rectangle-layer',
                    origin: [114.02639476404397, 22.444079016023963],
                });
                // mapInstance.addLayer(rectangleLayer);

                {/* Load custom rectangle draw layer */}
                customRectangleDraw = new CustomRectangleDraw({
                    id: 'custom-rectangle-draw',
                    corners: {
                        southWest: [114.022006, 22.438286], // LB
                        southEast: [114.033418, 22.438286], // RB
                        northEast: [114.033418, 22.449498], // RT
                        northWest: [114.022006, 22.449498]  // LT
                    },
                });
                // mapInstance.addLayer(customRectangleDraw);
                
                {/* initialize project bounds layer */}
                projectBoundsLayer = new ProjectBoundsLayer({
                    id: 'project-bounds-layer'
                });
                // mapInstance.addLayer(projectBoundsLayer);
                // do not show project bounds layer at the beginning
                if (projectBoundsLayer) {
                    projectBoundsLayer.setVisibility('none');
                }
                
                {/* initialize subproject bounds manager */}
                subprojectBoundsManager = new SubprojectBoundsManager(mapInstance, 'zh');
            });
            
//////////////////////////////////////////////////////////////////////////////

            window.mapboxDrawInstance = drawInstance;

            mapInstance.on('click', handleMapClick);

            mapInstance.on('draw.create', (e: any) => {
                if (e.features && e.features.length > 0) {
                    const feature = e.features[0];
                    setIsDrawMode(false);
                    setHasDrawnRectangle(true);
                    setCurrentRectangleId(feature.id);

                    const rectangleCoordinates =
                        calculateRectangleCoordinates(feature);
                    if (onRectangleDrawn) {
                        onRectangleDrawn(rectangleCoordinates);
                    }
                }
            });

            // Delete shape event
            mapInstance.on('draw.delete', (e: any) => {
                setHasDrawnRectangle(false);
                setCurrentRectangleId(null);
                if (onRectangleDrawn) {
                    onRectangleDrawn(null as any);
                }
            });

            // Monitor mode changes
            mapInstance.on('draw.modechange', (e: any) => {
                setIsDrawMode(e.mode === 'draw_rectangle');
            });

            setMap(mapInstance);
            setDraw(drawInstance);

            return (): void => {
                mapInstance.remove();
            };
        };

        if (!map) {
            initializeMap();
        }
    });

    // Method to start drawing rectangle
    const startDrawRectangle = (cancel?: boolean) => {
        if (!draw || !map) return;

        // Exit point selection mode if active
        if (isPointSelectionMode) {
            setIsPointSelectionMode(false);
            if (map.getCanvas()) {
                map.getCanvas().style.cursor = '';
            }
        }

        if (hasDrawnRectangle) {
            // If a rectangle already exists, delete it first
            draw.deleteAll();
            setHasDrawnRectangle(false);
            setCurrentRectangleId(null);

            if (onRectangleDrawn) {
                onRectangleDrawn(null as any);
            }
        }

        if (cancel === true || isDrawMode) {
            draw.changeMode('simple_select');
            setIsDrawMode(false);
        } else {
            draw.changeMode('draw_rectangle');
        }
    };

    // Method to start point selection
    const startPointSelection = (cancel?: boolean) => {
        if (!map) return;

        // Exit drawing mode if active
        if (isDrawMode && draw) {
            draw.changeMode('simple_select');
            setIsDrawMode(false);
        }

        if (cancel === true || isPointSelectionMode) {
            setIsPointSelectionMode(false);
            if (map.getCanvas()) {
                map.getCanvas().style.cursor = '';
            }
        } else {
            setIsPointSelectionMode(true);
            if (map.getCanvas()) {
                map.getCanvas().style.cursor = 'crosshair';
            }
        }
    };

    const flyToSubprojectBounds = async (projectName: string, subprojectName: string) => {
        if (!map || !subprojectBoundsManager) return;
        await subprojectBoundsManager.flyToSubprojectBounds(projectName, subprojectName);
    };
    
    const highlightSubproject = (projectName: string, subprojectName: string) => {
        if (!map || !subprojectBoundsManager) return;
        subprojectBoundsManager.highlightSubproject(projectName, subprojectName);
    };

    const showSubprojectBounds = (projectName: string, subprojects: any[], show: boolean) => {
        if (!map || !subprojectBoundsManager) return;
        subprojectBoundsManager.showSubprojectBounds(projectName, subprojects, show);
    };

    React.useImperativeHandle(ref, () => ({
        startDrawRectangle,
        startPointSelection,
        flyToSubprojectBounds,
        showSubprojectBounds,
    }),
    [
        startDrawRectangle,
        startPointSelection,
        flyToSubprojectBounds,
        showSubprojectBounds,
    ]);

    return (
        <div className="relative w-full h-full">
            <div id="map-container" className="w-full h-full"></div>
            <div
                id="control-panel-container"
                className="absolute top-0 left-0 z-10 flex flex-row items-start"
            ></div>
        </div>
    );
};

export default React.forwardRef(MapInit);
