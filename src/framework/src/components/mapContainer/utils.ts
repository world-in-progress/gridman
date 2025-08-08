import proj4 from 'proj4'
import store from '@/store'
import mapboxgl from 'mapbox-gl'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { RectangleCoordinates } from '@/resource/scenario/patches/types'

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

export const addMapLineBetweenPoints = (start: [number, number], end: [number, number], widthCount: number, heightCount: number) => {
    const map = store.get<mapboxgl.Map>('map')

    if (!map || !map.getCanvas()) return

    const addFactors = () => {
        const lineId = `grid-line-${Date.now()}`
        map.addSource(lineId, {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: [start, end]
                }
            }
        })

        map.addLayer({
            id: lineId,
            type: 'line',
            source: lineId,
            layout: {
                'line-join': 'round',
                'line-cap': 'round',
            },
            paint: {
                'line-color': '#0088FF',
                'line-width': 2,
                'line-dasharray': [2, 1],
            },
        })

        const midPoint: [number, number] = [
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2,
        ]

        const labelText = `W: ${widthCount} × H: ${heightCount}`
        const el = document.createElement('div')

        el.className = 'grid-count-label'
        el.style.backgroundColor = 'rgba(0, 136, 255, 0.85)'
        el.style.color = 'white'
        el.style.padding = '6px 10px'
        el.style.borderRadius = '6px'
        el.style.fontSize = '12px'
        el.style.fontWeight = 'bold'
        el.style.whiteSpace = 'nowrap'
        el.style.pointerEvents = 'none'
        el.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)'
        el.style.fontFamily = 'Arial, sans-serif'
        el.style.letterSpacing = '0.5px'
        el.style.border = '1px solid rgba(255, 255, 255, 0.2)'
        el.textContent = labelText

        const marker = new mapboxgl.Marker({
            element: el,
            anchor: 'center',
        })
            .setLngLat(midPoint)
            .addTo(map)
    }


    if (map.isStyleLoaded()) {
        addFactors()
    } else {
        const timeoutId = setTimeout(() => {
            if (map.isStyleLoaded()) {
                addFactors()
            } else {
                // Try again with a longer delay
                const retryId = setTimeout(() => {
                    addFactors()
                }, 100)
                map.once('style.load', () => {
                    clearTimeout(retryId)
                    addFactors()
                })
            }
        }, 100)
    }
}

export const clearGridLines = () => {
    const map = store.get<mapboxgl.Map>('map')
    if (!map || !map.getCanvas()) return

    const style = map.getStyle()
    style.layers.forEach(layer => {
        if (layer.id.startsWith('grid-line-')) {
            map.removeLayer(layer.id)
        }
    })

    Object.keys(style.sources).forEach(sourceId => {
        if (sourceId.startsWith('grid-line-')) {
            map.removeSource(sourceId)
        }
    })

    const labels = document.getElementsByClassName('grid-count-label')
    if (labels.length > 0) {

        Array.from(labels).forEach(label => {
            const markerElement = label.closest('.mapboxgl-marker')
            if (markerElement) {
                markerElement.remove()
            }
        })
    }
}

