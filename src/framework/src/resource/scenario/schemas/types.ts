import { ISceneTree, ISceneNode } from "@/core/scene/iscene";

export interface Schema {
    name: string;
    description?: string;
    starred?: boolean;
    epsg: number;
    base_point: number[];
    grid_info: number[][];
}

export interface SchemaNameCardProps {
    name: string;
    hasError: boolean;
    onChange: (value: string) => void;
}

export interface SchemaDescriptionCardProps {
    description: string;
    hasError: boolean;
    onChange: (value: string) => void;
}

export interface SchemaEpsgCardProps {
    epsg: string;
    hasError: boolean;
    onChange: (value: string) => void;
}

export interface SchemaCoordinateCardProps {
    lon: string;
    lat: string;
    hasError: boolean;
    isSelectingPoint: boolean;
    onLonChange: (value: string) => void;
    onLatChange: (value: string) => void;
    onDrawClick: () => void;
}

export interface SchemaConvertedCoordCardProps {
    convertedCoord: { x: string; y: string } | null;
    epsg: string;
}

export interface LayerSize {
    id: number;
    width: string;
    height: string;
    error?: string;
}

export interface GridLevelItemProps {
    layer: LayerSize;
    index: number;
    error?: string;
    onUpdateWidth: (id: number, width: string) => void;
    onUpdateHeight: (id: number, height: string) => void;
    onRemoveLayer: (id: number) => void;
}

export interface GridLevelProps {
    layers: TopologyLayer[];
    layerErrors: Record<number, string>;
    onAddLayer: () => void;
    onUpdateWidth: (id: number, width: string) => void;
    onUpdateHeight: (id: number, height: string) => void;
    onRemoveLayer: (id: number) => void;
}

export interface TopologyLayer {
    id: number;
    width: string;
    height: string;
}
export interface SchemaErrorMessageProps {
    message: string | null;
}

export interface FormErrors {
    name: boolean;
    description: boolean;
    coordinates: boolean;
    epsg: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    errors: FormErrors;
    generalError: string | null;
}

export type SchemasPageProps = {
    node: ISceneNode
    mapInstance: mapboxgl.Map | null
}
