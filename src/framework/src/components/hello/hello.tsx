import { useEffect, useRef } from 'react'
import HelloRenderer from './renderer'

export default function Hello() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const rendererRef = useRef<HelloRenderer | null>(null)

    useEffect(() => {
        let resizeObserver: ResizeObserver
        const canvas = canvasRef.current    // capture the current ref value

        if (canvas) {
            rendererRef.current = new HelloRenderer(canvas)
            rendererRef.current.init()

            // Create a ResizeObserver to watch for canvas size changes
            resizeObserver = new ResizeObserver(() => {
                rendererRef.current?.handleCanvasResize()
            });
            resizeObserver.observe(canvas)

            const renderLoop = () => {
                if (rendererRef.current) {
                    rendererRef.current.render()
                    requestAnimationFrame(renderLoop)
                }
            };
            requestAnimationFrame(renderLoop)
        }

        return () => {
            if (resizeObserver && canvas) {
                resizeObserver.unobserve(canvas)
            }
            if (rendererRef.current) {
                // Clean up WebGL resources
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