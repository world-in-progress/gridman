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

