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
import { SidebarContext, LanguageContext } from '../App';
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
import { Schema } from './schemaPanel/types/types';

export type SidebarType = 'operate' | 'schema' | 'project' | null;
export type BreadcrumbType =
  | 'schema'
  | 'project'
  | 'topology'
  | 'attribute'
  | null;

export default function Page() {
  const mapRef = useRef<{
    startDrawRectangle: (cancel?: boolean) => void;
    startPointSelection: (cancel?: boolean) => void;
  }>(null);
  const [rectangleCoordinates, setRectangleCoordinates] =
    useState<RectangleCoordinates | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showCreateSchema, setShowCreateSchema] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [activeBreadcrumb, setActiveBreadcrumb] =
    useState<BreadcrumbType>(null);
  const [activePanel, setActivePanel] = useState<'schema' | 'project' | null>(
    null
  );
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

  useEffect(() => {
    if (activeSidebar === 'schema') {
      setActiveBreadcrumb('schema');
      setActivePanel('schema');
    }
  }, [activeSidebar]);

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

  const handleBreadcrumbClick = (item: BreadcrumbType) => {
    setActiveBreadcrumb(item);
    if (item === 'schema') {
      setActivePanel('schema');
      setShowCreateSchema(false);
    } else if (item === 'project') {
      setActivePanel('project');
      setShowCreateProject(false);
    }
  };

  const handleNextClick = () => {
    if (!activeBreadcrumb || activeBreadcrumb === 'schema') {
      handleBreadcrumbClick('project');
    } else if (activeBreadcrumb === 'project') {
      setActiveBreadcrumb('topology');
    } else if (activeBreadcrumb === 'topology') {
      setActiveBreadcrumb('attribute');
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
      schemaService
        .getSchemaByName(schemaName)
        .then((schema: Schema) => {
          if (schema) {
            const markerManager = new MapMarkerManager(language, () => {});
            markerManager.clearAllMarkers();
            markerManager.showAllSchemasOnMap([schema]);
          }
        })
        .catch((error: Error) => {
          console.error('Failed to fetch schema for marker display:', error);
        });
    },
    [language]
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
    if (activeSidebar === 'operate') {
      return (
        <OperateSideBar
          className="max-h-full"
          onDrawRectangle={handleDrawRectangle}
          rectangleCoordinates={rectangleCoordinates}
          isDrawing={isDrawing}
        />
      );
    }

    if (activeSidebar === 'schema') {
      if (activePanel === 'schema') {
        if (showCreateSchema) {
          return <CreateSchema onBack={() => setShowCreateSchema(false)} />;
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
              onBack={() => setShowCreateProject(false)}
              onDrawRectangle={handleDrawRectangle}
              rectangleCoordinates={rectangleCoordinates}
              isDrawing={isDrawing}
              initialSchemaName={selectedSchemaName}
              initialEpsg={selectedSchemaEpsg}
              initialSchemaLevel={selectedSchemaLevel}
            />
          );
        }
        return <ProjectPanel />;
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
        <header className="flex h-16 shrink-0 items-center border-b-gray-400 px-4">
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
                    onClick={() => handleBreadcrumbClick('schema')}
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
                    onClick={() => handleBreadcrumbClick('project')}
                  >
                    {breadcrumbText.project[language]}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    className={
                      activeBreadcrumb === 'topology'
                        ? 'text-[#71F6FF] font-bold'
                        : ''
                    }
                    onClick={() => handleBreadcrumbClick('topology')}
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
                    onClick={() => handleBreadcrumbClick('attribute')}
                  >
                    {breadcrumbText.attribute[language]}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="fixed top-21 right-10 z-50">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="cursor-pointer">
                  <AvatarImage src={beststar} />
                  <AvatarFallback>U</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {language === 'zh' ? '我的账户' : 'My Account'}
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
        <div className="h-screen w-screen">
          <MapInit ref={mapRef} onRectangleDrawn={handleRectangleDrawn} />

          <div className="fixed bottom-6 right-6 z-50">
            <Button
              className="rounded-md px-4 py-2 flex items-center justify-center bg-gray-800 hover:bg-gray-700 shadow-lg text-white"
              onClick={handleNextClick}
              aria-label={language === 'zh' ? '下一步' : 'Next'}
              title={language === 'zh' ? '下一步' : 'Next'}
            >
              <span className="mr-2">
                {language === 'zh' ? '下一步' : 'Next'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
