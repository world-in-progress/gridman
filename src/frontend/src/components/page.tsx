import { useRef, useState, useContext } from 'react';
import { OperateSideBar } from './operatePanel/operateSideBar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import MapInit from './mapComponent/mapInit';
import OperatePanel, {
  RectangleCoordinates,
} from './operatePanel/operatePanel';
import SchemaPanel from './schemaPanel/schemaPanel';
import { SidebarContext, LanguageContext } from '../App';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import beststar from '../assets/beststar.jpg';

// 侧边栏类型枚举
export type SidebarType = 'operate' | 'schema' | null;

export default function Page() {
  const mapRef = useRef<{ startDrawRectangle: (cancel?: boolean) => void }>(
    null
  );
  const [rectangleCoordinates, setRectangleCoordinates] =
    useState<RectangleCoordinates | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // 使用上下文中的侧边栏状态
  const { activeSidebar } = useContext(SidebarContext);
  // 使用全局语言上下文
  const { language } = useContext(LanguageContext);

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

  return (
    <SidebarProvider className="h-full max-h-full">
      {activeSidebar === 'operate' && (
        <OperateSideBar
          className="max-h-full"
          onDrawRectangle={handleDrawRectangle}
          rectangleCoordinates={rectangleCoordinates}
          isDrawing={isDrawing}
        />
      )}
      {activeSidebar === 'schema' && <SchemaPanel />}
      <SidebarInset className="max-h-full relative">
        <header className="flex h-16 shrink-0 items-center  border-b px-4">
          <SidebarTrigger className="-ml-1 mr-2" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 ml-2">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink>Schema</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Project</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Topology</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Attribute</BreadcrumbPage>
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
