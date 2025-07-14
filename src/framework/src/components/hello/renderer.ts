import gll from '@/core/gl/glLib'

const Max_Grid_Num_IN_One_Axis = 50

export default class HelloRenderer {
    // Canvas-related properties
    private canvasWidth: number = 0
    private canvasHeight: number = 0
    private canvas: HTMLCanvasElement
    private resizeObserver: ResizeObserver
    private pixelRatio: number = window.devicePixelRatio || 1

    // Grid-related properties
    private gridPixelResolution: number = 0

    // GPU-related resources
    private isReady: boolean = false
    private gl: WebGL2RenderingContext

    private fitShader: WebGLShader = 0
    private gridShader: WebGLShader = 0
    private particleShader: WebGLShader = 0
    private particleInitShader: WebGLShader = 0
    private particleUpdateShader: WebGLShader = 0

    private helloTexture: WebGLTexture = 0
    private helloImageTexture: WebGLTexture = 0

    private cooperationTexture: WebGLTexture = 0
    private cooperationImageTexture: WebGLTexture = 0

    private particleBackgroundTexture: WebGLTexture = 0

    private particleTexture1: WebGLTexture = 0
    private particleTexture2: WebGLTexture = 0
    private particleUpdateFBO1: WebGLFramebuffer = 0
    private particleUpdateFBO2: WebGLFramebuffer = 0

    // Pulse effect properties
    private pulseStartTime: number = 0
    private gridDimFactor: number = 0
    private pulseRadius: number = 1.0
    private isPulseActive: boolean = false
    private pulseCenter: [number, number] = [-1.0, -1.0]
    private pulseDuration: number = 1000.0 // milliseconds

    // Particle-related properties
    private swapCounter: number = 0
    private samplingStep: number = 8
    private particleSize: number = 10
    private friction: number = 0.15
    private returnSpeed: number = 0.03
    private repulsionForce: number = 50.0
    private repulsionRadius: number = 200.0
    private forceCenter: [number, number] = [-1.0, -1.0]

    // Animation control
    private eatEasterEgg: boolean = false
    private animation: number | null = null
    private mouseEffectDuration: number = 10000
    private stopTimeout: NodeJS.Timeout | null = null
    private renderControl: { start: () => void, stop: () => void }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas

        // Create a ResizeObserver to watch for canvas size changes
        this.resizeObserver = new ResizeObserver(() => this.handleCanvasResize())
        this.resizeObserver.observe(canvas)

