import gll from '@/core/gl/glLib'

const MaxGridNumINOneAxis = 50

export default class HelloRenderer {
    private isReady: boolean = false
    private gl: WebGL2RenderingContext
    private canvas: HTMLCanvasElement
    private resizeObserver: ResizeObserver
    private canvasWidth: number = 0
    private canvasHeight: number = 0
    private pixelRatio: number = window.devicePixelRatio || 1

    // Grid-related properties
    private gridLayers: { [index: number]: { width: number, height: number } } = {}

    // GPU-related resources
    private helloShader: WebGLShader = 0
    private gridShader: WebGLShader = 0
    private vao: WebGLVertexArrayObject = 0

    private helloImageTexture: WebGLTexture = 0
    private helloTexture: WebGLTexture = 0

    private helloFBO: WebGLFramebuffer = 0

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        // Create a ResizeObserver to watch for canvas size changes
        this.resizeObserver = new ResizeObserver(() => this.handleCanvasResize())
        this.resizeObserver.observe(canvas)

        this.gl = canvas.getContext('webgl2', {antialias: true, alpha: true}) as WebGL2RenderingContext
        gll.enableAllExtensions(this.gl)

        this.handleCanvasResize()

        const maxDir = this.canvas.width > this.canvas.height ? 0 : 1
        const d1 = maxDir === 0 ? this.canvas.height / MaxGridNumINOneAxis : this.canvas.width / MaxGridNumINOneAxis
        const width1 = Math.ceil(this.canvas.width / d1)
        const height1 = Math.ceil(this.canvas.height / d1)

        // Only create three grid layers: l1 - hello, gridman! l2 - Next Hydro l3 - OpenGMS
        this.gridLayers[0] = {
            width: width1,
            height: height1
        }
        this.gridLayers[1] = {
            width: width1 * 2,
            height: height1 * 2
        }
        this.gridLayers[2] = {
            width: width1 * 4,
            height: height1 * 4
        }
        console.log('Grid layers initialized:', this.gridLayers)

        this.init()
    }

    async init() {
        const gl = this.gl
        this.helloShader = await gll.createShader(this.gl, '/shaders/hello/hello.glsl')
        this.gridShader = await gll.createShader(this.gl, '/shaders/hello/grid.glsl')

        this.vao = gl.createVertexArray()

        const helloBitmap = await gll.loadImage('/images/hello/hello.png')
        this.helloImageTexture = gll.createTexture2D(gl, 0, helloBitmap.width, helloBitmap.height, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, helloBitmap)
        this.helloTexture = gll.createTexture2D(gl, 0, this.canvasWidth, this.canvasHeight, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE)

        this.helloFBO = gll.createFrameBuffer(gl, [this.helloTexture])

        this.isReady = true

        this.render()
    }

    handleCanvasResize() {
        this.pixelRatio = window.devicePixelRatio || 1
        this.canvasWidth = this.canvas.clientWidth * this.pixelRatio
        this.canvasHeight = this.canvas.clientHeight * this.pixelRatio
        this.canvas.width = this.canvasWidth
        this.canvas.height = this.canvasHeight

        if (!this.isReady) return

        // Reset canvas-related GPU resources
        const gl = this.gl

        gl.deleteTexture(this.helloTexture)
        this.helloTexture = gll.createTexture2D(gl, 0, this.canvasWidth, this.canvasHeight, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE)

        gl.deleteFramebuffer(this.helloFBO)
        this.helloFBO = gll.createFrameBuffer(gl, [this.helloTexture])

        this.render()
    }

    render() {
        if (!this.isReady) return

        const gl = this.gl
        gl.enable(gl.BLEND)
        gl.disable(gl.DEPTH_TEST)

        // Pass 1: Render hello texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.helloFBO)
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight)

        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.useProgram(this.helloShader)
        gl.bindTexture(gl.TEXTURE_2D, this.helloImageTexture)

        gl.uniform1i(gl.getUniformLocation(this.helloShader, 'uTexture'), 0)
        gl.uniform2f(gl.getUniformLocation(this.helloShader, 'uResolution'), this.canvasWidth, this.canvasHeight)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        gl.bindVertexArray(null)

        // Pass 2: Render
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight)

        gl.clearColor(41.0 / 255.0, 44.0 / 255.0, 51.0 / 255.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.useProgram(this.gridShader)
        gl.bindTexture(gl.TEXTURE_2D, this.helloTexture)

        gl.uniform1i(gl.getUniformLocation(this.gridShader, 'uTexture'), 0)
        gl.uniform2f(gl.getUniformLocation(this.gridShader, 'uGridDim'), this.gridLayers[0].width, this.gridLayers[0].height)

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.gridLayers[0].width * this.gridLayers[0].height)
        // gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, 2)
        gl.bindTexture(gl.TEXTURE_2D, null)


        // Error check
        gll.errorCheck(gl)
    }

    clean() {
        this.resizeObserver.unobserve(this.canvas)

        const gl = this.gl
        console.log('Cleaning up resources')
        gl.deleteProgram(this.helloShader)
        gl.deleteVertexArray(this.vao)
        gl.deleteTexture(this.helloImageTexture)
    }
}