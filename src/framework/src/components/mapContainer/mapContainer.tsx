import store from '@/store'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import { ISceneNode } from '@/core/scene/iscene'
import { useEffect, useRef, forwardRef } from 'react'
// @ts-expect-error no declare file for rectangle mode
import DrawRectangle from 'mapbox-gl-draw-rectangle-mode'
import { calculateRectangleCoordinates } from './utils'
import CustomLayerGroup from './customLayerGroup'

const initialLongitude = 114.051537
const initialLatitude = 22.446937
const initialZoom = 11
const maxZoom = 22

export interface DrawCreateEvent {
    features: Array<GeoJSON.Feature>
    type: string
}

export interface MapContainerProps {
    style?: string
    node: ISceneNode | null
    color?: string | null
}

const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
        clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
            // func(...args)
        }, delay)
    }
}

export const MapContainer = forwardRef<MapboxDraw, MapContainerProps>((props, ref) => {
    const { style, node, color } = props
    const mapWrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        mapboxgl.accessToken = import.meta.env.VITE_MAP_TOKEN
        let mapInstance: mapboxgl.Map
        let resizer: ResizeObserver | null = null
        let drawInstance: MapboxDraw | null = null
        let isProcessingDrawEvent = false

        const handleDrawCreate = (e: any) => {
            if (isProcessingDrawEvent) return

            isProcessingDrawEvent = true
            try {
                if (e.features && e.features.length > 0) {
                    const feature = e.features[0];
                    if (drawInstance && drawInstance.getMode() === 'draw_rectangle' && feature.geometry.type === 'Polygon') {
                        const coordinates = calculateRectangleCoordinates(feature)
                        const drawCompleteEvent = new CustomEvent('rectangle-draw-complete', {
                            detail: { coordinates }
                        })
                        document.dispatchEvent(drawCompleteEvent)
                        if (drawInstance) {
                            drawInstance.changeMode('simple_select')
                        }
                    }
                }
            } finally {
                isProcessingDrawEvent = false
            }
        }

        if (mapWrapperRef.current) {
            mapInstance = new mapboxgl.Map({
                container: mapWrapperRef.current,
                style: 'mapbox://styles/mapbox/streets-v12',
                projection: 'globe',
                center: [initialLongitude, initialLatitude],
                zoom: initialZoom,
                maxZoom: maxZoom,
                attributionControl: false,
                boxZoom: false,
            })
            mapInstance.on('load', async () => {
                const layerGroup = new CustomLayerGroup()
                layerGroup.id = 'gridman-custom-layer-group'
                mapInstance.addLayer(layerGroup)
                store.set('clg', layerGroup)
            })
            store.set('map', mapInstance)

            mapInstance.on('style.load', () => {
                mapInstance.setFog({})
            })

            const drawColor = color || '#F06B00'

            drawInstance = new MapboxDraw({
                displayControlsDefault: false,
                boxSelect: false,
                modes: {
                    ...MapboxDraw.modes,
                    draw_rectangle: DrawRectangle,
                },
                styles: [
                    // Active point style
                    {
                        'id': 'gl-draw-point-active',
                        'type': 'circle',
                        'filter': ['all', ['==', '$type', 'Point'], ['==', 'active', 'true']],
                        'paint': {
                            'circle-radius': 7,
                            'circle-color': drawColor
                        }
                    },
                    // Inactive point style
                    {
                        'id': 'gl-draw-point',
                        'type': 'circle',
                        'filter': ['all', ['==', '$type', 'Point'], ['==', 'active', 'false']],
                        'paint': {
                            'circle-radius': 5,
                            'circle-color': drawColor
                        }
                    },
                    // Line style
                    {
                        'id': 'gl-draw-line',
                        'type': 'line',
                        'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']],
                        'layout': {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        'paint': {
                            'line-color': drawColor,
                            'line-width': 2,
                            ...(!color ? { 'line-dasharray': [2, 2] } : {})
                        }
                    },
                    // Polygon fill style
                    {
                        'id': 'gl-draw-polygon-fill',
                        'type': 'fill',
                        'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                        'paint': {
                            'fill-color': drawColor,
                            'fill-outline-color': drawColor,
                            ...(color ? { 'fill-opacity': 0.3 } : { 'fill-opacity': 0.1 })
                        }
                    },
                    // Polygon outline style
                    {
                        'id': 'gl-draw-polygon-stroke',
                        'type': 'line',
                        'filter': ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
                        'layout': {
                            'line-cap': 'round',
                            'line-join': 'round'
                        },
                        'paint': {
                            'line-color': drawColor,
                            'line-width': 2,
                            ...(!color ? { 'line-dasharray': [2, 2] } : {})
                        }
                    },
                    // Vertex style
                    {
                        'id': 'gl-draw-point-mid-point',
                        'type': 'circle',
                        'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
                        'paint': {
                            'circle-radius': 4,
                            'circle-color': drawColor
                        }
                    },
                    // Vertex point style
                    {
                        'id': 'gl-draw-point-and-mid',
                        'type': 'circle',
                        'filter': ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
                        'paint': {
                            'circle-radius': 5,
                            'circle-color': drawColor
                        }
                    }
                ]
            })
            store.set('mapDraw', drawInstance)

            mapInstance.addControl(drawInstance)
            mapInstance.on('draw.create', handleDrawCreate)

            const currentMapInstance = mapInstance
            resizer = new ResizeObserver(
                debounce(() => {
                    currentMapInstance?.resize()
                }, 100)
            )
            resizer.observe(mapWrapperRef.current)
        }

        return () => {
            if (resizer && mapWrapperRef.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                resizer.unobserve(mapWrapperRef.current)
                resizer.disconnect()
            }
            if (mapInstance) {
                if (drawInstance) {
                    mapInstance.removeControl(drawInstance)
                    mapInstance.off('draw.create', handleDrawCreate)
                }
                mapInstance.remove()
                store.set('map', null)
                store.set('mapDraw', null)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [color])

    return (
        <div className={style ?? 'relative w-full h-full'} ref={mapWrapperRef} />
    )
})

export default MapContainer