        this.canvas.addEventListener('mousedown', this.handleMouseClick.bind(this))
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))

        this.gl = canvas.getContext('webgl2', {antialias: true, alpha: true}) as WebGL2RenderingContext
        gll.enableAllExtensions(this.gl)

        this.renderControl = {
            start: () => {
                if (this.animation !== null) return
                
                const render = () => {
                    if (this.animation) {
                        this.render()
                        this.animation = requestAnimationFrame(render)
                    }
                }
                this.animation = requestAnimationFrame(render)

                // Schedule stop rendering
                if (this.stopTimeout) clearTimeout(this.stopTimeout)
                
                this.stopTimeout = setTimeout(() => {
                    this.renderControl.stop()
                    this.isPulseActive = false
                }, this.mouseEffectDuration)
            },
            stop: () => {
                if (this.animation) {
                    cancelAnimationFrame(this.animation)
                    this.animation = null
                }
            }
        }

        this.init()
    }

    handleCanvasResize() {
        this.pixelRatio = window.devicePixelRatio || 1
        this.canvasWidth = this.canvas.clientWidth * this.pixelRatio
        this.canvasHeight = this.canvas.clientHeight * this.pixelRatio
        this.canvas.width = this.canvasWidth
        this.canvas.height = this.canvasHeight

        // Update grid size based on canvas size
        this.gridPixelResolution = this.canvas.width > this.canvas.height 
                            ? Math.ceil(this.canvas.width / Max_Grid_Num_IN_One_Axis)
                            : Math.ceil(this.canvas.height / Max_Grid_Num_IN_One_Axis)
        
        this.pulseRadius = Math.max(this.canvasWidth, this.canvasHeight)

        // Reset canvas-related GPU resources
        if (!this.isReady) return

        this.renderControl.stop()

        this.helloTexture = this.fitTexture(this.helloImageTexture, this.helloTexture)
        this.cooperationTexture = this.fitTexture(this.cooperationImageTexture, this.cooperationTexture)

        ;(this.gridPixelResolution / Math.pow(2, this.gridDimFactor)) < this.pixelRatio * 3.0
            ? this.particleBackgroundTexture = this.cooperationTexture
            : this.particleBackgroundTexture = this.helloTexture

        this.setParticleMaterial(false)

        // Force render a frame to avoid flickering
        this.render()

        this.renderControl.start()
    }

    async init() {
        this.handleCanvasResize()

        const gl = this.gl
        this.fitShader = await gll.createShader(gl, '/shaders/hello/fit.glsl')
        this.gridShader = await gll.createShader(gl, '/shaders/hello/grid.glsl')
        this.particleShader = await gll.createShader(gl, '/shaders/hello/particle.glsl')
        this.particleInitShader = await gll.createShader(gl, '/shaders/hello/particleInit.glsl')
        this.particleUpdateShader = await gll.createShader(gl, '/shaders/hello/particleUpdate.glsl')

        const helloBitmap = await gll.loadImage('/images/hello/hello.png')
        this.helloImageTexture = gll.createTexture2D(gl, 0, helloBitmap.width, helloBitmap.height, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, helloBitmap)
        this.helloTexture = this.fitTexture(this.helloImageTexture)

        const cooperationBitmap = await gll.loadImage('/images/hello/cooperation.png')
        this.cooperationImageTexture = gll.createTexture2D(gl, 0, cooperationBitmap.width, cooperationBitmap.height, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, cooperationBitmap)
        this.cooperationTexture = this.fitTexture(this.cooperationImageTexture)

        this.particleBackgroundTexture = this.helloTexture

        this.setParticleMaterial(true)

        this.isReady = true

        this.renderControl.start()
    }

    private fitTexture(sourceTexture: WebGLTexture, targetTexture?: WebGLTexture) {
        const gl = this.gl

        // Create target texture
        targetTexture && gl.deleteTexture(targetTexture)
        targetTexture = gll.createTexture2D(gl, 0, this.canvasWidth, this.canvasHeight, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE)

        // Create framebuffer for target texture
        const fbo = gll.createFrameBuffer(gl, [targetTexture])

        // Render texture to framebuffer
        gl.enable(gl.BLEND)
        gl.disable(gl.DEPTH_TEST)

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight)

        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.useProgram(this.fitShader)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture)

        gl.uniform1i(gl.getUniformLocation(this.fitShader, 'uTexture'), 0)
        gl.uniform2f(gl.getUniformLocation(this.fitShader, 'uResolution'), this.canvasWidth, this.canvasHeight)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        // Clean
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.deleteFramebuffer(fbo)
        gl.useProgram(null)

        return targetTexture
    }

    get particleUpdateResources(): { fbo: WebGLFramebuffer, texture: WebGLTexture } {
        let resources: { fbo: WebGLFramebuffer, texture: WebGLTexture }
        this.swapCounter % 2 === 0
        ? resources = { fbo: this.particleUpdateFBO1, texture: this.particleTexture2 }
        : resources = { fbo: this.particleUpdateFBO2, texture: this.particleTexture1 }
        this.swapCounter = (this.swapCounter + 1) % 2
        return resources
    }

    private setParticleMaterial(randomPlace: boolean) {
        const gl = this.gl

        // Clean up previous particle resources
        this.particleTexture1 && gl.deleteTexture(this.particleTexture1)
        this.particleTexture2 && gl.deleteTexture(this.particleTexture2)
        this.particleUpdateFBO1 && gl.deleteFramebuffer(this.particleUpdateFBO1)
        this.particleUpdateFBO2 && gl.deleteFramebuffer(this.particleUpdateFBO2)
        this.swapCounter = 0

        // Create particle resources
        this.particleTexture1 = gll.createTexture2D(gl, 0, Math.floor(this.canvasWidth / this.samplingStep), Math.floor(this.canvasHeight / this.samplingStep), gl.RGBA32F, gl.RGBA, gl.FLOAT)
        this.particleTexture2 = gll.createTexture2D(gl, 0, Math.floor(this.canvasWidth / this.samplingStep), Math.floor(this.canvasHeight / this.samplingStep), gl.RGBA32F, gl.RGBA, gl.FLOAT)
        this.particleUpdateFBO1 = gll.createFrameBuffer(gl, [this.particleTexture1])
        this.particleUpdateFBO2 = gll.createFrameBuffer(gl, [this.particleTexture2])

        // Sample texture to init particles
        const initFBO = gll.createFrameBuffer(gl, [this.particleTexture1, this.particleTexture2])
        gl.bindFramebuffer(gl.FRAMEBUFFER, initFBO)
        gl.viewport(0, 0, Math.floor(this.canvasWidth / this.samplingStep), Math.floor(this.canvasHeight / this.samplingStep))
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.disable(gl.BLEND)
        gl.disable(gl.DEPTH_TEST)
        
        gl.useProgram(this.particleInitShader)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.particleBackgroundTexture)
        gl.uniform1i(gl.getUniformLocation(this.particleInitShader, 'uTexture'), 0)
        gl.uniform1f(gl.getUniformLocation(this.particleInitShader, 'uRandomSeed'), Math.random())
        gl.uniform1i(gl.getUniformLocation(this.particleInitShader, 'uIsRandom'), randomPlace ? 1 : 0)
        gl.uniform1f(gl.getUniformLocation(this.particleInitShader, 'uSamplingStep'), this.samplingStep)
        gl.uniform2f(gl.getUniformLocation(this.particleInitShader, 'uResolution'), this.canvasWidth, this.canvasHeight)

        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1])
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.drawBuffers([gl.BACK])
        gl.useProgram(null)

        gl.deleteFramebuffer(initFBO)
    }

    private handleMouseClick = (event: MouseEvent) => {
        if (this.isPulseActive) return

        // Convert mouse coordinates to normalized coordinates [0,1]
        const rect = this.canvas.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width
        const y = 1.0 - (event.clientY - rect.top) / rect.height  // flip Y coordinate
        
        // Set pulse center to click position
        this.pulseCenter = [x, y]
        
        this.pulseStartTime = Date.now()
        this.isPulseActive = true

        this.renderControl.start()
    }

    private handleMouseMove = (event: MouseEvent) => {
        if (!this.isReady) return
        const rect = this.canvas.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width
        const y = 1.0 - (event.clientY - rect.top) / rect.height  // flip Y coordinate

        this.forceCenter = [x, y]

        this.renderControl.start()
    }

    render() {
        if (!this.isReady) return

        const gl = this.gl
        if (!this.eatEasterEgg) {
            this.eatEasterEgg = (this.gridPixelResolution / Math.pow(2, this.gridDimFactor)) < this.pixelRatio * 3.0
            if (this.eatEasterEgg) {
                this.particleBackgroundTexture = this.cooperationTexture
                this.particleSize /= 2.0
                this.samplingStep /= 2.0
                this.setParticleMaterial(true)
            }
        }

        // Pass 1: Render grids
        if (!this.eatEasterEgg) {
            gl.enable(gl.BLEND)
            gl.disable(gl.DEPTH_TEST)
            gl.blendEquation(gl.FUNC_ADD)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.viewport(0, 0, this.canvasWidth, this.canvasHeight)

            gl.clearColor(41.0 / 255.0, 44.0 / 255.0, 51.0 / 255.0, 1.0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            gl.useProgram(this.gridShader)
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, this.helloTexture)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, this.cooperationTexture)

            gl.uniform1i(gl.getUniformLocation(this.gridShader, 'uHello'), 0)
            gl.uniform1i(gl.getUniformLocation(this.gridShader, 'uCooperation'), 1)
            gl.uniform1i(gl.getUniformLocation(this.gridShader, 'uGridDimFactor'), this.gridDimFactor)
            gl.uniform1i(gl.getUniformLocation(this.gridShader, 'uGridResolution'), this.gridPixelResolution)
            gl.uniform2f(gl.getUniformLocation(this.gridShader, 'uResolution'), this.canvasWidth, this.canvasHeight)
            
            // Only apply pulse uniforms if pulse is active
            if (this.isPulseActive) {
                // Check if pulse duration has expired
                const currentTime = Date.now() - this.pulseStartTime
                if (currentTime >= this.pulseDuration) {
                    this.isPulseActive = false
                    this.gridDimFactor += 1

                } else {
                    gl.uniform1f(gl.getUniformLocation(this.gridShader, 'uTime'), currentTime / this.pulseDuration)
                    gl.uniform1f(gl.getUniformLocation(this.gridShader, 'uPulseRadius'), this.pulseRadius)
                    gl.uniform2f(gl.getUniformLocation(this.gridShader, 'uPulseCenter'), this.pulseCenter[0], this.pulseCenter[1])
                }
            } else {
                // Set pulse brightness to 0 when inactive
                gl.uniform1f(gl.getUniformLocation(this.gridShader, 'uPulseRadius'), 0.0)
                gl.uniform1i(gl.getUniformLocation(this.gridShader, 'uGridDimFactor'), this.gridDimFactor)
            }

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        }

        // Pass 2: Update particles
        const { fbo, texture } = this.particleUpdateResources

        gl.disable(gl.BLEND)
        gl.disable(gl.DEPTH_TEST)

        gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
        gl.viewport(0, 0, Math.floor(this.canvasWidth / this.samplingStep), Math.floor(this.canvasHeight / this.samplingStep))
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)

        gl.useProgram(this.particleUpdateShader)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)

        gl.uniform1i(gl.getUniformLocation(this.particleUpdateShader, 'uTexture'), 0)
        gl.uniform2f(gl.getUniformLocation(this.particleUpdateShader, 'uForce'), this.forceCenter[0], this.forceCenter[1])
        gl.uniform2f(gl.getUniformLocation(this.particleUpdateShader, 'uResolution'), this.canvasWidth, this.canvasHeight)
        gl.uniform4f(gl.getUniformLocation(this.particleUpdateShader, 'uAction'), this.repulsionForce, this.repulsionRadius, this.friction, this.returnSpeed)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        // Pass 3: Render particles
        gl.enable(gl.BLEND)
        gl.disable(gl.DEPTH_TEST)
        gl.blendEquation(gl.FUNC_ADD)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, this.canvasWidth, this.canvasHeight)

        gl.useProgram(this.particleShader)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.swapCounter % 2 === 0 ? this.particleTexture2 : this.particleTexture1)

        gl.uniform1i(gl.getUniformLocation(this.particleShader, 'uTexture'), 0)
        gl.uniform1f(gl.getUniformLocation(this.particleShader, 'uParticleSize'), this.particleSize)
        gl.uniform2f(gl.getUniformLocation(this.particleShader, 'uResolution'), this.canvasWidth, this.canvasHeight)

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, Math.floor(this.canvasWidth / this.samplingStep) * Math.floor(this.canvasHeight / this.samplingStep))

        // Error check
        gll.errorCheck(gl)
    }

    clean() {
        this.isReady = false
        if (this.stopTimeout) clearTimeout(this.stopTimeout)

        this.particleBackgroundTexture = 0
        this.resizeObserver.unobserve(this.canvas)
        this.canvas.removeEventListener('mousedown', this.handleMouseClick)
        this.canvas.removeEventListener('mousemove', this.handleMouseMove)

        const gl = this.gl
        gl.deleteProgram(this.fitShader)
        gl.deleteProgram(this.gridShader)
        gl.deleteProgram(this.particleShader)
        gl.deleteProgram(this.particleInitShader)
        gl.deleteProgram(this.particleUpdateShader)
        
        gl.deleteTexture(this.helloTexture)
        gl.deleteTexture(this.helloImageTexture)

        gl.deleteTexture(this.cooperationTexture)
        gl.deleteTexture(this.cooperationImageTexture)

        gl.deleteTexture(this.particleTexture1)
        gl.deleteTexture(this.particleTexture2)
        gl.deleteFramebuffer(this.particleUpdateFBO1)
        gl.deleteFramebuffer(this.particleUpdateFBO2)
    }
}