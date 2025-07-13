import HelloRenderer from './renderer'
import { useEffect, useRef } from 'react'

export default function Hello() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<HelloRenderer | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current

        if (canvas) {
            rendererRef.current = new HelloRenderer(canvas)
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
            <canvas 
                ref={canvasRef}
                key='helloCanvas'
                className={'absolute w-full h-full  bg-[#292C33]'}>
            </canvas>
        </div>
    )
}