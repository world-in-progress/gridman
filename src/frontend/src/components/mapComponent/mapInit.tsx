import React, { useEffect, useState, ForwardRefRenderFunction } from 'react';
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
import { convertCoordinate } from '../operatePanel/utils/coordinateUtils';
import { generateRandomHexColor } from '../../utils/colorUtils';

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
    showProjectBounds: (show: boolean) => void;
    flyToProjectBounds: (projectName: string) => Promise<void>;
}

let scene: ThreejsSceneLayer | null = null;
let rectangleLayer: GLMapRectangleLayer | null = null;
let customRectangleDraw: CustomRectangleDraw | null = null;
let projectBoundsLayer: ProjectBoundsLayer | null = null;

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
                        southWest: [114.022006, 22.438286], // 左下
                        southEast: [114.033418, 22.438286], // 右下
                        northEast: [114.033418, 22.449498], // 右上
                        northWest: [114.022006, 22.449498]  // 左上
                    },
                });
                // mapInstance.addLayer(customRectangleDraw);
                
                {/* 初始化项目边界层但不立即显示 */}
                projectBoundsLayer = new ProjectBoundsLayer({
                    id: 'project-bounds-layer'
                });
                // mapInstance.addLayer(projectBoundsLayer);
                // 开始时不显示项目边界
                if (projectBoundsLayer) {
                    projectBoundsLayer.setVisibility('none');
                }
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
    
    // Switch the visibility of the project bounds layer
    const showProjectBounds = async (show: boolean) => {
        if (!map) return;
        
        if (show === showingProjectBounds) return;
        
        try {
            const sourceId = 'project-bounds-source';
            const layerId = 'project-bounds-fill-layer';
            const outlineLayerId = 'project-bounds-outline-layer';
            
            if (map.getLayer(outlineLayerId)) {
                map.removeLayer(outlineLayerId);
            }
            
            if (map.getLayer(layerId)) {
                map.removeLayer(layerId);
            }
            
            if (map.getSource(sourceId)) {
                map.removeSource(sourceId);
            }
            
            if (show) {
                
                if (!projectBoundsLayer || projectBoundsLayer.projects.length === 0) {
                    if (!projectBoundsLayer) {
                        projectBoundsLayer = new ProjectBoundsLayer({ id: 'project-bounds-layer' });
                    }
                    await projectBoundsLayer.loadAllProjects();
                }
                
                const features = projectBoundsLayer.projects.map(project => {
                    const { bounds, name, starred } = project;
                    if (!bounds || bounds.length !== 4) return null;
                    
                    const sw = convertCoordinate([bounds[0], bounds[1]], '2326', '4326');
                    const ne = convertCoordinate([bounds[2], bounds[3]], '2326', '4326');
                    
                    if (!sw || !ne || sw.length !== 2 || ne.length !== 2) return null;
                    
                    const randomColor = generateRandomHexColor();
                    
                    return {
                        type: 'Feature',
                        properties: {
                            name,
                            selected: name === projectBoundsLayer?.selectedProject,
                            color: randomColor,
                            starred: starred || false
                        },
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[
                                [sw[0], sw[1]], // 左下
                                [sw[0], ne[1]], // 左上
                                [ne[0], ne[1]], // 右上
                                [ne[0], sw[1]], // 右下
                                [sw[0], sw[1]]  // 闭合回左下
                            ]]
                        }
                    };
                }).filter(feature => feature !== null);
                
                map.addSource(sourceId, {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: features as any[]
                    }
                });
                
                map.addLayer({
                    id: layerId,
                    type: 'fill',
                    source: sourceId,
                    paint: {
                        'fill-color': ['get', 'color'], 
                        'fill-opacity': 0.3
                    }
                });
                
                map.addLayer({
                    id: outlineLayerId,
                    type: 'line',
                    source: sourceId,
                    paint: {
                        'line-color': [
                            'case',
                            ['get', 'starred'], '#FFFD00', 
                            '#AAAAAA' 
                        ],
                        'line-width': 2
                    }
                });
            }
            setShowingProjectBounds(show);
        } catch (error) {
            console.error('切换项目边界显示失败:', error);
        }
    };

    const flyToProjectBounds = async (projectName: string) => {
        if (!map) return;

        try {
            if (!projectBoundsLayer) {
                projectBoundsLayer = new ProjectBoundsLayer({ id: 'project-bounds-layer' });
                map.addLayer(projectBoundsLayer);
                await projectBoundsLayer.loadAllProjects();
            }
            
            const projectToFly = projectBoundsLayer.projects.find(
                project => project.name === projectName
            );
            
            if (!projectToFly || !projectToFly.bounds || projectToFly.bounds.length !== 4) {
                console.warn('找不到项目或项目边界不正确:', projectName);
                return;
            }
            
            const sw = convertCoordinate(
                [projectToFly.bounds[0], projectToFly.bounds[1]],
                '2326',
                '4326'
            );
            const ne = convertCoordinate(
                [projectToFly.bounds[2], projectToFly.bounds[3]],
                '2326',
                '4326'
            );
            
            if (!sw || !ne || sw.length !== 2 || ne.length !== 2) {
                console.warn('坐标转换失败:', projectName);
                return;
            }
            
            const bounds = [
                [sw[0], sw[1]], // 西南角
                [ne[0], ne[1]]  // 东北角
            ];
            
            projectBoundsLayer.setSelectedProject(projectName);
            
            if (projectBoundsLayer.getVisibility() === 'none') {
                projectBoundsLayer.setVisibility('visible');
                setShowingProjectBounds(true);
            }
            
            map.fitBounds(bounds as [[number, number], [number, number]], {
                padding: 50, 
                maxZoom: 19, 
                duration: 1000
            });
        } catch (error) {
            console.error('飞行到项目边界失败:', error);
        }
    };

    React.useImperativeHandle(ref, () => ({
        startDrawRectangle,
        startPointSelection,
        showProjectBounds,
        flyToProjectBounds,
    }),
    [
        startDrawRectangle,
        startPointSelection,
        showProjectBounds,
        flyToProjectBounds,
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
