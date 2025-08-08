import React, { useEffect, useReducer, useRef } from 'react'
import { InpPageProps, SwmmConduit, SwmmNode, SwmmParseResult, SwmmSubcatchment } from './types'
import MapContainer from '@/components/mapContainer/mapContainer'
import { SceneNode } from '@/components/resourceScene/scene'
import { InpPageContext } from './inp'
import { convertSinglePointCoordinate } from '@/components/mapContainer/utils'
import store from '@/store'
import mapboxgl from 'mapbox-gl'


// =============================
// SWMM INP -> GeoJSON -> Mapbox
// =============================
export function parseSwmmInp(inpContent: string): SwmmParseResult {
    const nodes: SwmmNode[] = []
    const conduits: SwmmConduit[] = []
    const linkIdToVertices: Record<string, Array<[number, number]>> = {}
    const subcatchments: SwmmSubcatchment[] = []
    const subIdToPolygon: Record<string, Array<[number, number]>> = {}

    let inCoordinates = false
    let inConduits = false
    let inVertices = false
    let inSubcatchments = false
    let inPolygons = false

    const subIdSet = new Set<string>()

    const lines = inpContent.split(/\r?\n/)
    for (let rawLine of lines) {
        let line = rawLine.trim()
        if (!line || line.startsWith(';;')) continue

        if (line.startsWith('[') && line.endsWith(']')) {
            const section = line.toUpperCase()
            inCoordinates = section === '[COORDINATES]'
            inConduits = section === '[CONDUITS]'
            inVertices = section === '[VERTICES]'
            inSubcatchments = section === '[SUBCATCHMENTS]'
            inPolygons = section === '[POLYGONS]'
            continue
        }

        if (inCoordinates) {
            const parts = line.split(/\s+/)
            if (parts.length >= 3) {
                const [id, xStr, yStr] = parts
                const x = parseFloat(xStr)
                const y = parseFloat(yStr)
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    nodes.push({ id, x, y })
                }
            }
            continue
        }

        if (inConduits) {
            const parts = line.split(/\s+/)
            if (parts.length >= 3) {
                const [id, fromId, toId] = parts
                conduits.push({ id, fromId, toId })
            }
            continue
        }

        if (inVertices) {
            const parts = line.split(/\s+/)
            if (parts.length >= 3) {
                const [linkId, xStr, yStr] = parts
                const x = parseFloat(xStr)
                const y = parseFloat(yStr)
                if (!linkIdToVertices[linkId]) linkIdToVertices[linkId] = []
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    linkIdToVertices[linkId].push([x, y])
                }
            }
            continue
        }

        if (inSubcatchments) {
            const parts = line.split(/\s+/)
            if (parts.length >= 1) {
                const id = parts[0]
                if (id && !subIdSet.has(id)) {
                    subIdSet.add(id)
                    subcatchments.push({ id })
                }
            }
            continue
        }

        if (inPolygons) {
            const parts = line.split(/\s+/)
            if (parts.length >= 3) {
                const [sid, xStr, yStr] = parts
                const x = parseFloat(xStr)
                const y = parseFloat(yStr)
                if (!subIdToPolygon[sid]) subIdToPolygon[sid] = []
                if (Number.isFinite(x) && Number.isFinite(y)) {
                    subIdToPolygon[sid].push([x, y])
                }
            }
            continue
        }
    }

    for (const conduit of conduits) {
        if (linkIdToVertices[conduit.id]) {
            conduit.vertices = linkIdToVertices[conduit.id]
        }
    }

    for (const s of subcatchments) {
        const ring = subIdToPolygon[s.id]
        if (ring && ring.length > 0) s.polygon = ring
    }

    return { nodes, conduits, subcatchments }
}

export function swmmInpToGeoJSON(
    inpData: SwmmParseResult,
    fromEPSG?: string,
    toEPSG: string = '4326'
): GeoJSON.FeatureCollection {
    const needProject = !!fromEPSG && fromEPSG !== toEPSG

    const projectPoint = (pt: [number, number]): [number, number] => {
        if (!needProject || !fromEPSG) return pt
        return convertSinglePointCoordinate(pt, fromEPSG, toEPSG) as [number, number]
    }

    const geoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: []
    }

    const nodeIdToProjected: Record<string, [number, number]> = {}
    for (const node of inpData.nodes) {
        const coord = projectPoint([node.x, node.y])
        nodeIdToProjected[node.id] = coord
        geoJSON.features.push({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: coord },
            properties: { id: node.id, kind: 'node' }
        })
    }

    for (const c of inpData.conduits) {
        const from = nodeIdToProjected[c.fromId]
        const to = nodeIdToProjected[c.toId]
        if (!from || !to) continue

        const lineCoords: Array<[number, number]> = [from]
        if (c.vertices && c.vertices.length > 0) {
            for (const v of c.vertices) lineCoords.push(projectPoint(v))
        }
        lineCoords.push(to)

        geoJSON.features.push({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: lineCoords },
            properties: { id: c.id, from: c.fromId, to: c.toId, kind: 'conduit' }
        })
    }

    // Subcatchments as Polygons
    if (inpData.subcatchments && inpData.subcatchments.length > 0) {
        for (const s of inpData.subcatchments) {
            if (!s.polygon || s.polygon.length < 3) continue
            const ring = s.polygon.map(projectPoint)
            // ensure closed ring
            const first = ring[0]
            const last = ring[ring.length - 1]
            if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)

            geoJSON.features.push({
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [ring] },
                properties: { id: s.id, kind: 'subcatchment' }
            })
        }
    }

    return geoJSON
}

