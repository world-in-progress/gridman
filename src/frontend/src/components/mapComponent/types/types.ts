import { RectangleCoordinates } from '../../operatePanel/operatePanel';

export interface RectangleOptions {
    center: { lng: number; lat: number };
    width: number; // Mercator
    height: number; // Mercator
  }

  export interface MapInitProps {
    initialLongitude?: number;
    initialLatitude?: number;
    initialZoom?: number;
    maxZoom?: number;
    onRectangleDrawn?: (coordinates: RectangleCoordinates) => void;
    onPointSelected?: (coordinates: [number, number]) => void;
}

export interface MapInitHandle {
  startDrawRectangle: (cancel?: boolean) => void;
  startPointSelection: (cancel?: boolean) => void;
  flyToPatchBounds: (
      projectName: string,
      patchName: string
  ) => Promise<void>;
  highlightPatch: (projectName: string, patchName: string) => void;
  showPatchBounds: (
      projectName: string,
      patches: any[],
      show: boolean
  ) => void;
}