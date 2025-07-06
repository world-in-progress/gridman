import store from '@/store'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapboxDraw from '@mapbox/mapbox-gl-draw'
import { ISceneNode } from '@/core/scene/iscene'
import { useEffect, useRef, forwardRef } from 'react'

const initialLongitude = 114.051537
const initialLatitude = 22.446937
const initialZoom = 11
const maxZoom = 22

declare global {
    interface Window {
        mapboxDrawInstance?: MapboxDraw
    }
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

export interface MapContainerProps {
    style?: string
    node: ISceneNode | null
}

const MapContainer = forwardRef<MapboxDraw, MapContainerProps>((props, ref) => {
    const { style, node } = props
    const mapWrapperRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        mapboxgl.accessToken = import.meta.env.VITE_MAP_TOKEN
        let mapInstance: mapboxgl.Map | null = null
        let resizer: ResizeObserver | null = null

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
            store.set('map', mapInstance)

            if (mapWrapperRef.current) {
                if (mapInstance) {
                    mapInstance.on('style.load', () => {
                        mapInstance!.setFog({})
                    })
                }

                const currentMapInstance = mapInstance
                resizer = new ResizeObserver(
                    debounce(() => {
                        currentMapInstance?.resize()
                    }, 100)
                )
                resizer.observe(mapWrapperRef.current)
            }
        }

        return () => {
            if (resizer && mapWrapperRef.current) {
                // eslint-disable-next-line react-hooks/exhaustive-deps
                resizer.unobserve(mapWrapperRef.current)
                resizer.disconnect()
            }
            if (mapInstance) {
                mapInstance.remove()
                store.set('map', null)
            }
        }
    }, [])

    return (
        <div className={style ?? 'relative w-full h-full'} ref={mapWrapperRef} />
    )
})

export default MapContainer