import { useRef, useState, useContext, useEffect, useCallback } from 'react';
import { OperateSideBar } from './operatePanel/operateSideBar';
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';
import MapInit from './mapComponent/mapInit';
import { RectangleCoordinates } from './operatePanel/operatePanel';
import SchemaPanel from './schemaPanel/schemaPanel';
import CreateSchema from './schemaPanel/createSchema';
import ProjectPanel from './projectPanel/projectPanel';
import CreateProject from './projectPanel/createProject';
import { SidebarContext, LanguageContext, AIDialogContext } from '../context';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import beststar from '../assets/beststar.jpg';
import { SchemaService } from './schemaPanel/utils/SchemaService';
import { MapMarkerManager } from './schemaPanel/utils/MapMarkerManager';
import { Switch } from '@/components/ui/switch';
import ChatPanel from './chatPanel/chatPanel';
import CreateSubProject from './projectPanel/createSubProject';
import { clearMapMarkers } from './schemaPanel/utils/SchemaCoordinateService';
import store from '@/store';
import NHLayerGroup from './mapComponent/utils/NHLayerGroup';
import TopologyLayer from './mapComponent/layers/TopologyLayer';
import CapacityBar from './ui/capacityBar';
import TopologyPanel from './topologyPanel/TopologyPanel';

export type SidebarType = 'home' | 'aggregation' | 'simulation' | null;
export type BreadcrumbType = 'schema' | 'project' | 'editor' | null;

