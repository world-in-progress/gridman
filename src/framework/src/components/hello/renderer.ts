import gll from '@/core/gl/glLib'

export default class HelloRenderer {
    private gl : WebGL2RenderingContext
    private canvas: HTMLCanvasElement
    private canvasWidth: number = 0
    private canvasHeight: number = 0
    private pixelRatio: number = window.devicePixelRatio || 1

    // GPU-related resources
    private shader: WebGLShader = 0
    private vao: WebGLVertexArrayObject = 0

    private helloTexture: WebGLTexture = 0

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas
        this.gl = canvas.getContext('webgl2', {antialias: true, alpha: true}) as WebGL2RenderingContext
        gll.enableAllExtensions(this.gl)
        this.handleCanvasResize()
    }

    async init() {
        const gl = this.gl
        this.shader = await gll.createShader(this.gl, '/shaders/triangle.glsl')
        this.vao = gl.createVertexArray()

        const helloBitmap = await gll.loadImage('/images/hello/hello.png')
        this.helloTexture = gll.createTexture2D(gl, 0, helloBitmap.width, helloBitmap.height, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, helloBitmap)
    }

    handleCanvasResize() {
        this.pixelRatio = window.devicePixelRatio || 1
        this.canvasWidth = this.canvas.clientWidth * this.pixelRatio
        this.canvasHeight = this.canvas.clientHeight * this.pixelRatio
        this.canvas.width = this.canvasWidth
        this.canvas.height = this.canvasHeight
    }

    get isReady() {
        return this.shader !== 0 && this.helloTexture !== 0
    }

    render() {
        if (!this.isReady) return

        const gl = this.gl
        gl.clearColor(0.0, 0.0, 0.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight)

        gl.useProgram(this.shader)
        gl.bindVertexArray(this.vao)
        gl.bindTexture(gl.TEXTURE_2D, this.helloTexture)

        gl.uniform1i(gl.getUniformLocation(this.shader, 'uTexture'), 0)
        gl.uniform2f(gl.getUniformLocation(this.shader, 'uResolution'), this.canvasWidth, this.canvasHeight)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        gl.bindVertexArray(null)
        gl.bindTexture(gl.TEXTURE_2D, null)

        // Error check
        gll.errorCheck(gl)
    }

    clean() {
        const gl = this.gl
        console.log('Cleaning up resources')
        gl.deleteProgram(this.shader)
        gl.deleteVertexArray(this.vao)
        gl.deleteTexture(this.helloTexture)
    }
}