import { useRef, useState } from 'react';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarDemo } from './sideBar/sideBarDemo';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import MapInit from './mapComponent/mapInit';
import OperatePanel, {
  RectangleCoordinates,
} from './operatePanel/operatePanel';

export default function Page() {
  const mapRef = useRef<{ startDrawRectangle: (cancel?: boolean) => void }>(
    null
  );
  const [rectangleCoordinates, setRectangleCoordinates] =
    useState<RectangleCoordinates | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
      <AppSidebarDemo 
        className="max-h-full"
        onDrawRectangle={handleDrawRectangle}
        rectangleCoordinates={rectangleCoordinates}
        isDrawing={isDrawing}
      />

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