export const flyToMarker = (coord: [number, number], zoom?: number): void => {
    const map = store.get<mapboxgl.Map>('map')

    if (!map || !coord || coord.length < 2) return

    clearMapMarkers()
    addMapMarker(coord)

    map.flyTo({
        center: [coord[0], coord[1]],
        zoom: zoom || 14,
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
    if (!coord) return [0, 0]
    try {
        // Ensure source and target projection definitions are registered
        if (epsgDefinitions[fromEPSG]) {
            proj4.defs(`EPSG:${fromEPSG}`, epsgDefinitions[fromEPSG])
        }
        if (epsgDefinitions[toEPSG]) {
            proj4.defs(`EPSG:${toEPSG}`, epsgDefinitions[toEPSG])
        }

        const fromProjection = `EPSG:${fromEPSG}`
        const toProjection = `EPSG:${toEPSG}`

        // Perform coordinate conversion
        return proj4(fromProjection, toProjection, coord)
    } catch (e) {
        console.error('Coordinate conversion error:', e)
        return coord // Return original coordinates when error occurs
    }
}

export const convertCoordinateStr = (
    lon: string,
    lat: string,
    fromEPSG: string,
    toEPSG: string
): { x: string, y: string } | null => {
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
}

export const convertCoordinate = (
    lon: number,
    lat: number,
    fromEPSG: string,
    toEPSG: string
): { x: number, y: number } | null => {
    if (!lon || !lat || !fromEPSG || !toEPSG) return null

    try {
        if (epsgDefinitions[fromEPSG]) {
            proj4.defs(`EPSG:${fromEPSG}`, epsgDefinitions[fromEPSG])
        }

        if (epsgDefinitions[toEPSG]) {
            proj4.defs(`EPSG:${toEPSG}`, epsgDefinitions[toEPSG])
        }

        const result = proj4(`EPSG:${fromEPSG}`, `EPSG:${toEPSG}`, [lon, lat])

        return {
            x: result[0],
            y: result[1],
        }
    } catch (e) {
        console.error('Coordinate conversion error:', e)
        return null
    }
}

export const convertToWGS84 = (
    coordinates: [number, number, number, number],
    fromEpsg: string
): [number, number, number, number] => {
    if (!coordinates || coordinates.length < 4 || !fromEpsg) {
        return [0, 0, 0, 0]
    }

    try {
        const sw = convertSinglePointCoordinate(
            [coordinates[0], coordinates[1]],
            fromEpsg.toString(),
            '4326'
        )
        const ne = convertSinglePointCoordinate(
            [coordinates[2], coordinates[3]],
            fromEpsg.toString(),
            '4326'
        )
        return [sw[0], sw[1], ne[0], ne[1]]
    } catch (error) {
        console.error('坐标转换错误:', error)
        return [0, 0, 0, 0]
    }
}


// Clear drawing patch bounds
export const clearDrawPatchBounds = (id?: string) => {
    const map = store.get<mapboxgl.Map>('map')
    if (!map || !map.isStyleLoaded()) return

    if (id) {
        // If an ID is provided, remove the specific source and its layers
        const sourceId = `bounds-source-${id}`
        const fillLayerId = `bounds-fill-${id}`
        const outlineLayerId = `bounds-outline-${id}`

        if (map.getLayer(fillLayerId)) {
            map.removeLayer(fillLayerId)
        }
        if (map.getLayer(outlineLayerId)) {
            map.removeLayer(outlineLayerId)
        }
        if (map.getSource(sourceId)) {
            map.removeSource(sourceId)
        }
    } else {
        // If no ID is provided, remove all layers and sources related to patch bounds
        const style = map.getStyle()
        style.layers.forEach(layer => {
            if (layer.id.startsWith('bounds-fill') || layer.id.startsWith('bounds-outline')) {
                map.removeLayer(layer.id)
            }
        })
        Object.keys(style.sources).forEach(sourceId => {
            if (sourceId.startsWith('bounds-source')) {
                map.removeSource(sourceId)
            }
        })
    }

    const draw = store.get<MapboxDraw>('mapDraw')
    if (draw) {
        draw.deleteAll()
    }
}

// Clear specific patch bounds by id provided
export const clearBoundsById = (id: string) => {
    const map = store.get<mapboxgl.Map>('map')
    if (!map) return
    const sourceId = `bounds-source-${id}`
    const fillLayerId = `bounds-fill-${id}`
    const outlineLayerId = `bounds-outline-${id}`
    if (map.getLayer(fillLayerId)) {
        map.removeLayer(fillLayerId)
    }
    if (map.getLayer(outlineLayerId)) {
        map.removeLayer(outlineLayerId)
    }
    if (map.getSource(sourceId)) {
        map.removeSource(sourceId)
    }
}

// Add patch bounds to map
export const addMapPatchBounds = (
    bounds: [number, number, number, number],
    id?: string,
    fit?: boolean,
    options?: {
        fillColor?: string,
        lineColor?: string,
        opacity?: number,
        lineWidth?: number,
    }
) => {
    const map = store.get<mapboxgl.Map>('map')
    if (!map) return

    const sourceId = id ? `bounds-source-${id}` : 'bounds-source'
    const fillLayerId = id ? `bounds-fill-${id}` : 'bounds-fill'
    const outlineLayerId = id ? `bounds-outline-${id}` : 'bounds-outline'

    const addBounds = () => {
        // Remove existing layers/source with the same ID before adding new ones
        if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId)
        if (map.getLayer(outlineLayerId)) map.removeLayer(outlineLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)

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

        map.addSource(sourceId, {
            type: 'geojson',
            data: boundsData as GeoJSON.Feature<GeoJSON.Polygon>
        })

        const defaultFillColor = id === 'adjusted-bounds' ? '#00FF00' : '#00A8C2'
        const defaultLineColor = id === 'adjusted-bounds' ? '#FF1A00' : '#0072FF'
        const defaultOpacity = id === 'adjusted-bounds' ? 0.1 : 0.2
        const defaultLineWidth = 2

        const fillColor = options?.fillColor || defaultFillColor
        const lineColor = options?.lineColor || defaultLineColor
        const opacity = options?.opacity !== undefined ? options.opacity : defaultOpacity
        const lineWidth = options?.lineWidth !== undefined ? options.lineWidth : defaultLineWidth

        // Inner filled layer
        map.addLayer({
            id: fillLayerId,
            type: 'fill',
            source: sourceId,
            layout: {},
            paint: {
                'fill-color': fillColor,
                'fill-opacity': opacity
            }
        })

        // Outline layer
        map.addLayer({
            id: outlineLayerId,
            type: 'line',
            source: sourceId,
            layout: {},
            paint: {
                'line-color': lineColor,
                'line-width': lineWidth
            }
        })

        // Fly to bounds
        if (fit !== false) {
            map.fitBounds([
                [bounds[0], bounds[1]],
                [bounds[2], bounds[3]]
            ], {
                padding: 50,
                duration: 1000
            })
        }
    }

    if (map.isStyleLoaded()) {
        addBounds()
    } else {
        const timeoutId = setTimeout(() => {
            if (map.isStyleLoaded()) {
                addBounds()
            } else {
                // Try again with a longer delay
                const retryId = setTimeout(() => {
                    addBounds()
                }, 100)
                map.once('style.load', () => {
                    clearTimeout(retryId)
                    addBounds()
                })
            }
        }, 100)
    }
}

// Start drawing rectangle
export const startDrawingRectangle = () => {
    const map = store.get<mapboxgl.Map>('map')
    const draw = store.get<MapboxDraw>('mapDraw')

    if (!map || !draw) {
        console.error('Map or drawing tool not initialized')
        return false
    }

    try {
        draw.deleteAll()
        draw.changeMode('draw_rectangle')
        return true
    } catch (error) {
        console.error('Start drawing rectangle error:', error)
        return false
    }
}

// Stop drawing rectangle
export const stopDrawingRectangle = () => {
    const map = store.get<mapboxgl.Map>('map')
    const draw = store.get<MapboxDraw>('mapDraw')

    if (!map || !draw) return

    try {
        draw.changeMode('simple_select')
    } catch (error) {
        console.error('Stop drawing rectangle error:', error)
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
    const draw = store.get<MapboxDraw>('mapDraw')

    if (!draw) return null

    const features = draw.getAll().features
    if (features.length === 0) return null

    const polygon = features[0]
    if (polygon.geometry.type !== 'Polygon') return null

    const coords = polygon.geometry.coordinates[0]
    if (coords.length < 4) return null

    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity

    for (const [x, y] of coords) {
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
    }

    return {
        northEast: [maxX, maxY],
        southWest: [minX, minY],
        southEast: [maxX, minY],
        northWest: [minX, maxY],
        center: [(minX + maxX) / 2, (minY + maxY) / 2]
    }
}

// Align and Expand bounds to fit grid level
export const adjustPatchBounds = (
    bounds: [number, number, number, number],
    gridLevel: [number, number],
    fromEPSG: string,
    toEPSG: string,
    schemaBasePoint: [number, number]
): {
    convertedBounds: RectangleCoordinates | null
    alignedBounds: RectangleCoordinates | null
    expandedBounds: RectangleCoordinates | null
} => {
    if (!bounds || !gridLevel || !toEPSG || !schemaBasePoint || gridLevel.length < 2) {
        return {
            convertedBounds: null,
            alignedBounds: null,
            expandedBounds: null
        }
    }

    // Original bounds coordinates on EPSG: 4326
    const originalSW: [number, number] = [bounds[0], bounds[1]]
    const originalSE: [number, number] = [bounds[2], bounds[1]]
    const originalNE: [number, number] = [bounds[2], bounds[3]]
    const originalNW: [number, number] = [bounds[0], bounds[3]]
    const originalCenter: [number, number] = [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2]

    // Convert original bounds coordinates to target EPSG
    let convertedSW: [number, number] = originalSW
    let convertedSE: [number, number] = originalSE
    let convertedNE: [number, number] = originalNE
    let convertedNW: [number, number] = originalNW
    let convertedCenter: [number, number] = originalCenter

    if (toEPSG !== fromEPSG) {
        convertedSW = convertSinglePointCoordinate(originalSW, fromEPSG, toEPSG) as [number, number]
        convertedSE = convertSinglePointCoordinate(originalSE, fromEPSG, toEPSG) as [number, number]
        convertedNE = convertSinglePointCoordinate(originalNE, fromEPSG, toEPSG) as [number, number]
        convertedNW = convertSinglePointCoordinate(originalNW, fromEPSG, toEPSG) as [number, number]
        convertedCenter = convertSinglePointCoordinate(originalCenter, fromEPSG, toEPSG) as [number, number]
    }

    const convertedBounds: RectangleCoordinates = {
        northEast: convertedNE,
        southEast: convertedSE,
        southWest: convertedSW,
        northWest: convertedNW,
        center: convertedCenter,
    }

    const gridWidth = gridLevel[0]
    const gridHeight = gridLevel[1]

    const [swX, swY] = convertedBounds.southWest
    const [baseX, baseY] = schemaBasePoint

    const dX = swX - baseX
    const dY = swY - baseY

    const disX = Math.floor(dX / gridWidth) * gridWidth
    const disY = Math.floor(dY / gridHeight) * gridHeight

    const offsetX = disX - dX
    const offsetY = disY - dY

    const rectWidth = convertedNE[0] - convertedSW[0]
    const rectHeight = convertedNE[1] - convertedSW[1]

    // Align bounds to base point
    const alignedSW = [convertedSW[0] + offsetX, convertedSW[1] + offsetY] as [number, number]
    const alignedSE = [alignedSW[0] + rectWidth, alignedSW[1]] as [number, number]
    const alignedNE = [alignedSW[0] + rectWidth, alignedSW[1] + rectHeight] as [number, number]
    const alignedNW = [alignedSW[0], alignedSW[1] + rectHeight] as [number, number]
    const alignedCenter = [alignedSW[0] + rectWidth / 2, alignedSW[1] + rectHeight / 2] as [number, number]

    const alignedBounds: RectangleCoordinates = {
        southWest: alignedSW,
        southEast: alignedSE,
        northEast: alignedNE,
        northWest: alignedNW,
        center: alignedCenter
    }

    const expandedWidth = Math.ceil(rectWidth / gridWidth) * gridWidth
    const expandedHeight = Math.ceil(rectHeight / gridHeight) * gridHeight

    // Expand bounds to fit grid level
    const expandedSW = alignedSW as [number, number]
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
    }

    return { convertedBounds, alignedBounds, expandedBounds }
}

export function calculateGridCounts(
    southWest: [number, number],
    basePoint: [number, number],
    gridLevel: [number, number]
): { widthCount: number, heightCount: number } {
    const gridWidth = gridLevel[0]
    const gridHeight = gridLevel[1]
    const [swX, swY] = southWest
    const [baseX, baseY] = basePoint
    const widthCount = Math.abs((swX - baseX) / gridWidth)
    const heightCount = Math.abs((swY - baseY) / gridHeight)
    return { widthCount, heightCount }
}


export const calculateRectangleCoordinates = (
    feature: any
): RectangleCoordinates => {
    const coordinates = feature.geometry.coordinates[0]

    let minLng = Infinity,
        maxLng = -Infinity,
        minLat = Infinity,
        maxLat = -Infinity

    coordinates.forEach((coord: [number, number]) => {
        if (coord[0] < minLng) minLng = coord[0]
        if (coord[0] > maxLng) maxLng = coord[0]
        if (coord[1] < minLat) minLat = coord[1]
        if (coord[1] > maxLat) maxLat = coord[1]
    })

    const northEast: [number, number] = [maxLng, maxLat]
    const southEast: [number, number] = [maxLng, minLat]
    const southWest: [number, number] = [minLng, minLat]
    const northWest: [number, number] = [minLng, maxLat]
    const center: [number, number] = [
        (minLng + maxLng) / 2,
        (minLat + maxLat) / 2,
    ]

    return {
        northEast,
        southEast,
        southWest,
        northWest,
        center,
    }
}

export const highlightPatchBounds = (
    bounds: [number, number, number, number],
    id: string
) => {
    const map = store.get<mapboxgl.Map>('map')
    if (!map) return

    const prevHighlightId = store.get<string>('highlightedPatchId')
    if (prevHighlightId) {
        const prevSourceId = `bounds-source-${prevHighlightId}`
        const prevOutlineLayerId = `bounds-outline-${prevHighlightId}`
        if (map.getLayer(prevOutlineLayerId)) {
            map.setPaintProperty(prevOutlineLayerId, 'line-color', '#0072FF')
            map.setPaintProperty(prevOutlineLayerId, 'line-width', 2)
        }
    }

    store.set('highlightedPatchId', id)

    const sourceId = `bounds-source-${id}`
    const outlineLayerId = `bounds-outline-${id}`

    if (map.getLayer(outlineLayerId)) {
        map.setPaintProperty(outlineLayerId, 'line-color', '#F3FF00')
        map.setPaintProperty(outlineLayerId, 'line-width', 5)

        map.fitBounds([
            [bounds[0], bounds[1]],
            [bounds[2], bounds[3]]
        ], {
            padding: 80,
            duration: 1000
        })
    }
}