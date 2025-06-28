import React, {
    useEffect,
    useState,
    ForwardRefRenderFunction,
    useContext,
    useRef,
    useImperativeHandle,
} from "react";
import mapboxgl from "mapbox-gl";
import NHMap from "./utils/NHMap";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import { RectangleCoordinates } from "../operatePanel/operatePanel";
import { MapInitProps, MapInitHandle } from "./types/types";
// Import rectangle drawing mode
// @ts-ignore
import DrawRectangle from "mapbox-gl-draw-rectangle-mode";
import { LanguageContext, CheckingSwitch } from "../../context";
import { PatchBoundsManager } from "./layers/patchBoundsManager";
import store from "../../store";
import TopologyLayer from "./layers/TopologyLayer";
import NHLayerGroup from "./utils/NHLayerGroup";

declare global {
    interface Window {
        mapInstance?: mapboxgl.Map;
        mapboxDrawInstance?: MapboxDraw;
    }
}

const GPULayerON = false;

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
    let mouseUpPos = [0, 0];

    const { language } = useContext(LanguageContext);
    const [isDrawMode, setIsDrawMode] = useState(false);
    const [hasDrawnRectangle, setHasDrawnRectangle] = useState(false);
    const [isPointSelectionMode, setIsPointSelectionMode] = useState(false);
    const mapWrapperRef = useRef<HTMLDivElement>(null);
    const [map, setMap] = useState<mapboxgl.Map | null>(null);
    const [draw, setDraw] = useState<MapboxDraw | null>(null);
    const patchBoundsManagerRef = useRef<PatchBoundsManager | null>(null);
    const [currentMarker, setCurrentMarker] = useState<mapboxgl.Marker | null>(
        null
    );

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

    const handleMapClick = (e: mapboxgl.MapMouseEvent) => {
        if (!isPointSelectionMode || !map) return;
        if (currentMarker) {
            currentMarker.remove();
        }

        const marker = new mapboxgl.Marker({
            color: "#FFFF00",
        })
            .setLngLat(e.lngLat)
            .addTo(map);

        setCurrentMarker(marker);

        if (onPointSelected) {
            onPointSelected([e.lngLat.lng, e.lngLat.lat]);
        }

        setIsPointSelectionMode(false);

        if (map.getCanvas()) {
            map.getCanvas().style.cursor = "";
        }
    };

    useEffect(() => {
        mapboxgl.accessToken =
            "pk.eyJ1IjoieWNzb2t1IiwiYSI6ImNrenozdWdodDAza3EzY3BtdHh4cm5pangifQ.ZigfygDi2bK4HXY1pWh-wg";

        let mapInstance: NHMap | null = null;
        let drawInstance: MapboxDraw | null = null;
        let resizer: ResizeObserver | null = null;

        if (mapWrapperRef.current) {
            mapInstance = new NHMap({
                container: mapWrapperRef.current,
                style: "mapbox://styles/mapbox/navigation-night-v1",
                center: [initialLongitude, initialLatitude],
                zoom: initialZoom,
                maxZoom: maxZoom,
                attributionControl: false,
                boxZoom: false,
            });

            store.set("map", mapInstance);
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
                        id: "gl-draw-point",
                        type: "circle",
                        filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
                        paint: {
                            "circle-radius": 5,
                            "circle-color": "#fff",
                            "circle-stroke-width": 2,
                            "circle-stroke-color": "#FFFFFF",
                        },
                    },
                    {
                        id: "gl-draw-polygon-fill",
                        type: "fill",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["!=", "mode", "static"],
                        ],
                        paint: {
                            "fill-color": "#FFFF00",
                            "fill-outline-color": "#FFFF00",
                            "fill-opacity": 0.1,
                        },
                    },
                    {
                        id: "gl-draw-polygon-stroke",
                        type: "line",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["!=", "mode", "static"],
                        ],
                        layout: {
                            "line-cap": "round",
                            "line-join": "round",
                        },
                        paint: {
                            "line-color": "#FFFF00",
                            "line-width": 2,
                        },
                    },
                    {
                        id: "gl-draw-polygon-fill-static",
                        type: "fill",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["==", "mode", "static"],
                        ],
                        paint: {
                            "fill-color": "#FFFF00",
                            "fill-outline-color": "#FFFF00",
                            "fill-opacity": 0.1,
                        },
                    },
                    {
                        id: "gl-draw-polygon",
                        type: "fill",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["!=", "mode", "static"],
                        ],
                        paint: {
                            "fill-color": "#0077FF",
                            "fill-outline-color": "#0077FF",
                            "fill-opacity": 0.3,
                        },
                    },
                    {
                        id: "gl-draw-polygon-stroke",
                        type: "line",
                        filter: [
                            "all",
                            ["==", "$type", "Polygon"],
                            ["!=", "mode", "static"],
                        ],
                        layout: {
                            "line-cap": "round",
                            "line-join": "round",
                        },
                        paint: {
                            "line-color": "#0077FF",
                            "line-width": 2,
                        },
                    },
                    {
                        id: "gl-draw-polygon-midpoint",
                        type: "circle",
                        filter: [
                            "all",
                            ["==", "$type", "Point"],
                            ["==", "meta", "midpoint"],
                        ],
                        paint: {
                            "circle-radius": 3,
                            "circle-color": "#fff",
                        },
                    },
                    {
                        id: "gl-draw-polygon-vertex",
                        type: "circle",
                        filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
                        paint: {
                            "circle-radius": 5,
                            "circle-color": "#fff",
                            "circle-stroke-width": 2,
                            "circle-stroke-color": "#0077FF",
                        },
                    },
                    {
                        id: "gl-draw-line",
                        type: "line",
                        filter: [
                            "all",
                            ["==", "$type", "LineString"],
                            ["!=", "mode", "static"],
                        ],
                        layout: {
                            "line-cap": "round",
                            "line-join": "round",
                        },
                        paint: {
                            "line-color": "#0077FF",
                            "line-width": 2,
                        },
                    },
                    {
                        id: "gl-draw-line-static",
                        type: "line",
                        filter: [
                            "all",
                            ["==", "$type", "LineString"],
                            ["==", "mode", "static"],
                        ],
                        layout: {
                            "line-cap": "round",
                            "line-join": "round",
                        },
                        paint: {
                            "line-color": "#0077FF",
                            "line-width": 2,
                        },
                    },
                    {
                        id: "gl-draw-line-vertex",
                        type: "circle",
                        filter: [
                            "all",
                            ["==", "$type", "Point"],
                            ["==", "meta", "vertex"],
                            ["==", "$parent", "LineString"],
                        ],
                        paint: {
                            "circle-radius": 5,
                            "circle-color": "#fff",
                            "circle-stroke-width": 2,
                            "circle-stroke-color": "#0077FF",
                        },
                    },
                    {
                        id: "gl-draw-line-midpoint",
                        type: "circle",
                        filter: [
                            "all",
                            ["==", "$type", "Point"],
                            ["==", "meta", "midpoint"],
                            ["==", "$parent", "LineString"],
                        ],
                        paint: {
                            "circle-radius": 3,
                            "circle-color": "#fff",
                        },
                    },
                    {
                        id: "gl-draw-point-static",
                        type: "circle",
                        filter: ["all", ["==", "$type", "Point"], ["==", "mode", "static"]],
                        paint: {
                            "circle-radius": 8,
                            "circle-color": "#0077FF",
                            "circle-stroke-width": 2,
                            "circle-stroke-color": "#fff",
                        },
                    },
                    {
                        id: "gl-draw-point-active",
                        type: "circle",
                        filter: [
                            "all",
                            ["==", "$type", "Point"],
                            ["!=", "meta", "midpoint"],
                            ["!=", "meta", "vertex"],
                        ],
                        paint: {
                            "circle-radius": 8,
                            "circle-color": "#0077FF",
                            "circle-stroke-width": 2,
                            "circle-stroke-color": "#fff",
                        },
                    },
                ],
            });
            mapInstance.addControl(drawInstance);
            window.mapboxDrawInstance = drawInstance;

            mapInstance.on("load", () => {
                if (mapInstance) {
                    patchBoundsManagerRef.current = new PatchBoundsManager(
                        mapInstance,
                        language
                    );
                }

                const topologyLayer = new TopologyLayer(mapInstance!);
                const updateLoading = store.get<{
                    on: () => void;
                    off: () => void;
                }>("isLoading")!;
                const updateCapacity = store.get<{
                    on: () => void;
                    off: () => void;
                }>("updateCapacity")!;
                topologyLayer.startCallback = () => {
                    updateLoading.on();
                };
                topologyLayer.endCallback = () => {
                    updateCapacity.on();
                    updateLoading.off();
                };

                const layerGroup = new NHLayerGroup();
                layerGroup.id = "gridman-custom-layer-group";
                layerGroup.addLayer(topologyLayer);
                store.set("clg", layerGroup);
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

                    if (store.get<CheckingSwitch>("checkingSwitch")!.isOn) {
                        store.set("GridInfo", topologyLayer.executeCheckGrid([x, y])),
                            store.get<{ on: Function }>("changeGridInfo")!.on();
                    }
                };

                const onMouseMove = (e: MouseEvent) => {
                    if (!e.shiftKey || !localIsMouseDown.current) return;
                    if (store.get<CheckingSwitch>("checkingSwitch")!.isOn) return;
                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    localMouseMovePos.current = [x, y];

                    if (store.get<string>("modeSelect") === "brush") {
                        topologyLayer.executePickGrids(
                            store.get<string>("modeSelect")!,
                            store.get<boolean>("pickingSelect")!,
                            [localMouseMovePos.current[0], localMouseMovePos.current[1]]
                        );
                    } else {
                        mapInstance!.dragPan.disable();
                        if (mapInstance!.getCanvas()) {
                            mapInstance!.getCanvas().style.cursor = "crosshair";
                        }

                        topologyLayer.executeDrawBox(
                            [localMouseDownPos.current[0], localMouseDownPos.current[1]],
                            [localMouseMovePos.current[0], localMouseMovePos.current[1]]
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
                            mapInstance.getCanvas().style.cursor = "";
                        }
                    }
                    if (!e.shiftKey) return;
                    if (store.get<CheckingSwitch>("checkingSwitch")!.isOn) return;

                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    const localMouseUpPos = [x, y];

                    topologyLayer.executePickGrids(
                        store.get<string>("modeSelect")!,
                        store.get<boolean>("pickingSelect")!,
                        [localMouseDownPos.current[0], localMouseDownPos.current[1]],
                        [localMouseUpPos[0], localMouseUpPos[1]]
                    );
                };

                const onMouseOut = (e: MouseEvent) => {
                    if (store.get<CheckingSwitch>("checkingSwitch")!.isOn) return;
                    if (mapInstance) {
                        mapInstance.dragPan.enable();
                        mapInstance.scrollZoom.enable();
                        topologyLayer.executeClearDrawBox();
                        if (mapInstance.getCanvas()) {
                            mapInstance.getCanvas().style.cursor = "";
                        }
                    }
                    if (!e.shiftKey) return;

                    const rect = canvas.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    mouseUpPos = [x, y];

                    topologyLayer.executePickGrids(
                        store.get<string>("modeSelect")!,
                        store.get<boolean>("pickingSelect")!,
                        [localMouseDownPos.current[0], localMouseDownPos.current[1]],
                        [mouseUpPos[0], mouseUpPos[1]]
                    );
                };
                canvas.addEventListener("mousedown", onMouseDown);
                canvas.addEventListener("mousemove", onMouseMove);
                canvas.addEventListener("mouseup", onMouseUp);
                canvas.addEventListener("mouseout", onMouseOut);
            });

            mapInstance.on("click", handleMapClick);
            mapInstance.on("draw.create", (e: any) => {
                if (e.features && e.features.length > 0) {
                    const feature = e.features[0];
                    console.log("绘制的要素:", feature);
                    setIsDrawMode(false);
                    setHasDrawnRectangle(true);

                    // 只有多边形才调用 onRectangleDrawn 回调（用于项目创建）
                    if (feature.geometry.type === "Polygon" && onRectangleDrawn) {
                        const coordinates = calculateRectangleCoordinates(feature);
                        onRectangleDrawn(coordinates);
                    }

                    // 对于其他几何类型，可以在这里添加其他处理逻辑
                    if (feature.geometry.type === "LineString") {
                        console.log("绘制了线要素:", feature);
                    } else if (feature.geometry.type === "Point") {
                        console.log("绘制了点要素:", feature);
                    }
                }
            });

            // Delete shape event
            mapInstance.on("draw.delete", (e: any) => {
                setHasDrawnRectangle(false);
                if (onRectangleDrawn) {
                    onRectangleDrawn(null as any);
                }
            });

            // Monitor mode changes
            mapInstance.on("draw.modechange", (e: any) => {
                setIsDrawMode(e.mode === "draw_rectangle");
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
            patchBoundsManagerRef.current = null; // Clean up the ref
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
                map.getCanvas().style.cursor = "";
            }
        }

        if (hasDrawnRectangle) {
            // If a rectangle already exists, delete it first
            currentDraw.deleteAll();
            setHasDrawnRectangle(false);

            if (onRectangleDrawn) {
                onRectangleDrawn(null as any);
            }
        }

        if (cancel === true || isDrawMode) {
            currentDraw.changeMode("simple_select");
            setIsDrawMode(false);
        } else {
            currentDraw.changeMode("draw_rectangle");
        }
    };

    // Method to start point selection
    const startPointSelection = (cancel?: boolean) => {
        const currentDraw = draw;
        if (!map) return;

        // Exit drawing mode if active
        if (isDrawMode && currentDraw) {
            currentDraw.changeMode("simple_select");
            setIsDrawMode(false);
        }

        if (cancel === true || isPointSelectionMode) {
            setIsPointSelectionMode(false);
            if (map.getCanvas()) {
                map.getCanvas().style.cursor = "";
            }
        } else {
            setIsPointSelectionMode(true);
            if (map.getCanvas()) {
                map.getCanvas().style.cursor = "crosshair";
            }
        }
    };

    const flyToPatchBounds = async (projectName: string, patchName: string) => {
        if (!map || !patchBoundsManagerRef.current) return;
        await patchBoundsManagerRef.current.flyToPatchBounds(
            projectName,
            patchName
        );
    };

    const highlightPatch = (projectName: string, patchName: string) => {
        if (!map || !patchBoundsManagerRef.current) return;
        patchBoundsManagerRef.current.highlightPatch(projectName, patchName);
    };

    const showPatchBounds = (
        projectName: string,
        patches: any[],
        show: boolean
    ) => {
        if (!map || !patchBoundsManagerRef.current) return;
        patchBoundsManagerRef.current.showPatchBounds(projectName, patches, show);
    };

    const showEditBounds = (
        projectName: string,
        patchBounds: number[],
        show: boolean
    ) => {
        if (!map || !patchBoundsManagerRef.current) return;
        patchBoundsManagerRef.current.showEditBounds(
            projectName,
            patchBounds,
            show
        );
    };

    useImperativeHandle(
        ref,
        () => ({
            startDrawRectangle,
            startPointSelection,
            flyToPatchBounds,
            highlightPatch,
            showPatchBounds,
            showEditBounds,
        }),
        [
            startDrawRectangle,
            startPointSelection,
            flyToPatchBounds,
            highlightPatch,
            showPatchBounds,
            showEditBounds,
        ]
    );

    return (
        <div className="relative w-full h-full" ref={mapWrapperRef}>
            {GPULayerON && (
                <canvas
                    id="GPULayer"
                    className="absolute bg-red-500 opacity-20 inset-0 w-full h-full pointer-events-none z-20"
                ></canvas>
            )}
            <div
                id="control-panel-container"
                className="absolute top-0 left-0 z-10 flex flex-row items-start"
            ></div>
        </div>
    );
};

export default React.forwardRef(MapInit);
