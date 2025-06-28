import { useRef, useState, useContext, useEffect, useCallback } from "react";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import {
    MapPin,
    Waves,
    Building,
    Route,
    LucideIcon,
    Map,
    Mountain,
    Trees,
    LandPlot,
    Warehouse,
    ArrowRight,
    ArrowLeft,
} from "lucide-react";
import MapInit from "./mapComponent/mapInit";
import { RectangleCoordinates } from "./operatePanel/operatePanel";
import SchemaPanel from "./schemaPanel/schemaPanel";
import CreateSchema from "./schemaPanel/createSchema";
import ProjectPanel from "./projectPanel/projectPanel";
import CreateProject from "./projectPanel/createProject";
import { SidebarContext, LanguageContext, AIDialogContext } from "../context";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import beststar from "../assets/beststar.jpg";
import { SchemaService } from "./schemaPanel/utils/SchemaService";
import { MapMarkerManager } from "./schemaPanel/utils/MapMarkerManager";
import { Switch } from "@/components/ui/switch";
import ChatPanel from "./chatPanel/chatPanel";
import CreatePatch from "./projectPanel/createPatch";
import { clearMapMarkers } from "./schemaPanel/utils/SchemaCoordinateService";
import store from "@/store";
import NHLayerGroup from "./mapComponent/utils/NHLayerGroup";
import TopologyLayer from "./mapComponent/layers/TopologyLayer";
import CapacityBar from "./ui/capacityBar";
import GridPanel from "./gridPanel/gridPanel";
import FeaturePanel from "./featurePanel/featurePanel";
import FeatureToolbar from "./featurePanel/components/featureToolbar";
import RasterPanel from "./rasterPanel/rasterPanel";
import RasterToolbar from "./rasterPanel/components/rasterToolbar";
import AggregationPanel from "./aggregationPanel/aggregationPanel";
import { LayerNode } from "./featurePanel/types/types";
import { FeatureService } from "./featurePanel/utils/FeatureService";
import { FeatureProperty } from "@/core/feature/types";
import { LayerNode as RasterLayerNode } from "./rasterPanel/types/types";

export type SidebarType = "home" | "aggregation" | "simulation" | null;
export type BreadcrumbType =
    | "schema"
    | "project"
    | "editor"
    | "grid"
    | "raster"
    | "feature"
    | "aggregation"
    | null;

