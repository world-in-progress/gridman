import store from '@/store';
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import proj4 from 'proj4';
import { RectangleCoordinates } from '../patches/types';

export const clearMapMarkers = (): void => {
    const markers = document.getElementsByClassName('mapboxgl-marker')
    if (markers.length > 0) {
        Array.from(markers).forEach((marker) => {
            marker.remove()
        })
    }
}

export const addMapMarker = (coord: [number, number], options?: mapboxgl.MarkerOptions): void => {
    const map = store.get<mapboxgl.Map>('map')

    if (!map || !map.getCanvas() || !coord || coord.length < 2) return

    const marker = new mapboxgl.Marker(options)
        .setLngLat([coord[0], coord[1]])
        .addTo(map)
}

export const flyToMarker = (coord: [number, number]): void => {
    const map = store.get<mapboxgl.Map>('map')

    if (!map || !coord || coord.length < 2) return

    clearMapMarkers()
    addMapMarker(coord)

    map.flyTo({
        center: [coord[0], coord[1]],
        zoom: 14,
        essential: true,
        duration: 1000
    })
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


// Clear drawing patch bounds
export const clearDrawPatchBounds = () => {
    const map = store.get<mapboxgl.Map>('map')
    if (!map) return

    if (map.getSource('bounds-source')) {
        map.removeLayer('bounds-fill')
        map.removeLayer('bounds-outline')
        map.removeSource('bounds-source')
    }

    const draw = store.get<MapboxDraw>('mapDraw');
    if (draw) {
        draw.deleteAll();
    }
}

// Add patch bounds to map
export const addMapPatchBounds = (bounds: [number, number, number, number]) => {
    const map = store.get<mapboxgl.Map>('map')

    if (!map) return

    const addBounds = () => {
        clearDrawPatchBounds()

        const boundsData = {
            type: 'Feature',
            properties: {},
            geometry: {
                type: 'Polygon',
                coordinates: [[
                    [bounds[0], bounds[1]],
                    [bounds[2], bounds[1]],
                    [bounds[2], bounds[3]],
                    [bounds[0], bounds[3]],
                    [bounds[0], bounds[1]]
                ]]
            }
        }

        map.addSource('bounds-source', {
            type: 'geojson',
            data: boundsData as GeoJSON.Feature<GeoJSON.Polygon>
        })

        // Inner filled layer
        map.addLayer({
            id: 'bounds-fill',
            type: 'fill',
            source: 'bounds-source',
            layout: {},
            paint: {
                'fill-color': '#00F8FF',
                'fill-opacity': 0.5
            }
        });

        // Outline layer
        map.addLayer({
            id: 'bounds-outline',
            type: 'line',
            source: 'bounds-source',
            layout: {},
            paint: {
                'line-color': '#FFFF00',
                'line-width': 3
            }
        });

        // Fly to bounds
        map.fitBounds([
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]]
        ], { padding: 50 });
    }

    if (map.isStyleLoaded()) {
        addBounds()
    } else {
        map.once('style.load', addBounds)
    }
}

// Start drawing rectangle
export const startDrawingRectangle = () => {
    const map = store.get<mapboxgl.Map>('map')
    const draw = store.get<MapboxDraw>('mapDraw')

    if (!map || !draw) {
        console.error('地图或绘图工具未初始化')
        return false;
    }

    try {
        draw.deleteAll()
        draw.changeMode('draw_rectangle')
        return true;
    } catch (error) {
        console.error('启动绘图出错:', error)
        return false;
    }
}

// Stop drawing rectangle
export const stopDrawingRectangle = () => {
    const map = store.get<mapboxgl.Map>('map');
    const draw = store.get<MapboxDraw>('mapDraw');

    if (!map || !draw) return;

    try {
        draw.changeMode('simple_select');
    } catch (error) {
        console.error('停止绘图出错:', error);
    }
}

// Get drawn rectangle coordinates
export const getDrawnRectangleCoordinates = (): {
    northEast: [number, number],
    southWest: [number, number],
    southEast: [number, number],
    northWest: [number, number],
    center: [number, number]
} | null => {
    const draw = store.get<MapboxDraw>('mapDraw');

    if (!draw) return null;

    const features = draw.getAll().features;
    if (features.length === 0) return null;

    const polygon = features[0];
    if (polygon.geometry.type !== 'Polygon') return null;

    const coords = polygon.geometry.coordinates[0];
    if (coords.length < 4) return null;

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const [x, y] of coords) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }

    return {
        northEast: [maxX, maxY],
        southWest: [minX, minY],
        southEast: [maxX, minY],
        northWest: [minX, maxY],
        center: [(minX + maxX) / 2, (minY + maxY) / 2]
    };
}