export default function Page() {
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [cornerMarker, setCornerMarker] = useState<mapboxgl.Marker | null>(
        null
    );
    const [gridLine, setGridLine] = useState<string | null>(null);
    const [gridLabel, setGridLabel] = useState<mapboxgl.Marker | null>(null);
    const [schemaMarker, setSchemaMarker] = useState<mapboxgl.Marker | null>(
        null
    );

    const [updateCapacity, setUpdateCapacity] = useState(false);
    store.set('updateCapacity', {
        on: () => {
            setUpdateCapacity(true);
        },
        off: () => {
            setUpdateCapacity(false);
        },
    });

    const mapRef = useRef<{
        startDrawRectangle: (cancel?: boolean) => void;
        startPointSelection: (cancel?: boolean) => void;
        flyToSubprojectBounds: (
            projectName: string,
            subprojectName: string
        ) => Promise<void>;
        showSubprojectBounds: (
            projectName: string,
            subprojects: any[],
            show: boolean
        ) => void;
        highlightSubproject: (
            projectName: string,
            subprojectName: string
        ) => void;
    }>(null);
    const [rectangleCoordinates, setRectangleCoordinates] =
        useState<RectangleCoordinates | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [showCreateSchema, setShowCreateSchema] = useState(false);
    const [showCreateProject, setShowCreateProject] = useState(false);
    const [showCreateSubProject, setShowCreateSubProject] = useState(false);
    const [selectedParentProject, setSelectedParentProject] =
        useState<any>(null);
    const [activeBreadcrumb, setActiveBreadcrumb] =
        useState<BreadcrumbType>(null);
    const [activePanel, setActivePanel] = useState<
        'schema' | 'project' | 'editor' | null
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

    const [highSpeedModeEnabled, setHighSpeedModeEnabled] = useState(false);

    const { activeNavbar, setActiveNavbar } = useContext(SidebarContext);
    const { language } = useContext(LanguageContext);
    const { aiDialogEnabled, setAIDialogEnabled } = useContext(AIDialogContext);

    store.set(
        'activePanelChange',
        (activePanel: 'schema' | 'project' | 'editor' | null) => {
            setActivePanel(activePanel);
            setActiveBreadcrumb(activePanel);
        }
    );

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    useEffect(() => {
        if (activeNavbar === 'aggregation') {
            setActiveBreadcrumb('schema');
            setActivePanel('schema');
        }
    }, [activeNavbar]);

    useEffect(() => {
        if (activePanel || activeNavbar) {
            const event = new Event('activePanelChange');
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

    // useEffect(() => {
    //     const handleSwitchToTopology = (event: any) => {
    //         const { projectName, subprojectName } = event.detail;
    //         setActivePanel('editor');
    //         setActiveBreadcrumb('editor');
    //     };

    //     window.addEventListener('switchToEditorPanel', handleSwitchToTopology);

    //     return () => {
    //         window.removeEventListener(
    //             'switchToEditorPanel',
    //             handleSwitchToTopology
    //         );
    //     };
    // }, []);

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

        // Clear TopologyLayer resource
        const clg = store.get<NHLayerGroup>('clg')!;
        const layer = clg.getLayerInstance('TopologyLayer')! as TopologyLayer;
        layer.removeResource();

        if (item === 'schema') {
            if (window.mapInstance) {
                const sourceId = `subproject-bounds-临时项目`;
                const layerId = `subproject-fill-临时项目`;
                const outlineLayerId = `subproject-outline-临时项目`;

                if (window.mapInstance.getLayer(outlineLayerId)) {
                    window.mapInstance.removeLayer(outlineLayerId);
                }
                if (window.mapInstance.getLayer(layerId)) {
                    window.mapInstance.removeLayer(layerId);
                }
                if (window.mapInstance.getSource(sourceId)) {
                    window.mapInstance.removeSource(sourceId);
                }
            }
            setActivePanel('schema');
            setShowCreateSchema(false);
            clearMapMarkers();
            setShowCreateProject(false);
            setShowCreateSubProject(false);
            clearMapDrawElements();
            if (window.mapInstance && window.mapInstance.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = '';
            }
            layer.removeResource();
        } else if (item === 'project') {
            if (window.mapInstance) {
                const sourceId = `subproject-bounds-临时项目`;
                const layerId = `subproject-fill-临时项目`;
                const outlineLayerId = `subproject-outline-临时项目`;

                if (window.mapInstance.getLayer(outlineLayerId)) {
                    window.mapInstance.removeLayer(outlineLayerId);
                }
                if (window.mapInstance.getLayer(layerId)) {
                    window.mapInstance.removeLayer(layerId);
                }
                if (window.mapInstance.getSource(sourceId)) {
                    window.mapInstance.removeSource(sourceId);
                }
            }
            clearMapMarkers();
            clearMapDrawElements();
            if (window.mapInstance && window.mapInstance.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = '';
            }
            setActivePanel('project');
            setShowCreateProject(false);
            setShowCreateSubProject(false);
            layer.removeResource();
        }
    };

    const handleNextClick = () => {
        if (!activeBreadcrumb || activeBreadcrumb === 'schema') {
            handleBreadcrumbClick('project');
        }
    };
    const handlePreviousClick = () => {
        if (!activeBreadcrumb || activeBreadcrumb === 'project') {
            handleBreadcrumbClick('schema');
        }
    };

    const handleCreateProjectFromSchema = useCallback(
        (schemaName: string, epsg: string, level: string) => {
            setSelectedSchemaName(schemaName);
            setSelectedSchemaEpsg(epsg);
            setSelectedSchemaLevel(level);
            setActivePanel('project');
            setShowCreateProject(true);
            setActiveBreadcrumb('project');
            const schemaService = new SchemaService(language);
            schemaService.getSchemaByName(schemaName, (err, result) => {
                if (err) {
                    console.error('获取schema详情失败:', err);
                    return;
                }
                const schema = result;
                if (schema) {
                    const markerManager = new MapMarkerManager(
                        language,
                        () => {}
                    );
                    markerManager.clearAllMarkers();
                    markerManager.showAllSchemasOnMap([schema]);
                }
            });
        },
        [language]
    );

    const handleCreateSubProject = useCallback(
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
            setActivePanel('project');
            setShowCreateSubProject(true);
            setActiveBreadcrumb('project');
        },
        []
    );

    const breadcrumbText = {
        schema: {
            zh: '模板',
            en: 'Schema',
        },
        project: {
            zh: '项目',
            en: 'Project',
        },
        editor: {
            zh: '编辑',
            en: 'Editor',
        },
        topology: {
            zh: '拓扑',
            en: 'Topology',
        },
        attribute: {
            zh: '属性',
            en: 'Attribute',
        },
    };

    const renderActivePanel = () => {
        if (activePanel === 'schema') {
            if (showCreateSchema) {
                return (
                    <CreateSchema onBack={() => setShowCreateSchema(false)} />
                );
            }
            return (
                <SchemaPanel
                    onCreateNew={() => setShowCreateSchema(true)}
                    onCreateProject={handleCreateProjectFromSchema}
                />
            );
        } else if (activePanel === 'project') {
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
            if (showCreateSubProject) {
                return (
                    <CreateSubProject
                        onBack={() => {
                            setShowCreateSubProject(false);
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
            return <ProjectPanel onCreateSubProject={handleCreateSubProject} />;
        } else if (activePanel === 'editor') {
            return (
                <TopologyPanel
                    onBack={() => {
                        setActivePanel('project');
                        setActiveBreadcrumb('project');
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
        // }

        return null;
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
                                            activeBreadcrumb === 'schema'
                                                ? 'text-[#71F6FF] font-bold'
                                                : ''
                                        }
                                        onClick={() =>
                                            handleBreadcrumbClick('schema')
                                        }
                                    >
                                        {breadcrumbText.schema[language]}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        className={
                                            activeBreadcrumb === 'project'
                                                ? 'text-[#71F6FF] font-bold'
                                                : ''
                                        }
                                        onClick={() =>
                                            handleBreadcrumbClick('project')
                                        }
                                    >
                                        {breadcrumbText.project[language]}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        className={
                                            activeBreadcrumb === 'editor'
                                                ? 'text-[#71F6FF] font-bold'
                                                : ''
                                        }
                                    >
                                        {breadcrumbText.editor[language]}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <Separator
                        orientation="vertical"
                        className="mr-2 ml-4 h-4"
                    />
                    <div className="ml-2 gap-8 flex">
                        <div className="flex items-center">
                            <span className="text-gray-500 justify-center text-sm">
                                {language === 'zh'
                                    ? 'AI助手模式'
                                    : 'AI Assistant Mode'}
                            </span>
                            <Switch
                                className="ml-2 cursor-pointer data-[state=checked]:bg-[#00C0FF]"
                                checked={aiDialogEnabled}
                                onCheckedChange={setAIDialogEnabled}
                            />
                        </div>
                        <div className="flex items-center">
                            <span className="text-gray-500 justify-center text-sm">
                                {language === 'zh'
                                    ? '高速模式'
                                    : 'High Speed Mode'}
                            </span>
                            <Switch
                                className="ml-2 cursor-pointer data-[state=checked]:bg-green-500"
                                checked={highSpeedModeEnabled}
                                onCheckedChange={() => {
                                    store.set(
                                        'highSpeedModeState',
                                        !highSpeedModeEnabled
                                    );
                                    setHighSpeedModeEnabled(
                                        !highSpeedModeEnabled
                                    );
                                }}
                            />
                        </div>
                    </div>

                    {/* 用户头像 */}
                    {/* <div className="ml-auto mr-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Avatar className="cursor-pointer">
                                    <AvatarImage src={beststar} />
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>
                                    {language === 'zh'
                                        ? '我的账户'
                                        : 'My Account'}
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    {language === 'zh' ? '个人资料' : 'Profile'}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    {language === 'zh' ? '设置' : 'Settings'}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>
                                    {language === 'zh' ? '登录' : 'Login'}
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    {language === 'zh' ? '注册' : 'Register'}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div> */}
                </header>
                <div className="h-screen group-data-[state=expanded]/sidebar-wrapper:w-[calc(100vw-var(--sidebar-width))] group-data-[state=collapsed]/sidebar-wrapper:w-[calc(100vw-var(--sidebar-width-icon))] relative">
                    {activeBreadcrumb === 'editor' && updateCapacity && (
                        <CapacityBar />
                    )}
                    <MapInit
                        ref={mapRef}
                        onRectangleDrawn={handleRectangleDrawn}
                    />
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
                                        ? language === 'zh'
                                            ? '关闭AI对话'
                                            : 'Close AI Chat'
                                        : language === 'zh'
                                        ? '打开AI对话'
                                        : 'Open AI Chat'}
                                </span>
                            </Button>
                        )}
                        {activeBreadcrumb !== 'editor' && (
                            <>
                                {activeBreadcrumb === 'schema' && (
                                    <Button
                                        className="rounded-md px-4 py-2 flex items-center justify-center bg-gray-800 hover:bg-gray-700 shadow-lg text-white cursor-pointer"
                                        onClick={handleNextClick}
                                        aria-label={
                                            language === 'zh'
                                                ? '下一步'
                                                : 'Next'
                                        }
                                        title={
                                            language === 'zh'
                                                ? '下一步'
                                                : 'Next'
                                        }
                                    >
                                        <span>
                                            {language === 'zh'
                                                ? '下一步'
                                                : 'Next'}
                                        </span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                )}
                                {activeBreadcrumb === 'project' && (
                                    <Button
                                        className="rounded-md px-4 py-2 flex items-center justify-center bg-gray-800 hover:bg-gray-700 shadow-lg text-white cursor-pointer"
                                        onClick={handlePreviousClick}
                                        aria-label={
                                            language === 'zh'
                                                ? '上一步'
                                                : 'Previous'
                                        }
                                        title={
                                            language === 'zh'
                                                ? '上一步'
                                                : 'Previous'
                                        }
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        <span>
                                            {language === 'zh'
                                                ? '上一步'
                                                : 'Previous'}
                                        </span>
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