export default function Page() {
    const [isDrawing, setIsDrawing] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [updateCapacity, setUpdateCapacity] = useState(false);
    const [showCreateSchema, setShowCreateSchema] = useState(false);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [showCreatePatch, setshowCreatePatch] = useState(false);
    const [highSpeedModeEnabled, setHighSpeedModeEnabled] = useState(false);
    const { language } = useContext(LanguageContext);
    const { activeNavbar, setActiveNavbar } = useContext(SidebarContext);
    const { aiDialogEnabled, setAIDialogEnabled } = useContext(AIDialogContext);
    const [gridLine, setGridLine] = useState<string | null>(null);
    const [gridLabel, setGridLabel] = useState<mapboxgl.Marker | null>(null);
    const [cornerMarker, setCornerMarker] = useState<mapboxgl.Marker | null>(
        null
    );
    const [schemaMarker, setSchemaMarker] = useState<mapboxgl.Marker | null>(
        null
    );
    const [selectedParentProject, setSelectedParentProject] = useState<any>(null);
    const [activeBreadcrumb, setActiveBreadcrumb] =
        useState<BreadcrumbType>(null);
    const [activePanel, setActivePanel] = useState<
        | "schema"
        | "project"
        | "editor"
        | "grid"
        | "raster"
        | "feature"
        | "aggregation"
        | null
    >(null);
    const [selectedSchemaName, setSelectedSchemaName] = useState<
        string | undefined
    >(undefined);
    const [selectedSchemaEpsg, setSelectedSchemaEpsg] = useState<
        string | undefined
    >(undefined);
    const [selectedSchemaLevel, setSelectedSchemaLevel] = useState<
        string | undefined
    >(undefined);
    const [rectangleCoordinates, setRectangleCoordinates] =
        useState<RectangleCoordinates | null>(null);

    const [layers, setLayers] = useState<LayerNode[]>([]);
    const [rasterLayers, setRasterLayers] = useState<RasterLayerNode[]>([]);
    const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);

    const mapRef = useRef<{
        startDrawRectangle: (cancel?: boolean) => void;
        startPointSelection: (cancel?: boolean) => void;
        flyToPatchBounds: (projectName: string, patchName: string) => Promise<void>;
        showPatchBounds: (
            projectName: string,
            patches: any[],
            show: boolean
        ) => void;
        highlightPatch: (projectName: string, patchName: string) => void;
        showEditBounds: (
            projectName: string,
            patchBounds: number[],
            show: boolean
        ) => void;
    }>(null);

    const [isEditMode, setIsEditMode] = useState(false);

    store.set("updateCapacity", {
        on: () => {
            setUpdateCapacity(true);
        },
        off: () => {
            setUpdateCapacity(false);
        },
    });

    store.set(
        "activePanelChange",
        (
            activePanel:
                | "schema"
                | "project"
                | "editor"
                | "grid"
                | "raster"
                | "feature"
                | "aggregation"
                | null
        ) => {
            setActivePanel(activePanel);
            setActiveBreadcrumb(activePanel);
        }
    );

    const breadcrumbText = {
        schema: {
            zh: "模板",
            en: "Schema",
        },
        project: {
            zh: "项目",
            en: "Project",
        },
        editor: {
            zh: "编辑",
            en: "Editor",
        },
        grid: {
            zh: "网格",
            en: "Grid",
        },
        raster: {
            zh: "栅格",
            en: "Raster",
        },
        feature: {
            zh: "要素",
            en: "Feature",
        },
        aggregation: {
            zh: "聚合",
            en: "Aggregation",
        },
    };

    useEffect(() => {
        if (activeNavbar === "aggregation") {
            setActiveBreadcrumb("schema");
            setActivePanel("schema");
        }
    }, [activeNavbar]);

    useEffect(() => {
        if (activePanel || activeNavbar) {
            const event = new Event("activePanelChange");
            window.dispatchEvent(event);
        }
    }, [activePanel, activeNavbar]);

    useEffect(() => {
        if (!aiDialogEnabled && isChatOpen) {
            setIsChatOpen(false);
        }
    }, [aiDialogEnabled, isChatOpen]);

    useEffect(() => {
        window.mapRef = mapRef;
        return () => {
            window.mapRef = undefined;
        };
    }, []);

    useEffect(() => {
        if (activePanel === "feature") {
            const featureService = new FeatureService(language);

            featureService.getFeatureMeta((err, result) => {
                if (err) {
                    console.error("获取要素列表失败:", err);
                    return;
                }
                const featureMeta = result as FeatureProperty[];

                console.log("featureMeta:", featureMeta);

                setLayers(
                    featureMeta.map((feature: FeatureProperty) => ({
                        id: feature.id,
                        name: feature.name,
                        type: feature.type,
                        visible: true,
                        icon: getIconComponent(feature.icon),
                        group: "Edited",
                        symbology: feature.symbology,
                        isEditing: false,
                    }))
                );
                featureMeta.forEach((feature) => {
                    featureService.getFeatureJson(feature.id, (err, result) => {
                        if (err) {
                            console.error("获取要素失败:", err);
                            return;
                        }
                        const map = window.mapInstance;
                        if (map) {
                            map.addSource(feature.id, {
                                type: "geojson",
                                data: result.feature_json,
                            });

                            if (feature.type === "polygon") {
                                map.addLayer({
                                    id: feature.id,
                                    type: "fill",
                                    source: feature.id,
                                    paint: {
                                        "fill-color": feature.symbology.replace("-fill", ""),
                                        "fill-opacity": 0.5,
                                    },
                                });
                            } else if (feature.type === "line") {
                                map.addLayer({
                                    id: feature.id,
                                    type: "line",
                                    source: feature.id,
                                    paint: {
                                        "line-color": feature.symbology.replace("-fill", ""),
                                        "line-width": 3,
                                    },
                                });
                            } else if (feature.type === "point") {
                                map.addLayer({
                                    id: feature.id,
                                    type: "circle",
                                    source: feature.id,
                                    paint: {
                                        "circle-radius": 8,
                                        "circle-color": feature.symbology.replace("-fill", ""),
                                        "circle-stroke-width": 2,
                                        "circle-stroke-color": "#fff",
                                    },
                                });
                            }
                        }
                    });
                });
            });
        }
    }, [activePanel]);

    const iconOptions: { value: string; Icon: LucideIcon }[] = [
        { value: "MapPin", Icon: MapPin },
        { value: "Waves", Icon: Waves },
        { value: "Building", Icon: Building },
        { value: "Route", Icon: Route },
        { value: "Map", Icon: Map },
        { value: "Mountain", Icon: Mountain },
        { value: "Trees", Icon: Trees },
        { value: "LandPlot", Icon: LandPlot },
        { value: "Warehouse", Icon: Warehouse },
    ];

    const symbologyOptions: { value: string; color: string }[] = [
        { value: "red-fill", color: "bg-red-500" },
        { value: "blue-fill", color: "bg-blue-500" },
        { value: "green-fill", color: "bg-green-500" },
        { value: "gray-fill", color: "bg-gray-500" },
        { value: "yellow-fill", color: "bg-yellow-500" },
        { value: "purple-fill", color: "bg-purple-500" },
        { value: "orange-fill", color: "bg-orange-500" },
    ];

    const getIconComponent = (iconValue: string): React.ReactNode => {
        const selectedIcon = iconOptions.find(
            (option) => option.value === iconValue
        );
        return selectedIcon ? (
            <selectedIcon.Icon className="h-4 w-4" />
        ) : (
            <MapPin className="h-4 w-4" />
        );
    };

    const getIconString = (icon: React.ReactNode): string => {
        if (!icon || typeof icon !== "object" || !("type" in icon)) {
            return "MapPin";
        }

        const iconType = icon.type;
        const iconString = iconOptions.find(
            (option) => option.Icon === iconType
        )?.value;
        return iconString || "MapPin";
    };

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    const handleDrawRectangle = (currentlyDrawing: boolean) => {
        if (mapRef.current) {
            mapRef.current.startDrawRectangle(currentlyDrawing);
            setIsDrawing(!currentlyDrawing);
        }
    };

    const handleRectangleDrawn = (coordinates: RectangleCoordinates | null) => {
        setRectangleCoordinates(coordinates);
        setIsDrawing(false);
    };

    const clearMapDrawElements = () => {
        if (window.mapboxDrawInstance) {
            window.mapboxDrawInstance.deleteAll();
        }
        if (cornerMarker) {
            cornerMarker.remove();
            setCornerMarker(null);
        }
        if (gridLine && window.mapInstance) {
            if (window.mapInstance.getSource(gridLine)) {
                window.mapInstance.removeLayer(gridLine);
                window.mapInstance.removeSource(gridLine);
            }
            setGridLine(null);
        }
        if (gridLabel) {
            gridLabel.remove();
            setGridLabel(null);
        }
    };

    const handleBreadcrumbClick = (item: BreadcrumbType) => {
        setActiveBreadcrumb(item);
        setSelectedLayerId(null);

        const clg = store.get<NHLayerGroup>("clg")!;
        const layer = clg.getLayerInstance("TopologyLayer")! as TopologyLayer;
        layer.removeResource();

        clearMapMarkers();

        if (window.mapInstance) {
            const sourceId = `patch-bounds-临时项目`;
            const layerId = `patch-fill-临时项目`;
            const outlineLayerId = `patch-outline-临时项目`;
            const editSourceId = `patch-bounds-edit`;
            const editOutlineLayerId = `patch-outline-edit`;

            if (window.mapInstance.getLayer(editOutlineLayerId)) {
                window.mapInstance.removeLayer(editOutlineLayerId);
            }
            if (window.mapInstance.getSource(editSourceId)) {
                window.mapInstance.removeSource(editSourceId);
            }

            if (window.mapInstance.getLayer(outlineLayerId)) {
                window.mapInstance.removeLayer(outlineLayerId);
            }
            if (window.mapInstance.getLayer(layerId)) {
                window.mapInstance.removeLayer(layerId);
            }
            if (window.mapInstance.getSource(sourceId)) {
                window.mapInstance.removeSource(sourceId);
            }
            if (window.mapInstance.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = "";
            }
        }

        if (showCreatePatch) {
            store.get<{ on: Function }>("onDrawRectangle")!.on();
        }

        if (item === "schema") {
            setActivePanel("schema");
            setShowCreateSchema(false);
            setShowCreateProject(false);
            setshowCreatePatch(false);
            clearMapDrawElements();
            layer.removeResource();
        } else if (item === "project") {
            clearMapDrawElements();
            setActivePanel("project");
            setShowCreateProject(false);
            setshowCreatePatch(false);
            layer.removeResource();
        } else if (item === "feature") {
            setActivePanel("feature");
        }

        if (item !== "feature") {
            const map = window.mapInstance;
            if (map) {
                const layers = map.getStyle()?.layers ?? [];
                layers.forEach((layer) => {
                    if (layer.id.endsWith("feature")) {
                        map.removeLayer(layer.id);
                    }
                });
                Object.keys(map.getStyle()?.sources ?? {}).forEach((sourceId) => {
                    if (sourceId.endsWith("feature")) {
                        map.removeSource(sourceId);
                    }
                });
            }
            setLayers([]);
            setSelectedLayerId(null);
            const draw = window.mapboxDrawInstance;
            if (draw) {
                draw.deleteAll();
            }
            setIsDrawing(false);
            setRectangleCoordinates(null);
        }
    };

    const handleNextClick = () => {
        if (!activeBreadcrumb || activeBreadcrumb === "schema") {
            handleBreadcrumbClick("project");
        }
    };

    const handlePreviousClick = () => {
        if (!activeBreadcrumb || activeBreadcrumb === "project") {
            handleBreadcrumbClick("schema");
        } else {
            handleBreadcrumbClick("project");
        }
    };

    const handleCreateProjectFromSchema = useCallback(
        (schemaName: string, epsg: string, level: string) => {
            setSelectedSchemaName(schemaName);
            setSelectedSchemaEpsg(epsg);
            setSelectedSchemaLevel(level);
            setActivePanel("project");
            setShowCreateProject(true);
            setActiveBreadcrumb("project");
            const schemaService = new SchemaService(language);
            schemaService.getSchemaByName(schemaName, (err, result) => {
                if (err) {
                    console.error("获取schema详情失败:", err);
                    return;
                }
                const schema = result;
                if (schema) {
                    const markerManager = new MapMarkerManager(language, () => { });
                    markerManager.clearAllMarkers();
                    markerManager.showAllSchemasOnMap([schema]);
                }
            });
        },
        [language]
    );

    const handleCreatePatch = useCallback(
        (
            parentProject: any,
            schemaName?: string,
            epsg?: string,
            gridInfo?: string
        ) => {
            setSelectedParentProject(parentProject);
            if (schemaName) {
                setSelectedSchemaName(schemaName);
            }
            if (epsg) {
                setSelectedSchemaEpsg(epsg);
            }
            if (gridInfo) {
                setSelectedSchemaLevel(gridInfo);
            }
            setActivePanel("project");
            setshowCreatePatch(true);
            setActiveBreadcrumb("project");
        },
        []
    );

    const renderActivePanel = () => {
        if (activePanel === "schema") {
            if (showCreateSchema) {
                return <CreateSchema onBack={() => setShowCreateSchema(false)} />;
            }
            return (
                <SchemaPanel
                    onCreateNew={() => setShowCreateSchema(true)}
                    onCreateProject={handleCreateProjectFromSchema}
                />
            );
        } else if (activePanel === "project") {
            if (showCreateProject) {
                return (
                    <CreateProject
                        onBack={() => {
                            setShowCreateProject(false);
                            setRectangleCoordinates(null);
                            setIsDrawing(false);
                        }}
                        onDrawRectangle={handleDrawRectangle}
                        rectangleCoordinates={rectangleCoordinates}
                        isDrawing={isDrawing}
                        initialSchemaName={selectedSchemaName}
                        initialEpsg={selectedSchemaEpsg}
                        initialSchemaLevel={selectedSchemaLevel}
                        setRectangleCoordinates={setRectangleCoordinates}
                    />
                );
            }
            if (showCreatePatch) {
                return (
                    <CreatePatch
                        onBack={() => {
                            setshowCreatePatch(false);
                            setRectangleCoordinates(null);
                            setIsDrawing(false);
                        }}
                        onDrawRectangle={handleDrawRectangle}
                        rectangleCoordinates={rectangleCoordinates}
                        isDrawing={isDrawing}
                        initialSchemaName={selectedParentProject?.schema_name}
                        initialEpsg={selectedSchemaEpsg}
                        initialSchemaLevel={selectedSchemaLevel}
                        parentProject={selectedParentProject}
                        cornerMarker={cornerMarker}
                        setCornerMarker={setCornerMarker}
                        schemaMarker={schemaMarker}
                        setSchemaMarker={setSchemaMarker}
                        gridLine={gridLine}
                        setGridLine={setGridLine}
                        gridLabel={gridLabel}
                        setGridLabel={setGridLabel}
                        setRectangleCoordinates={setRectangleCoordinates}
                        clearMapDrawElements={clearMapDrawElements}
                    />
                );
            }
            return <ProjectPanel onCreatePatch={handleCreatePatch} />;
        } else if (activePanel === "grid") {
            return (
                <GridPanel
                    onBack={() => {
                        setActivePanel("project");
                        setActiveBreadcrumb("project");
                    }}
                />
            );
        } else if (activePanel === "raster") {
            return (
                <RasterPanel
                    onBack={() => {
                        setActivePanel("project");
                        setActiveBreadcrumb("project");
                    }}
                    layers={rasterLayers}
                    setLayers={setRasterLayers}
                    selectedLayerId={selectedLayerId}
                    setSelectedLayerId={setSelectedLayerId}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    iconOptions={iconOptions}
                    symbologyOptions={symbologyOptions}
                    getIconString={getIconString}
                    getIconComponent={getIconComponent}
                />
            );
        } else if (activePanel === "feature") {
            return (
                <FeaturePanel
                    onBack={() => {
                        setActivePanel("project");
                        setActiveBreadcrumb("project");
                        setRectangleCoordinates(null);
                        setIsDrawing(false);
                    }}
                    layers={layers}
                    setLayers={setLayers}
                    selectedLayerId={selectedLayerId}
                    setSelectedLayerId={setSelectedLayerId}
                    isEditMode={isEditMode}
                    setIsEditMode={setIsEditMode}
                    iconOptions={iconOptions}
                    symbologyOptions={symbologyOptions}
                    getIconString={getIconString}
                    getIconComponent={getIconComponent}
                />
            );
        } else if (activePanel === "aggregation") {
            return (
                <AggregationPanel
                    onBack={() => {
                        setActivePanel("project");
                        setActiveBreadcrumb("project");
                    }}
                />
            );
        }
        return (
            <SchemaPanel
                onCreateNew={() => setShowCreateSchema(true)}
                onCreateProject={handleCreateProjectFromSchema}
            />
        );
    };

    return (
        <SidebarProvider className="h-full max-h-full">
            {renderActivePanel()}
            <SidebarInset className="max-h-full relative">
                <header className="flex h-16 shrink-0 items-center border-b-1 border-b-gray-200 px-4">
                    <SidebarTrigger className="-ml-2 mr-2 cursor-pointer" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-center gap-2 ml-2">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink
                                        className={
                                            activeBreadcrumb === "schema"
                                                ? "text-[#71F6FF] font-bold"
                                                : ""
                                        }
                                        onClick={() => handleBreadcrumbClick("schema")}
                                    >
                                        {breadcrumbText.schema[language]}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        className={
                                            activeBreadcrumb === "project"
                                                ? "text-[#71F6FF] font-bold"
                                                : ""
                                        }
                                        onClick={() => handleBreadcrumbClick("project")}
                                    >
                                        {breadcrumbText.project[language]}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        className={
                                            activePanel === "grid"
                                                ? activeBreadcrumb === "grid"
                                                    ? "text-[#71F6FF] font-bold"
                                                    : ""
                                                : activePanel === "raster"
                                                    ? activeBreadcrumb === "raster"
                                                        ? "text-[#71F6FF] font-bold"
                                                        : ""
                                                    : activePanel === "feature"
                                                        ? activeBreadcrumb === "feature"
                                                            ? "text-[#71F6FF] font-bold"
                                                            : ""
                                                        : activePanel === "aggregation"
                                                            ? activeBreadcrumb === "aggregation"
                                                                ? "text-[#71F6FF] font-bold"
                                                                : ""
                                                            : activeBreadcrumb === "editor"
                                                                ? "text-[#71F6FF] font-bold"
                                                                : ""
                                        }
                                    >
                                        {activePanel === "grid"
                                            ? breadcrumbText.grid[language]
                                            : activePanel === "raster"
                                                ? breadcrumbText.raster[language]
                                                : activePanel === "feature"
                                                    ? breadcrumbText.feature[language]
                                                    : activePanel === "aggregation"
                                                        ? breadcrumbText.aggregation[language]
                                                        : breadcrumbText.editor[language]}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <Separator orientation="vertical" className="mr-2 ml-4 h-4" />
                    <div className="ml-2 gap-8 flex">
                        <div className="flex items-center">
                            <span className="text-gray-500 justify-center text-sm">
                                {language === "zh" ? "高速模式" : "High Speed Mode"}
                            </span>
                            <Switch
                                className="ml-2 cursor-pointer data-[state=checked]:bg-green-500"
                                checked={highSpeedModeEnabled}
                                onCheckedChange={() => {
                                    store.set("highSpeedModeState", !highSpeedModeEnabled);
                                    setHighSpeedModeEnabled(!highSpeedModeEnabled);
                                }}
                            />
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-500 justify-center text-sm">
                                {language === "zh" ? "AI助手模式" : "AI Assistant Mode"}
                            </span>
                            <Switch
                                className="ml-2 cursor-pointer data-[state=checked]:bg-[#00C0FF]"
                                checked={aiDialogEnabled}
                                onCheckedChange={setAIDialogEnabled}
                            />
                        </div>
                    </div>

                    {/* User Avatar */}
                    <div className="ml-auto mr-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="cursor-pointer">
                                    <AvatarImage src={beststar} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                    {language === "zh" ? "我的账户" : "My Account"}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    {language === "zh" ? "个人资料" : "Profile"}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    {language === "zh" ? "设置" : "Settings"}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    {language === "zh" ? "登录" : "Login"}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    {language === "zh" ? "注册" : "Register"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>
                {activeBreadcrumb === "feature" && (
                    <FeatureToolbar
                        layers={layers}
                        setLayers={setLayers}
                        selectedLayerId={selectedLayerId}
                        setSelectedLayerId={setSelectedLayerId}
                        iconOptions={iconOptions}
                        getIconComponent={getIconComponent}
                        getIconString={getIconString}
                        symbologyOptions={symbologyOptions}
                        isEditMode={isEditMode}
                        setIsEditMode={setIsEditMode}
                    />
                )}
                {activeBreadcrumb === "raster" && (
                    <RasterToolbar />
                )}

                <div className="h-screen group-data-[state=expanded]/sidebar-wrapper:w-[calc(100vw-var(--sidebar-width))] group-data-[state=collapsed]/sidebar-wrapper:w-[calc(100vw-var(--sidebar-width-icon))] relative">
                    {activeBreadcrumb === "grid" && updateCapacity && <CapacityBar />}
                    <MapInit ref={mapRef} onRectangleDrawn={handleRectangleDrawn} />
                    {aiDialogEnabled && (
                        <ChatPanel
                            isOpen={isChatOpen}
                            onClose={() => setIsChatOpen(false)}
                        />
                    )}
                    <div className="fixed flex flex-row gap-4 bottom-6 right-6 z-5">
                        {aiDialogEnabled && (
                            <Button
                                className="rounded-md px-4 py-2 flex items-center justify-center bg-[#00C0FF] hover:bg-blue-400 shadow-lg text-white cursor-pointer"
                                onClick={toggleChat}
                            >
                                <span>
                                    {isChatOpen
                                        ? language === "zh"
                                            ? "关闭AI对话"
                                            : "Close AI Chat"
                                        : language === "zh"
                                            ? "打开AI对话"
                                            : "Open AI Chat"}
                                </span>
                            </Button>
                        )}
                        {activeBreadcrumb !== "editor" && (
                            <>
                                {activeBreadcrumb === "schema" && (
                                    <Button
                                        className="rounded-md px-4 py-2 flex items-center justify-center bg-gray-800 hover:bg-gray-700 shadow-lg text-white cursor-pointer"
                                        onClick={handleNextClick}
                                        aria-label={language === "zh" ? "下一步" : "Next"}
                                        title={language === "zh" ? "下一步" : "Next"}
                                    >
                                        <span>{language === "zh" ? "下一步" : "Next"}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                )}
                                {(activeBreadcrumb === "project" ||
                                    activeBreadcrumb === "grid" ||
                                    activeBreadcrumb === "raster" ||
                                    activeBreadcrumb === "feature" ||
                                    activeBreadcrumb === "aggregation") && (
                                        <Button
                                            className="rounded-md px-4 py-2 flex items-center justify-center bg-gray-800 hover:bg-gray-700 shadow-lg text-white cursor-pointer"
                                            onClick={handlePreviousClick}
                                            aria-label={language === "zh" ? "上一步" : "Previous"}
                                            title={language === "zh" ? "上一步" : "Previous"}
                                        >
                                            <ArrowLeft className="h-4 w-4" />
                                            <span>{language === "zh" ? "上一步" : "Previous"}</span>
                                        </Button>
                                    )}
                            </>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
