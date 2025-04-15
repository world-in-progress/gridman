export interface RectangleCoordinates {
  northEast: [number, number];
  southEast: [number, number];
  southWest: [number, number];
  northWest: [number, number];
  center: [number, number];
}

export interface LayerSize {
  id: number;
  width: string;
  height: string;
  error?: string;
}

export interface SubdivideRule {
  id: number;
  cols: number;
  rows: number;
  originalBounds: [number, number, number, number]; // [minX, minY, maxX, maxY]
  adjustedBounds: [number, number, number, number]; // [minX, minY, maxX, maxY]
  xRatio: number; // Subdivision ratio relative to previous layer or original bounds
  yRatio: number; // Subdivision ratio relative to previous layer or original bounds
}

export interface OperatePanelProps {
  onDrawRectangle?: (isCurrentlyDrawing: boolean) => void;
  rectangleCoordinates?: RectangleCoordinates | null;
  isDrawing?: boolean;
}

export interface DrawButtonProps {
  isDrawing: boolean;
  rectangleCoordinates: RectangleCoordinates | null | undefined;
  onClick: () => void;
}

export interface CoordinateBoxProps {
  title: string;
  coordinates: RectangleCoordinates | null | undefined;
  formatCoordinate: (coord: [number, number] | undefined) => string;
}

export interface EPSGInputProps {
  customEPSG: string;
  error: string | null;
  rectangleCoordinates: RectangleCoordinates | null | undefined;
  onEpsgChange: (value: string) => void;
  onConvert: () => void;
}

export interface GridLevelProps {
  layers: LayerSize[];
  layerErrors: { [key: number]: string };
  onAddLayer: () => void;
  onUpdateWidth: (id: number, width: string) => void;
  onUpdateHeight: (id: number, height: string) => void;
  onRemoveLayer: (id: number) => void;
}

export interface GridLevelItemProps {
  layer: LayerSize;
  index: number;
  error?: string;
  onUpdateWidth: (id: number, width: string) => void;
  onUpdateHeight: (id: number, height: string) => void;
  onRemoveLayer: (id: number) => void;
  language?: 'zh' | 'en';
}

export interface SubdivideRulesProps {
  subdivideRules: SubdivideRule[];
  layers: LayerSize[];
  formatNumber: (num: number) => string;
  language?: 'zh' | 'en';
}

export interface GenerateJSONButtonProps {
  onClick: () => void;
}

export interface DrawGridButtonProps {
  onClick: () => void;
}
