import React, {
    useEffect,
    useState,
    ForwardRefRenderFunction,
    useContext,
    useRef,
    useImperativeHandle,
} from 'react';
import mapboxgl from 'mapbox-gl';
import NHMap from './utils/NHMap';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { RectangleCoordinates } from '../operatePanel/operatePanel';
import { MapInitProps, MapInitHandle } from './types/types';
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
import store from '../../store';
import TopologyLayer from './layers/TopologyLayer';
import NHLayerGroup from './utils/NHLayerGroup';
import { useSidebar } from '../ui/sidebar';
// Add mapInstance property to window object
declare global {
    interface Window {
        mapInstance?: mapboxgl.Map;
        mapboxDrawInstance?: MapboxDraw;
    }
}

const scene: ThreejsSceneLayer | null = null;
let rectangleLayer: GLMapRectangleLayer | null = null;
let customRectangleDraw: CustomRectangleDraw | null = null;
let projectBoundsLayer: ProjectBoundsLayer | null = null;
// let subprojectBoundsManager: SubprojectBoundsManager | null = null; // Comment out or remove global instance if ref is used exclusively

// Simple debounce function (you can replace this with a library version if preferred)
const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(null, args);
        }, delay);
    };
};

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
    const mapWrapperRef = useRef<HTMLDivElement>(null);
    const subprojectBoundsManagerRef = useRef<SubprojectBoundsManager | null>(
        null
    );
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
    const { language } = useContext(LanguageContext);

    let isMouseDown = false;
    const mouseDownPos = [0, 0];
    const mouseMovePos = [0, 0];
    let mouseUpPos = [0, 0];

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

        let mapInstance: NHMap | null = null;
        let drawInstance: MapboxDraw | null = null;
        let resizer: ResizeObserver | null = null;

        if (mapWrapperRef.current) {
            mapInstance = new NHMap({
                container: mapWrapperRef.current,
                style: 'mapbox://styles/mapbox/navigation-night-v1',
                center: [initialLongitude, initialLatitude],
                zoom: initialZoom,
                maxZoom: maxZoom,
                attributionControl: false,
                boxZoom: false,
            });

            store.set('map', mapInstance);
            window.mapInstance = mapInstance;

            drawInstance = new MapboxDraw({
                displayControlsDefault: false,
                boxSelect: false,
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
            window.mapboxDrawInstance = drawInstance;

            mapInstance.on('load', () => {
                // Initialize SubprojectBoundsManager via ref, using the language from context
                if (mapInstance) {
                    // Ensure mapInstance is valid
                    subprojectBoundsManagerRef.current =
                        new SubprojectBoundsManager(mapInstance, language);
                }

                const customLayer = CustomLayer({
                    center: { lng: initialLongitude, lat: initialLatitude },
                    width: 0.00002, // Mercator
                    height: 0.00002, // Mercator
                });
                // mapInstance.addLayer(customLayer);

                rectangleLayer = new GLMapRectangleLayer({
                    id: 'rectangle-layer',
                    origin: [114.02639476404397, 22.444079016023963],
                });
                // mapInstance.addLayer(rectangleLayer);

                customRectangleDraw = new CustomRectangleDraw({
                    id: 'custom-rectangle-draw',
                    corners: {
                        southWest: [114.022006, 22.438286], // LB
                        southEast: [114.033418, 22.438286], // RB
                        northEast: [114.033418, 22.449498], // RT
                        northWest: [114.022006, 22.449498], // LT
                    },
                });
                // mapInstance.addLayer(customRectangleDraw);

                projectBoundsLayer = new ProjectBoundsLayer({
                    id: 'project-bounds-layer',
                });
                // mapInstance.addLayer(projectBoundsLayer);
                if (projectBoundsLayer) {
                    projectBoundsLayer.setVisibility('none');
                }

                const topologyLayer = new TopologyLayer(mapInstance!);
                const updateLoading = store.get<{
                    on: () => void;
                    off: () => void;
                }>('isLoading')!;
                const updateCapacity = store.get<{
                    on: () => void;
                    off: () => void;
                }>('updateCapacity')!;
                topologyLayer.startCallback = () => {
                    updateLoading.on();
                };
                topologyLayer.endCallback = () => {
                    updateCapacity.on();
                    updateLoading.off();
                };

                const layerGroup = new NHLayerGroup();
                layerGroup.id = 'gridman-custom-layer-group';
                layerGroup.addLayer(topologyLayer);
                store.set('clg', layerGroup);
                mapInstance!.addLayer(layerGroup);

                const canvas = mapInstance!.getCanvas();
                const localIsMouseDown = { current: false };
                const localMouseDownPos = { current: [0, 0] };
                const localMouseMovePos = { current: [0, 0] };

                const onMouseDown = (e: MouseEvent) => {
                    if (!e.shiftKey) return;
                    localIsMouseDown.current = true;
                    mapInstance!.dragPan.disable();
                    mapInstance!.scrollZoom.disable();
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    localMouseDownPos.current = [x, y];

                    if (store.get<boolean>('gridCheckingOn') === true) {
                        store.set('GridInfo', topologyLayer.executeCheckGrid([x, y])),
                        store.get<{ on: Function}>('changeGridInfo')!.on()
                        
                    }
                };

                const onMouseMove = (e: MouseEvent) => {
                    if (!e.shiftKey || !localIsMouseDown.current) return;
                    if (store.get<boolean>('gridCheckingOn') === true) return;
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    localMouseMovePos.current = [x, y];

                    if (store.get<string>('modeSelect') === 'brush') {
                        topologyLayer.executePickGrids(
                            store.get<string>('modeSelect')!,
                            store.get<boolean>('pickingSelect')!,
                            [
                                localMouseMovePos.current[0],
                                localMouseMovePos.current[1],
                            ]
                        );
                    } else {
                        mapInstance!.dragPan.disable();
                        if (mapInstance!.getCanvas()) {
                            mapInstance!.getCanvas().style.cursor = 'crosshair';
                        }

                        topologyLayer.executeDrawBox(
                            [
                                localMouseDownPos.current[0],
                                localMouseDownPos.current[1],
                            ],
                            [
                                localMouseMovePos.current[0],
                                localMouseMovePos.current[1],
                            ]
                        );
                    }
                };

                const onMouseUp = (e: MouseEvent) => {
                    if (!localIsMouseDown.current) return;
                    localIsMouseDown.current = false;

                    if (mapInstance) {
                        mapInstance.dragPan.enable();
                        mapInstance.scrollZoom.enable();
                        topologyLayer.executeClearDrawBox();
                        if (mapInstance.getCanvas()) {
                            mapInstance.getCanvas().style.cursor = '';
                        }
                    }
                    if (!e.shiftKey) return;
                    if (store.get<boolean>('gridCheckingOn') === true) return;

                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const localMouseUpPos = [x, y];

                    topologyLayer.executePickGrids(
                        store.get<string>('modeSelect')!,
                        store.get<boolean>('pickingSelect')!,
                        [
                            localMouseDownPos.current[0],
                            localMouseDownPos.current[1],
                        ],
                        [localMouseUpPos[0], localMouseUpPos[1]]
                    );
                };

                const onMouseOut = (e: MouseEvent) => {
                    if (store.get<boolean>('gridCheckingOn') === true) return;
                    if (mapInstance) {
                        mapInstance.dragPan.enable();
                        mapInstance.scrollZoom.enable();
                        topologyLayer.executeClearDrawBox();
                        if (mapInstance.getCanvas()) {
                            mapInstance.getCanvas().style.cursor = '';
                        }
                    }
                    if (!e.shiftKey) return;
                    
                    isMouseDown = false;
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    mouseUpPos = [x, y];

                    topologyLayer.executePickGrids(
                        store.get<string>('modeSelect')!,
                        store.get<boolean>('pickingSelect')!,
                        [
                            localMouseDownPos.current[0],
                            localMouseDownPos.current[1],
                        ],
                        [mouseUpPos[0], mouseUpPos[1]]
                    );
                };
                canvas.addEventListener('mousedown', onMouseDown);
                canvas.addEventListener('mousemove', onMouseMove);
                canvas.addEventListener('mouseup', onMouseUp);
                canvas.addEventListener('mouseout', onMouseOut);
            });

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

            // Setup ResizeObserver
            if (mapWrapperRef.current) {
                const currentMapInstance = mapInstance; // Capture for the debounced function
                resizer = new ResizeObserver(
                    debounce(() => {
                        currentMapInstance?.resize();
                    }, 100)
                );
                resizer.observe(mapWrapperRef.current);
            }
        }

        return () => {
            if (resizer && mapWrapperRef.current) {
                resizer.unobserve(mapWrapperRef.current);
                resizer.disconnect();
            }
            if (mapInstance) {
                mapInstance.remove();
            }
            window.mapInstance = undefined;
            window.mapboxDrawInstance = undefined;
            setMap(null);
            setDraw(null);
            subprojectBoundsManagerRef.current = null; // Clean up the ref
        };
    }, [
        language,
        initialLatitude,
        initialLongitude,
        initialZoom,
        maxZoom,
        onPointSelected,
    ]);

    // Method to start drawing rectangle
    const startDrawRectangle = (cancel?: boolean) => {
        const currentDraw = draw;
        if (!currentDraw || !map) return;

        // Exit point selection mode if active
        if (isPointSelectionMode) {
            setIsPointSelectionMode(false);
            if (map.getCanvas()) {
                map.getCanvas().style.cursor = '';
            }
        }

        if (hasDrawnRectangle) {
            // If a rectangle already exists, delete it first
            currentDraw.deleteAll();
            setHasDrawnRectangle(false);
            setCurrentRectangleId(null);

            if (onRectangleDrawn) {
                onRectangleDrawn(null as any);
            }
        }

        if (cancel === true || isDrawMode) {
            currentDraw.changeMode('simple_select');
            setIsDrawMode(false);
        } else {
            currentDraw.changeMode('draw_rectangle');
        }
    };

    // Method to start point selection
    const startPointSelection = (cancel?: boolean) => {
        const currentDraw = draw;
        if (!map) return;

        // Exit drawing mode if active
        if (isDrawMode && currentDraw) {
            currentDraw.changeMode('simple_select');
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

    const flyToSubprojectBounds = async (
        projectName: string,
        subprojectName: string
    ) => {
        if (!map || !subprojectBoundsManagerRef.current) return;
        await subprojectBoundsManagerRef.current.flyToSubprojectBounds(
            projectName,
            subprojectName
        );
    };

    const highlightSubproject = (
        projectName: string,
        subprojectName: string
    ) => {
        if (!map || !subprojectBoundsManagerRef.current) return;
        subprojectBoundsManagerRef.current.highlightSubproject(
            projectName,
            subprojectName
        );
    };

    const showSubprojectBounds = (
        projectName: string,
        subprojects: any[],
        show: boolean
    ) => {
        if (!map || !subprojectBoundsManagerRef.current) return;
        subprojectBoundsManagerRef.current.showSubprojectBounds(
            projectName,
            subprojects,
            show
        );
    };

    useImperativeHandle(
        ref,
        () => ({
            startDrawRectangle,
            startPointSelection,
            flyToSubprojectBounds,
            highlightSubproject,
            showSubprojectBounds,
        }),
        [
            startDrawRectangle,
            startPointSelection,
            flyToSubprojectBounds,
            highlightSubproject,
            showSubprojectBounds,
        ]
    );

    return (
        <div className="relative w-full h-full" ref={mapWrapperRef}>
            <div
                id="control-panel-container"
                className="absolute top-0 left-0 z-10 flex flex-row items-start"
            ></div>
        </div>
    );
};

export default React.forwardRef(MapInit);
