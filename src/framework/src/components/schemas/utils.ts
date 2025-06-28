import { Schema, TopologyLayer, ValidationResult } from './types';

export const validateGridLayers = (
    topologyLayers: TopologyLayer[]
): { errors: Record<number, string>; isValid: boolean } => {
    const errors: Record<number, string> = {};
    let isValid = true;

    const errorText = {
        empty: 'Width and height cannot be empty',
        notPositive: 'Width and height must be positive numbers',
        notSmaller: (prevWidth: number, prevHeight: number) =>
            `Cell dimensions should be smaller than previous level (${prevWidth}×${prevHeight})`,
        notMultiple: (
            prevWidth: number,
            currentWidth: number,
            prevHeight: number,
            currentHeight: number
        ) =>
            `Previous level's dimensions (${prevWidth}×${prevHeight}) must be multiples of current level (${currentWidth}×${currentHeight})`,
        widthNotSmaller: (prevWidth: number) =>
            `Width must be smaller than previous level (${prevWidth})`,
        widthNotMultiple: (prevWidth: number, currentWidth: number) =>
            `Previous level's width (${prevWidth}) must be a multiple of current width (${currentWidth})`,
        heightNotSmaller: (prevHeight: number) =>
            `Height must be smaller than previous level (${prevHeight})`,
        heightNotMultiple: (prevHeight: number, currentHeight: number) =>
            `Previous level's height (${prevHeight}) must be a multiple of current height (${currentHeight})`,
        and: ` and `,
    };


    const sortedLayers = [...topologyLayers].sort((a, b) => a.id - b.id);

    sortedLayers.forEach((layer, index) => {
        const width = String(layer.width).trim();
        const height = String(layer.height).trim();

        delete errors[layer.id];

        if (width === '' || height === '') {
            errors[layer.id] = errorText.empty;
            isValid = false;
            return;
        }

        const currentWidth = Number(width);
        const currentHeight = Number(height);

        if (
            isNaN(currentWidth) ||
            isNaN(currentHeight) ||
            currentWidth <= 0 ||
            currentHeight <= 0
        ) {
            errors[layer.id] = errorText.notPositive;
            isValid = false;
            return;
        }

        if (index > 0) {
            const prevLayer = sortedLayers[index - 1];
            const prevWidth = Number(String(prevLayer.width).trim());
            const prevHeight = Number(String(prevLayer.height).trim());

            let hasWidthError = false;
            if (currentWidth >= prevWidth) {
                errors[layer.id] = errorText.widthNotSmaller(prevWidth);
                hasWidthError = true;
                isValid = false;
            } else if (prevWidth % currentWidth !== 0) {
                errors[layer.id] = errorText.widthNotMultiple(
                    prevWidth,
                    currentWidth
                );
                hasWidthError = true;
                isValid = false;
            }

            if (currentHeight >= prevHeight) {
                if (hasWidthError) {
                    errors[layer.id] +=
                        errorText.and +
                        errorText.heightNotSmaller(prevHeight);
                } else {
                    errors[layer.id] =
                        errorText.heightNotSmaller(prevHeight);
                }
                isValid = false;
            } else if (prevHeight % currentHeight !== 0) {
                if (hasWidthError) {
                    errors[layer.id] +=
                        errorText.and +
                        errorText.heightNotMultiple(
                            prevHeight,
                            currentHeight
                        );
                } else {
                    errors[layer.id] = errorText.heightNotMultiple(
                        prevHeight,
                        currentHeight
                    );
                }
                isValid = false;
            }
        }
    });

    return { errors, isValid };
};

export const validateSchemaForm = (
    data: {
        name: string;
        epsg: string;
        lon: string;
        lat: string;
        topologyLayers: TopologyLayer[];
        convertedCoord: { x: string; y: string } | null;
    },
): ValidationResult => {
    const errors = {
        name: false,
        description: false,
        coordinates: false,
        epsg: false,
    };

    let generalError: string | null = null;

    if (!data.name.trim()) {
        generalError = 'Please enter schema name'
        errors.name = true;
        return { isValid: false, errors, generalError };
    }

    if (!data.epsg.trim() || isNaN(Number(data.epsg))) {
        generalError = 'Please enter a valid EPSG code'
        errors.epsg = true;
        return { isValid: false, errors, generalError };
    }

    if (!data.lon.trim() || !data.lat.trim()) {
        generalError = 'Please enter coordinates'
        errors.coordinates = true;
        return { isValid: false, errors, generalError };
    }

    if (data.topologyLayers.length === 0) {
        generalError = 'Please add at least one grid level'
        return { isValid: false, errors, generalError };
    }

    for (let i = 0; i < data.topologyLayers.length; i++) {
        const layer = data.topologyLayers[i];
        if (
            !layer.width.toString().trim() ||
            !layer.height.toString().trim() ||
            isNaN(parseInt(layer.width.toString())) ||
            isNaN(parseInt(layer.height.toString()))
        ) {
            generalError = `Please enter valid width and height for grid level ${i + 1}`
            return { isValid: false, errors, generalError };
        }
    }

    const { errors: layerErrors, isValid: gridValid } = validateGridLayers(
        data.topologyLayers,
    );
    if (!gridValid) {
        generalError = 'Please fix errors in grid levels'
        return { isValid: false, errors, generalError };
    }

    if (!data.convertedCoord) {
        generalError = 'Unable to get converted coordinates'
        return { isValid: false, errors, generalError };
    }

    return { isValid: true, errors, generalError: null };
};

export const createSchemaData = (
    name: string,
    description: string,
    epsg: string,
    convertedCoord: { x: string; y: string } | null,
    topologyLayers: TopologyLayer[]
): Schema | null => {
    if (!convertedCoord) return null;

    return {
        name,
        starred: false,
        description,
        epsg: parseInt(epsg),
        base_point: [
            parseFloat(convertedCoord.x),
            parseFloat(convertedCoord.y),
        ],
        grid_info: topologyLayers.map((layer) => [
            parseInt(layer.width.toString()),
            parseInt(layer.height.toString()),
        ]),
    };
};