export function addGeoJSONToMapAsSwmm(
    geoJSON: GeoJSON.FeatureCollection,
    idPrefix: string = 'swmm',
    fit: boolean = true
): void {
    const map = store.get<mapboxgl.Map>('map')
    if (!map) return

    const sourceId = `${idPrefix}-source`
    const nodesLayerId = `${idPrefix}-nodes`
    const conduitsLayerId = `${idPrefix}-conduits`
    const subcatchmentsLayerId = `${idPrefix}-subcatchments`

    const addLayers = () => {

        if (map.getLayer(nodesLayerId)) map.removeLayer(nodesLayerId)
        if (map.getLayer(conduitsLayerId)) map.removeLayer(conduitsLayerId)
        if (map.getLayer(subcatchmentsLayerId)) map.removeLayer(subcatchmentsLayerId)
        if (map.getSource(sourceId)) map.removeSource(sourceId)

        map.addSource(sourceId, { type: 'geojson', data: geoJSON })

        map.addLayer({
            id: subcatchmentsLayerId,
            type: 'fill',
            source: sourceId,
            filter: ['in', '$type', 'Polygon', 'MultiPolygon'],
            paint: {
                'fill-color': '#00bb00',
                'fill-opacity': 0.25
            }
        })

        map.addLayer({
            id: nodesLayerId,
            type: 'circle',
            source: sourceId,
            filter: ['==', '$type', 'Point'],
            paint: {
                'circle-radius': 4,
                'circle-color': '#007cbf',
                'circle-stroke-width': 1,
                'circle-stroke-color': '#ffffff'
            }
        })

        map.addLayer({
            id: conduitsLayerId,
            type: 'line',
            source: sourceId,
            filter: ['==', '$type', 'LineString'],
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#ff0000', 'line-width': 2 }
        })

        if (fit) {
            const coords: Array<[number, number]> = []
            for (const f of geoJSON.features) {
                const g = f.geometry
                if (!g) continue
                if (g.type === 'Point') {
                    coords.push((g as GeoJSON.Point).coordinates as [number, number])
                } else if (g.type === 'LineString') {
                    coords.push(...((g as GeoJSON.LineString).coordinates as Array<[number, number]>))
                } else if (g.type === 'Polygon') {
                    const rings = (g as GeoJSON.Polygon).coordinates
                    if (rings.length > 0) coords.push(...(rings[0] as Array<[number, number]>))
                }
            }
            if (coords.length > 0) {
                const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]))
                map.fitBounds(bounds, { padding: 100, duration: 100 })
            }
        }
    }

    if (map.isStyleLoaded()) {
        addLayers()
    } else {
        const timeoutId = setTimeout(() => {
            if (map.isStyleLoaded()) {
                addLayers()
            } else {
                const retryId = setTimeout(() => { addLayers() }, 100)
                map.once('style.load', () => {
                    clearTimeout(retryId)
                    addLayers()
                })
            }
        }, 100)
    }
}

export function clearSwmmFromMap(idPrefix: string = 'swmm'): void {
    const map = store.get<mapboxgl.Map>('map')
    if (!map) return

    const sourceId = `${idPrefix}-source`
    const nodesLayerId = `${idPrefix}-nodes`
    const conduitsLayerId = `${idPrefix}-conduits`
    const subcatchmentsLayerId = `${idPrefix}-subcatchments`

    if (map.getLayer(nodesLayerId)) map.removeLayer(nodesLayerId)
    if (map.getLayer(conduitsLayerId)) map.removeLayer(conduitsLayerId)
    if (map.getLayer(subcatchmentsLayerId)) map.removeLayer(subcatchmentsLayerId)
    if (map.getSource(sourceId)) map.removeSource(sourceId)
}

// Method 1: load INP content and render SWMM on map
export function loadInpAndRenderSwmm(
    inpContent: string,
    options?: {
        idPrefix?: string;
        fromEPSG?: string;
        toEPSG?: string;
        fit?: boolean
    }
): GeoJSON.FeatureCollection {
    const { idPrefix = 'swmm', fromEPSG, toEPSG = '4326', fit = true } = options || {}
    const parsed = parseSwmmInp(inpContent)
    const geo = swmmInpToGeoJSON(parsed, fromEPSG, toEPSG)
    addGeoJSONToMapAsSwmm(geo, idPrefix, fit)
    return geo
}

// Method 2: load INP from url and render SWMM on map
export async function renderSwmmFromUrl(
    url: string,
    options?: { idPrefix?: string; fromEPSG?: string; toEPSG?: string; fit?: boolean }
): Promise<GeoJSON.FeatureCollection> {
    const response = await fetch(url)
    const text = await response.text()
    return loadInpAndRenderSwmm(text, options)
}
//////////////////////////////////////////////////////////////////////////////////

export default function InpPage({ node }: InpPageProps) {

    const [, triggerRepaint] = useReducer(x => x + 1, 0)
    const pageContext = useRef<InpPageContext | null>(null)

    useEffect(() => {
        loadContext(node as SceneNode)

        return () => {
            unloadContext()
        }
    }, [node])

    const loadContext = async (node: SceneNode) => {
        pageContext.current = await node.getPageContext() as InpPageContext

        const inpData = pageContext.current.inpData.data

        loadInpAndRenderSwmm(inpData, {
            fromEPSG: '2326',
            toEPSG: '4326',
            idPrefix: 'swmm',
            fit: true,
        })

        triggerRepaint()
    }

    const unloadContext = () => {
        clearSwmmFromMap()
    }

    return (
        <div className='relative w-full h-full flex flex-col'>
            <MapContainer node={node} />
        </div>
    )
}
