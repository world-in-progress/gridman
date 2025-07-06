import store from '@/store';
import mapboxgl from 'mapbox-gl';

import proj4 from 'proj4';

export const clearMapMarkers = (): void => {
    const markers = document.getElementsByClassName('mapboxgl-marker')
    if (markers.length > 0) {
        Array.from(markers).forEach((marker) => {
            marker.remove()
        })
        console.log('clearMapMarkers', markers)
    }
}

export const epsgDefinitions: Record<string, string> = {
    '4326': '+proj=longlat +datum=WGS84 +no_defs',
    '3857': '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs', // Web Mercator
    '2326': '+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.243649,-1.158827,-1.094246 +units=m +no_defs', // Hong Kong 1980 Grid System
    '2433': '+proj=tmerc +lat_0=0 +lon_0=114 +k=1 +x_0=500000 +y_0=0 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.24365,-1.15883,-1.09425 +units=m +no_defs', // Hong Kong 1980 Grid System
}

// Convert a single coordinate point
export const convertSinglePointCoordinate = (
    coord: [number, number],
    fromEPSG: string,
    toEPSG: string
): [number, number] => {
    if (!coord) return [0, 0];
    try {
        // Ensure source and target projection definitions are registered
        if (epsgDefinitions[fromEPSG]) {
            proj4.defs(`EPSG:${fromEPSG}`, epsgDefinitions[fromEPSG]);
        }
        if (epsgDefinitions[toEPSG]) {
            proj4.defs(`EPSG:${toEPSG}`, epsgDefinitions[toEPSG]);
        }

        const fromProjection = `EPSG:${fromEPSG}`;
        const toProjection = `EPSG:${toEPSG}`;

        // Perform coordinate conversion
        return proj4(fromProjection, toProjection, coord);
    } catch (e) {
        console.error('Coordinate conversion error:', e);
        return coord; // Return original coordinates when error occurs
    }
};

export const convertCoordinate = (
    lon: string,
    lat: string,
    fromEPSG: string,
    toEPSG: string
): { x: string; y: string } | null => {
    if (!lon || !lat || !fromEPSG || !toEPSG) return null

    try {
        if (epsgDefinitions[fromEPSG]) {
            proj4.defs(`EPSG:${fromEPSG}`, epsgDefinitions[fromEPSG])
        }

        if (epsgDefinitions[toEPSG]) {
            proj4.defs(`EPSG:${toEPSG}`, epsgDefinitions[toEPSG])
        }

        const result = proj4(`EPSG:${fromEPSG}`, `EPSG:${toEPSG}`, [
            parseFloat(lon),
            parseFloat(lat),
        ])

        return {
            x: result[0].toFixed(6),
            y: result[1].toFixed(6),
        }
    } catch (e) {
        console.error('Coordinate conversion error:', e)
        return null
    }
};

export const convertToWGS84 = (
    coordinates: number[],
    fromEpsg: number
): [number, number] => {
    if (!coordinates || coordinates.length < 2 || !fromEpsg) {
        return [0, 0];
    }

    try {
        return convertSinglePointCoordinate(
            [coordinates[0], coordinates[1]],
            fromEpsg.toString(),
            '4326'
        );
    } catch (error) {
        console.error('坐标转换错误:', error);
        return [0, 0];
    }
};