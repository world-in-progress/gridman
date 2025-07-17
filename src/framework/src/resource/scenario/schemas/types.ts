import { ISceneNode } from '@/core/scene/iscene'

export interface GridLayerInfo {
    id: number
    width: string
    height: string
}

export interface FormErrors {
    name: boolean
    description: boolean
    coordinates: boolean
    epsg: boolean
}

export interface ValidationResult {
    isValid: boolean
    errors: FormErrors
    generalError: string | null
}

export type SchemasPageProps = {
    node: ISceneNode
}

export interface SchemasInformationProps {
    node: ISceneNode;
}