import store from '../../store'
import MapContainer from '../mapContainer/mapContainer'
import FloodsRenderer from './renderer'
import { useEffect, useRef } from 'react'


export default function Floods() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<FloodsRenderer | null>(null)

    useEffect(() => {
        const map = store.get<mapboxgl.Map>('map')!
        // const canvas = canvasRef.current

        if (map) {
            rendererRef.current = new FloodsRenderer(map)
        }

        return () => {
            if (rendererRef.current) {
                rendererRef.current.clean()
                rendererRef.current = null
            }
        }
    }, [])

    return (
        <div className={'relative w-full h-full bg-[#1E1E1E]'}>
            <MapContainer node={null} style='w-full h-full' />
        </div>
    )
}