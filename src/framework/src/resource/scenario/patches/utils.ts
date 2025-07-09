import { RectangleCoordinates, ValidationResult } from "./types";

export const formatCoordinate = (coord: [number, number] | undefined) => {
    if (!coord) return '---';
    return `[${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}]`;
};

export const validatePatchForm = (
    data: {
        name: string
        description: string
        bounds: [number, number, number, number]
    }
): ValidationResult => {
    const errors = {
        name: false,
        description: false,
        bounds: false
    }

    let generalError: string | null = null

    // Validate name
    if (!data.name.trim()) {
        errors.name = true
        generalError = 'Please enter patch name'
        return { isValid: false, errors, generalError }
    }

    // Validate bounds
    // if
    return { isValid: true, errors, generalError }
}