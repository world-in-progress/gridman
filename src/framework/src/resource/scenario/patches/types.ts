import { ISceneNode } from "@/core/scene/iscene";
import { FormErrors } from "@/resource/scenario/schemas/types"

export interface PatchesPageProps {
    node: ISceneNode
}

export interface RectangleCoordinates {
    northEast: [number, number];
    southEast: [number, number];
    southWest: [number, number];
    northWest: [number, number];
    center: [number, number];
}

export interface PatchBoundsProps {
    isDrawing: boolean;
    rectangleCoordinates: RectangleCoordinates | null;
    onDrawRectangle: (currentlyDrawing: boolean) => void;
}

export interface UpdatedPatchBoundsProps extends PatchBoundsProps {
    convertedRectangle: RectangleCoordinates | null;
    setConvertedRectangle: (rect: RectangleCoordinates) => void;
    onAdjustAndDraw: (north: string, south: string, east: string, west: string) => void;
    drawExpandedRectangleOnMap?: () => void;
}

export interface DrawPatchButtonProps {
    isDrawing: boolean;
    rectangleCoordinates: RectangleCoordinates | null | undefined;
    onClick: () => void;
}

export interface CoordinateBoxProps {
    title: string;
    coordinates: RectangleCoordinates | null | undefined;
    formatCoordinate: (coord: [number, number] | undefined) => string;
}

export interface ProjectErrorMessageProps {
    message: string | null;
}

export interface ExtendedFormErrors extends FormErrors {
    schemaName: boolean;
}

