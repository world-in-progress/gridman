import {
    AdjustAndExpandRectangleParams,
    RectangleCoordinates,
} from '../types/types';

export function adjustAndExpandRectangle({
    rectangleCoordinates,
    isConverted,
    epsg,
    gridLevel,
    schemaBasePoint,
    convertSingleCoordinate,
}: AdjustAndExpandRectangleParams): {
    convertedRectangle: RectangleCoordinates | null
    alignedRectangle: RectangleCoordinates | null;
    expandedRectangle: RectangleCoordinates | null;
} {
    if (
        !rectangleCoordinates ||
        !epsg ||
        !gridLevel ||
        gridLevel.length < 2 ||
        !schemaBasePoint
    ) {
        return { convertedRectangle: null, alignedRectangle: null, expandedRectangle: null };
    }
    
    let convertedRect = rectangleCoordinates;
    let convertedNE = rectangleCoordinates.northEast;
    let convertedSE = rectangleCoordinates.southEast;
    let convertedNW = rectangleCoordinates.northWest;
    let convertedSW = rectangleCoordinates.southWest;
    let convertedCenter = rectangleCoordinates.center;
    if (!isConverted) {
        convertedNE = convertSingleCoordinate(
            rectangleCoordinates.northEast,
            '4326',
            epsg
        ) as [number, number];
        convertedSE = convertSingleCoordinate(
            rectangleCoordinates.southEast,
            '4326',
            epsg
        ) as [number, number];
        convertedSW = convertSingleCoordinate(
            rectangleCoordinates.southWest,
            '4326',
            epsg
        ) as [number, number];
        convertedNW = convertSingleCoordinate(
            rectangleCoordinates.northWest,
            '4326',
            epsg
        ) as [number, number];
        convertedCenter = convertSingleCoordinate(
            rectangleCoordinates.center,
            '4326',
            epsg
        ) as [number, number];
    
        convertedRect = {
            northEast: convertedNE,
            southEast: convertedSE,
            southWest: convertedSW,
            northWest: convertedNW,
            center: convertedCenter,
        };
    
    }

    // Align the rectangle
    const gridWidth = gridLevel[0];
    const gridHeight = gridLevel[1];

    const [swX, swY] = convertedRect.southWest;
    const [baseX, baseY] = schemaBasePoint;

    const dX = swX - baseX;
    const dY = swY - baseY;

    let alignedRect: RectangleCoordinates = convertedRect;

    const disX = Math.floor(dX / gridWidth) * gridWidth;
    const disY = Math.floor(dY / gridHeight) * gridHeight;

    const offsetX = disX - dX;
    const offsetY = disY - dY;

    const rectWidth = convertedRect.northEast[0] - convertedRect.northWest[0];
    const rectHeight = convertedRect.northEast[1] - convertedRect.southEast[1];

    const adjustedSW = [convertedSW[0] + offsetX, convertedSW[1] + offsetY] as [
        number,
        number
    ];

    const adjustedSE = [adjustedSW[0] + rectWidth, adjustedSW[1]] as [
        number,
        number
    ];

    const adjustedNW = [adjustedSW[0], adjustedSW[1] + rectHeight] as [
        number,
        number
    ];

    const adjustedNE = [
        adjustedSW[0] + rectWidth,
        adjustedSW[1] + rectHeight,
    ] as [number, number];

    const adjustedCenter = [
        adjustedSW[0] + rectWidth / 2,
        adjustedSW[1] + rectHeight / 2,
    ] as [number, number];

    alignedRect = {
        southWest: adjustedSW,
        southEast: adjustedSE,
        northEast: adjustedNE,
        northWest: adjustedNW,
        center: adjustedCenter,
    };

    // Expand the rectangle
    const adjustedWidth = Math.ceil(rectWidth / gridWidth) * gridWidth;
    const adjustedHeight = Math.ceil(rectHeight / gridHeight) * gridHeight;

    const expandedSW = alignedRect.southWest as [number, number];

    const expandedSE = [
        expandedSW[0] + adjustedWidth,
        expandedSW[1],
    ] as [number, number];

    const expandedNW = [
        expandedSW[0],
        expandedSW[1] + adjustedHeight,
    ] as [number, number];

    const expandedNE = [
        expandedSW[0] + adjustedWidth,
        expandedSW[1] + adjustedHeight,
    ] as [number, number];

    const expandedCenter = [
        expandedSW[0] + adjustedWidth / 2,
        expandedSW[1] + adjustedHeight / 2,
    ] as [number, number]; 

    const expandedRect: RectangleCoordinates = {
        northEast: expandedNE,
        southEast: expandedSE,
        southWest: expandedSW,
        northWest: expandedNW,
        center: expandedCenter,
    };
    return { convertedRectangle: convertedRect, alignedRectangle: alignedRect, expandedRectangle: expandedRect };
}

/**
 * Calculate the number of grids in the rectangle
 * @param southWest - The bottom-left corner of the aligned rectangle [number, number]
 * @param basePoint - The base point of the schema [number, number]
 * @param gridLevel - The first grid level [gridWidth, gridHeight]
 * @returns { widthCount: number, heightCount: number }
 */
export function calculateGridCounts(
    southWest: [number, number],
    basePoint: [number, number],
    gridLevel: number[]
): { widthCount: number; heightCount: number } {
    const gridWidth = gridLevel[0];
    const gridHeight = gridLevel[1];
    const [swX, swY] = southWest;
    const [baseX, baseY] = basePoint;
    const widthCount = Math.abs((swX - baseX) / gridWidth);
    const heightCount = Math.abs((swY - baseY) / gridHeight);
    return { widthCount, heightCount };
}
