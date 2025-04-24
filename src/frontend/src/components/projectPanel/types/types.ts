import { FormErrors } from '../../schemaPanel/types/types';

export interface RectangleCoordinates {
  northEast: [number, number];
  southEast: [number, number];
  southWest: [number, number];
  northWest: [number, number];
  center: [number, number];
}

export interface CreateProjectProps {
  onBack?: () => void;
  onDrawRectangle?: (isCurrentlyDrawing: boolean) => void;
  rectangleCoordinates?: RectangleCoordinates | null;
  isDrawing?: boolean;
  initialSchemaName?: string;
  initialEpsg?: string;
  initialSchemaLevel?: string;
}

export interface ProjectValidationResult {
  isValid: boolean;
  errors: ExtendedFormErrors;
  generalError: string | null;
}
export interface ExtendedFormErrors extends FormErrors {
  schemaName: boolean;
}

