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
import { SidebarContext } from '../App';

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
      {activeSidebar === 'schema' && (
        <SchemaPanel />
      )}
      <SidebarInset className="max-h-full relative">
        <div className="absolute top-2 left-2 z-10">
          <SidebarTrigger />
        </div>
        <div className="h-screen w-screen">
          <MapInit ref={mapRef} onRectangleDrawn={handleRectangleDrawn} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
