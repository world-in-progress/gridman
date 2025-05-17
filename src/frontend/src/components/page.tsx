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
import {
    SidebarContext,
    LanguageContext,
    AIDialogContext,
    GridRecorderContext,
} from '../context';
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
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
import EditorPanel from './editorPanel/editorPanel';
import { clearMapMarkers } from './schemaPanel/utils/SchemaCoordinateService';
import store from '@/store';
import NHLayerGroup from './mapComponent/utils/NHLayerGroup';
import TopologyLayer from './mapComponent/layers/TopologyLayer';
import CapacityTest from './capacityTest';

export type SidebarType = 'grid' | 'terrain' | 'project' | null;
export type BreadcrumbType = 'schema' | 'project' | 'editor' | null;

export default function Page() {
    const [isLoading, setIsLoading] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isSelectingPoint, setIsSelectingPoint] = useState(false);
    const [cornerMarker, setCornerMarker] = useState<mapboxgl.Marker | null>(
        null
    );
    const [gridLine, setGridLine] = useState<string | null>(null);
    const [gridLabel, setGridLabel] = useState<mapboxgl.Marker | null>(null);
    const [schemaMarker, setSchemaMarker] = useState<mapboxgl.Marker | null>(
        null
    );

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
    // const [activePanel, setActivePanel] = useState<
    //     'schema' | 'project' | 'editor' | 'topology' | null
    // >(null);
    const [selectedSchemaName, setSelectedSchemaName] = useState<
        string | undefined
    >(undefined);
    const [selectedSchemaEpsg, setSelectedSchemaEpsg] = useState<
        string | undefined
    >(undefined);
    const [selectedSchemaLevel, setSelectedSchemaLevel] = useState<
        string | undefined
    >(undefined);

    const { activeSidebar, setActiveSidebar } = useContext(SidebarContext);
    const { language } = useContext(LanguageContext);
    const { aiDialogEnabled, setAIDialogEnabled } = useContext(AIDialogContext);

    const toggleChat = () => {
        setIsChatOpen(!isChatOpen);
    };

    useEffect(() => {
        if (activeSidebar === 'grid') {
            setActiveBreadcrumb('schema');
            setActivePanel('schema');
        }
    }, [activeSidebar]);

    useEffect(() => {
        if (activePanel || activeSidebar) {
            const event = new Event('activePanelChange');
            window.dispatchEvent(event);
        }
    }, [activePanel, activeSidebar]);

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
        const handleSwitchToTopology = (event: any) => {
            const { projectName, subprojectName } = event.detail;
            setActivePanel('editor');
            setActiveBreadcrumb('editor');
        };

        window.addEventListener('switchToEditorPanel', handleSwitchToTopology);

        return () => {
            window.removeEventListener(
                'switchToEditorPanel',
                handleSwitchToTopology
            );
        };
    }, []);

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

    const clearMapElements = () => {
        if (window.mapboxDrawInstance) {
            window.mapboxDrawInstance.deleteAll();
        }

        setRectangleCoordinates(null);

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
            setActivePanel('schema');
            setShowCreateSchema(false);
            clearMapMarkers();
            setIsSelectingPoint(false);
            setShowCreateProject(false);
            setShowCreateSubProject(false);
            clearMapElements();
            if (window.mapInstance && window.mapInstance.getCanvas()) {
                window.mapInstance.getCanvas().style.cursor = '';
            }
            layer.removeResource();
        } else if (item === 'project') {
            clearMapMarkers();
            setIsSelectingPoint(false);
            clearMapElements();
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
        if (activeSidebar === 'terrain') {
            return (
                <OperateSideBar
                    className="max-h-full"
                    onDrawRectangle={handleDrawRectangle}
                    rectangleCoordinates={rectangleCoordinates}
                    isDrawing={isDrawing}
                />
            );
        }

        if (activeSidebar === 'grid') {
            if (activePanel === 'schema') {
                if (showCreateSchema) {
                    return (
                        <CreateSchema
                            onBack={() => setShowCreateSchema(false)}
                        />
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
                            initialSchemaName={
                                selectedParentProject?.schema_name
                            }
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
                        />
                    );
                }
                return (
                    <ProjectPanel onCreateSubProject={handleCreateSubProject} />
                );
            } else if (activePanel === 'editor') {
                return (
                    <EditorPanel
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
        }

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
                                {/* <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        className={
                                            activeBreadcrumb === 'topology'
                                                ? 'text-[#71F6FF] font-bold'
                                                : ''
                                        }
                                    >
                                        {breadcrumbText.topology[language]}
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbLink
                                        className={
                                            activeBreadcrumb === 'attribute'
                                                ? 'text-[#71F6FF] font-bold'
                                                : ''
                                        }
                                    >
                                        {breadcrumbText.attribute[language]}
                                    </BreadcrumbLink>
                                </BreadcrumbItem> */}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <Separator
                        orientation="vertical"
                        className="mr-2 ml-4 h-4"
                    />
                    <div className="flex items-center">
                        <span className="ml-2 text-gray-500 justify-center text-sm">
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
                    <div className="fixed top-21 right-10 z-[50]">
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
                    </div>
                </header>
                <div className="h-screen group-data-[state=expanded]/sidebar-wrapper:w-[calc(100vw-var(--sidebar-width))] group-data-[state=collapsed]/sidebar-wrapper:w-[calc(100vw-var(--sidebar-width-icon))] relative">
                    <div className="absolute flex flex-row gap-4 top-0 left-0 z-5">
                        <CapacityTest />
                    </div>
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
                        {(activePanel === 'schema' || 'project') && (
                            <Button
                                className="rounded-md px-4 py-2 flex items-center justify-center bg-gray-800 hover:bg-gray-700 shadow-lg text-white cursor-pointer"
                                onClick={handleNextClick}
                                aria-label={
                                    language === 'zh' ? '下一步' : 'Next'
                                }
                                title={language === 'zh' ? '下一步' : 'Next'}
                            >
                                <span>
                                    {language === 'zh' ? '下一步' : 'Next'}
                                </span>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
