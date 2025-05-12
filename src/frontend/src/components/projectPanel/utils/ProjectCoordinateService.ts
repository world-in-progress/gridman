import {
    AdjustAndExpandRectangleParams,
    RectangleCoordinates,
} from '../types/types';

export function adjustAndExpandRectangle({
    rectangleCoordinates,
    epsg,
    gridLevel,
    schemaBasePoint,
    convertSingleCoordinate,
}: AdjustAndExpandRectangleParams): {
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
        return { alignedRectangle: null, expandedRectangle: null };
    }

    const convertedNE = convertSingleCoordinate(
        rectangleCoordinates.northEast,
        '4326',
        epsg
    ) as [number, number];
    const convertedSE = convertSingleCoordinate(
        rectangleCoordinates.southEast,
        '4326',
        epsg
    ) as [number, number];
    const convertedSW = convertSingleCoordinate(
        rectangleCoordinates.southWest,
        '4326',
        epsg
    ) as [number, number];
    const convertedNW = convertSingleCoordinate(
        rectangleCoordinates.northWest,
        '4326',
        epsg
    ) as [number, number];
    const convertedCenter = convertSingleCoordinate(
        rectangleCoordinates.center,
        '4326',
        epsg
    ) as [number, number];

    let convertedRect = {
        northEast: convertedNE,
        southEast: convertedSE,
        southWest: convertedSW,
        northWest: convertedNW,
        center: convertedCenter,
    };

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

    // if (modX !== 0 || modY !== 0) {
    //     const adjustX = modX > 0 ? gridWidth - modX : -modX;
    //     const adjustY = modY > 0 ? gridHeight - modY : -modY;
    //     const adjustedSW = [
    //         convertedSW[0] + adjustX,
    //         convertedSW[1] + adjustY,
    //     ] as [number, number];
    //     const rectWidth = Math.abs(convertedNE[0] - convertedSW[0]);
    //     const rectHeight = Math.abs(convertedNE[1] - convertedSW[1]);
    //     const widthMod = rectWidth % gridWidth;
    //     const heightMod = rectHeight % gridHeight;
    //     const widthAdjust = widthMod === 0 ? 0 : gridWidth - widthMod;
    //     const heightAdjust = heightMod === 0 ? 0 : gridHeight - heightMod;
    //     // console.log('if','widthAdjust', widthAdjust, 'heightAdjust', heightAdjust);
    //     alignedRect = {
    //         southWest: adjustedSW,
    //         southEast: [
    //             adjustedSW[0] + rectWidth + widthAdjust,
    //             adjustedSW[1],
    //         ] as [number, number],
    //         northEast: [
    //             adjustedSW[0] + rectWidth + widthAdjust,
    //             adjustedSW[1] + rectHeight + heightAdjust,
    //         ] as [number, number],
    //         northWest: [
    //             adjustedSW[0],
    //             adjustedSW[1] + rectHeight + heightAdjust,
    //         ] as [number, number],
    //         center: [
    //             adjustedSW[0] + (rectWidth + widthAdjust) / 2,
    //             adjustedSW[1] + (rectHeight + heightAdjust) / 2,
    //         ] as [number, number],
    //     };
    // }

    // Expand the rectangle
    const adjustedWidth = Math.ceil(rectWidth / gridWidth) * gridWidth;
    const adjustedHeight = Math.ceil(rectHeight / gridHeight) * gridHeight;

    console.log(rectWidth / gridWidth, Math.ceil(rectWidth / gridWidth));
    console.log(adjustedWidth)

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

    // const width = Math.abs(alignedRect.northEast[0] - alignedRect.southWest[0]);
    // const height = Math.abs(
    //     alignedRect.northEast[1] - alignedRect.southWest[1]
    // );
    // const expandedGridWidth = gridLevel[0];
    // const expandedGridHeight = gridLevel[1];

    // const widthMod = width % expandedGridWidth;
    // const heightMod = height % expandedGridHeight;

    // const widthAdjust = widthMod === 0 ? 0 : expandedGridWidth - widthMod;
    // const heightAdjust = heightMod === 0 ? 0 : expandedGridHeight - heightMod;

    // const expandedSW = alignedRect.southWest as [number, number];
    // const expandedSE = [
    //     alignedRect.southWest[0] + width + widthAdjust,
    //     alignedRect.southWest[1],
    // ] as [number, number];
    // const expandedNE = [
    //     alignedRect.southWest[0] + width + widthAdjust,
    //     alignedRect.southWest[1] + height + heightAdjust,
    // ] as [number, number];
    // const expandedNW = [
    //     alignedRect.southWest[0],
    //     alignedRect.southWest[1] + height + heightAdjust,
    // ] as [number, number];
    // const expandedCenter = [
    //     alignedRect.southWest[0] + (width + widthAdjust) / 2,
    //     alignedRect.southWest[1] + (height + heightAdjust) / 2,
    // ] as [number, number];

    const expandedRect: RectangleCoordinates = {
        northEast: expandedNE,
        southEast: expandedSE,
        southWest: expandedSW,
        northWest: expandedNW,
        center: expandedCenter,
    };
    return { alignedRectangle: alignedRect, expandedRectangle: expandedRect };
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
