import { ISceneNode } from "@/core/scene/iscene";

export interface PatchesPageProps {
    node: ISceneNode
}

export interface PatchMeta {
    name: string
    starred: boolean
    description: string
    bounds: [number, number, number, number]
}

export interface RectangleCoordinates {
    northEast: [number, number];
    southEast: [number, number];
    southWest: [number, number];
    northWest: [number, number];
    center: [number, number];
}

export interface FormErrors {
    name: boolean
    description: boolean
    bounds: boolean
}

export interface ValidationResult {
    isValid: boolean
    errors: FormErrors
    generalError: string | null
}

export interface PatchesInformationProps {
    node: ISceneNode
}