// Align and Expand bounds to fit grid level
export const adjustPatchBounds = (
    bounds: [number, number, number, number],
    gridLevel: [number, number],
    epsg: string,
    schemaBasePoint: [number, number]
): {
    convertedBounds: RectangleCoordinates | null
    alignedBounds: RectangleCoordinates | null;
    expandedBounds: RectangleCoordinates | null;
} => {
    if (!bounds || !gridLevel || !epsg || !schemaBasePoint || gridLevel.length < 2) {
        return {
            convertedBounds: null,
            alignedBounds: null,
            expandedBounds: null
        }
    }

    const convertedSW: [number, number] = [bounds[0], bounds[1]];
    const convertedSE: [number, number] = [bounds[2], bounds[1]];
    const convertedNE: [number, number] = [bounds[2], bounds[3]];
    const convertedNW: [number, number] = [bounds[0], bounds[3]];
    const convertedCenter: [number, number] = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];

    const convertedBounds: RectangleCoordinates = {
        northEast: convertedNE,
        southEast: convertedSE,
        southWest: convertedSW,
        northWest: convertedNW,
        center: convertedCenter,
    };

    const gridWidth = gridLevel[0];
    const gridHeight = gridLevel[1];

    const [swX, swY] = convertedBounds.southWest;
    const [baseX, baseY] = schemaBasePoint;

    const dX = swX - baseX
    const dY = swY - baseY

    const disX = Math.floor(dX / gridWidth) * gridWidth
    const disY = Math.floor(dY / gridHeight) * gridHeight

    const offsetX = disX - dX
    const offsetY = disY - dY

    const rectWidth = bounds[2] - bounds[0]
    const rectHeight = bounds[3] - bounds[1]

    const alignedSW = [bounds[0] + offsetX, bounds[1] + offsetY] as [number, number]
    const alignedSE = [alignedSW[0] + rectWidth, alignedSW[1]] as [number, number]
    const alignedNE = [alignedSW[0] + rectWidth, alignedSW[1] + rectHeight] as [number, number]
    const alignedNW = [bounds[0] + offsetX, bounds[1] + offsetY] as [number, number]
    const alignedCenter = [alignedSW[0], alignedSW[1] + rectHeight] as [number, number]

    const alignedBounds: RectangleCoordinates = {
        southWest: alignedSW,
        southEast: alignedSE,
        northEast: alignedNE,
        northWest: alignedNW,
        center: alignedCenter
    };

    const expandedWidth = Math.ceil(rectWidth / gridWidth) * gridWidth
    const expandedHeight = Math.ceil(rectHeight / gridHeight) * gridHeight

    const expandedSW = alignedSE as [number, number]
    const expandedSE = [expandedSW[0] + expandedWidth, expandedSW[1]] as [number, number]
    const expandedNE = [expandedSW[0] + expandedWidth, expandedSW[1] + expandedHeight] as [number, number]
    const expandedNW = [expandedSW[0], expandedSW[1] + expandedHeight] as [number, number]
    const expandedCenter = [expandedSW[0] + expandedWidth / 2, expandedSW[1] + expandedHeight / 2] as [number, number]



    const expandedBounds: RectangleCoordinates = {
        southWest: expandedSW,
        southEast: expandedSE,
        northEast: expandedNE,
        northWest: expandedNW,
        center: expandedCenter,
    };

    return { convertedBounds, alignedBounds, expandedBounds };
}

export function calculateGridCounts(
    southWest: [number, number],
    basePoint: [number, number],
    gridLevel: [number, number]
): { widthCount: number; heightCount: number } {
    const gridWidth = gridLevel[0];
    const gridHeight = gridLevel[1];
    const [swX, swY] = southWest;
    const [baseX, baseY] = basePoint;
    const widthCount = Math.abs((swX - baseX) / gridWidth);
    const heightCount = Math.abs((swY - baseY) / gridHeight);
    return { widthCount, heightCount };
}