import { useCallback, useEffect, useRef } from 'react'
import HelloRenderer from './renderer'

export default function Hello() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number | null>(null)
    const rendererRef = useRef<HelloRenderer | null>(null)

    const startRenderLoop = useCallback(() => {
        if (animationRef.current) return
        
        const render = () => {
            if (rendererRef.current) {
                rendererRef.current.render()
                animationRef.current = requestAnimationFrame(render)
            }
        }
        animationRef.current = requestAnimationFrame(render)
    }, [])

    const stopRenderLoop = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current)
            animationRef.current = null
        }
    }, [])

    useEffect(() => {
        const canvas = canvasRef.current

        if (canvas) {
            rendererRef.current = new HelloRenderer(canvas)

            rendererRef.current.renderControl = {
                start: startRenderLoop,
                stop: stopRenderLoop
            }
        }

        return () => {
            if (rendererRef.current) {
                rendererRef.current.clean()
                rendererRef.current = null
            }
        }
    }, [startRenderLoop, stopRenderLoop])

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