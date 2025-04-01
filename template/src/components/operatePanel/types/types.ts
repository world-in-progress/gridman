// 矩形坐标点类型
export interface RectangleCoordinates {
  northEast: [number, number];
  southEast: [number, number];
  southWest: [number, number];
  northWest: [number, number];
  center: [number, number];
}

// 网格层级大小类型
export interface LayerSize {
  id: number;
  width: string;
  height: string;
  error?: string;
}

// 细分规则类型
export interface SubdivideRule {
  id: number;
  cols: number;
  rows: number;
  originalBounds: [number, number, number, number]; // [minX, minY, maxX, maxY]
  adjustedBounds: [number, number, number, number]; // [minX, minY, maxX, maxY]
  xRatio: number; // Subdivision ratio relative to previous layer or original bounds
  yRatio: number; // Subdivision ratio relative to previous layer or original bounds
}

// 操作面板属性
export interface OperatePanelProps {
  onDrawRectangle?: () => void;
  rectangleCoordinates?: RectangleCoordinates | null;
}

// 绘图按钮属性
export interface DrawButtonProps {
  isDrawing: boolean;
  rectangleCoordinates: RectangleCoordinates | null | undefined;
  onClick: () => void;
}

// 坐标信息框属性
export interface CoordinateBoxProps {
  title: string;
  coordinates: RectangleCoordinates | null | undefined;
  formatCoordinate: (coord: [number, number] | undefined) => string;
}

// EPSG输入框属性
export interface EPSGInputProps {
  customEPSG: string;
  error: string | null;
  rectangleCoordinates: RectangleCoordinates | null | undefined;
  onEpsgChange: (value: string) => void;
  onConvert: () => void;
}

// 网格层级属性
export interface GridLevelProps {
  layers: LayerSize[];
  layerErrors: {[key: number]: string};
  onAddLayer: () => void;
  onUpdateWidth: (id: number, width: string) => void;
  onUpdateHeight: (id: number, height: string) => void;
  onRemoveLayer: (id: number) => void;
}

// 单个网格层级属性
export interface GridLevelItemProps {
  layer: LayerSize;
  index: number;
  error?: string;
  onUpdateWidth: (id: number, width: string) => void;
  onUpdateHeight: (id: number, height: string) => void;
  onRemoveLayer: (id: number) => void;
}

// 细分规则属性
export interface SubdivideRulesProps {
  subdivideRules: SubdivideRule[];
  layers: LayerSize[];
  formatNumber: (num: number) => string;
}

// 生成JSON按钮属性
export interface GenerateJSONButtonProps {
  onClick: () => void;
} 