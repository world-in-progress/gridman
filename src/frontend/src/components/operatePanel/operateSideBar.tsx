import * as React from 'react';
import { Sidebar, SidebarContent, SidebarRail } from '@/components/ui/sidebar';
import OperatePanel, {
  RectangleCoordinates,
} from './operatePanel';

interface AppSidebarDemoProps extends React.ComponentProps<typeof Sidebar> {
  onDrawRectangle?: (currentlyDrawing: boolean) => void;
  rectangleCoordinates?: RectangleCoordinates | null;
  isDrawing?: boolean;
}

export function OperateSideBar({
  onDrawRectangle,
  rectangleCoordinates,
  isDrawing,
  ...props
}: AppSidebarDemoProps) {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <OperatePanel
          onDrawRectangle={onDrawRectangle}
          rectangleCoordinates={rectangleCoordinates}
          isDrawing={isDrawing}
        />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
