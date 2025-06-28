import proj4 from 'proj4';
import { RectangleCoordinates } from '../../components/operatePanel/types/types';

// Common coordinate system definitions
export const epsgDefinitions: Record<string, string> = {
    '4326': '+proj=longlat +datum=WGS84 +no_defs', // WGS84
    '3857': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs', // Web Mercator
    '2326': '+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.243649,-1.158827,-1.094246 +units=m +no_defs', // Hong Kong 1980 Grid System
    '2433': '+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=500000 +y_0=0 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs', // Hong Kong 1980 Grid System
};

// Add custom coordinate system definitions
export const registerCustomEPSG = (code: string, def: string) => {
    proj4.defs(`EPSG:${code}`, def);
};

// Convert a single coordinate point
export const convertCoordinate = (
    coord: [number, number],
    fromEPSG: string,
    toEPSG: string
): [number, number] => {
    if (!coord) return [0, 0];
    try {
        // Ensure source and target projection definitions
        const fromProjection = `EPSG:${fromEPSG}`;
        const toProjection = `EPSG:${toEPSG}`;

        // Perform coordinate conversion
        return proj4(fromProjection, toProjection, coord);
    } catch (e) {
        console.error('Coordinate conversion error:', e);
        return coord; // Return original coordinates when error occurs
    }
};

// Calculate minimum bounding rectangle
export const calculateMinimumBoundingRectangle = (
    points: [number, number][]
): RectangleCoordinates => {
    // Find maximum and minimum values of converted coordinates
    let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

    points.forEach((point) => {
        if (point[0] < minX) minX = point[0];
        if (point[0] > maxX) maxX = point[0];
        if (point[1] < minY) minY = point[1];
        if (point[1] > maxY) maxY = point[1];
    });

    // Create minimum bounding rectangle parallel to coordinate axes
    const northEast: [number, number] = [maxX, maxY];
    const southEast: [number, number] = [maxX, minY];
    const southWest: [number, number] = [minX, minY];
    const northWest: [number, number] = [minX, maxY];
    const center: [number, number] = [(minX + maxX) / 2, (minY + maxY) / 2];

    return {
        northEast,
        southEast,
        southWest,
        northWest,
        center,
    };
};

// Format coordinates, keeping 6 decimal places
export const formatCoordinate = (coord: [number, number] | undefined) => {
    if (!coord) return '---';
    return `[${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}]`;
};

// Format number, keeping appropriate decimal places
export const formatNumber = (num: number) => {
    return num.toFixed(6);
};
