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

    private particleTexture1: WebGLTexture = 0
    private particleTexture2: WebGLTexture = 0
    private particleFBO1: WebGLFramebuffer = 0
    private particleFBO2: WebGLFramebuffer = 0

    private cooperationTexture: WebGLTexture = 0
    private cooperationImageTexture: WebGLTexture = 0

    // Pulse effect properties
    private gridDimFactor: number = 0
    private pulseSpeed: number = 1.0
    private pulseRadius: number = 1.0
    private isPulseActive: boolean = false
    private pulseDuration: number = this.pulseRadius / this.pulseSpeed
    private pulseCenter: [number, number] = [-1.0, -1.0]

    // Particle-related properties
    private mouseEffectDuration: number = 3000
    private swapCounter: number = 0
    private particleSize: number = 20
    private samplingStep: number = 2
    private repulsionRadius: number = 0.05
    private repulsionForce: number = 0.2
    private friction: number = 0.15
    private returnSpeed: number = 0.008
    private forceCenter: [number, number] = [-1.0, -1.0]

    // Animation control
    private stopTimeout: NodeJS.Timeout | null = null
    private pulseStartTime: number = 0
    private isAnimating: boolean = false
    private animationId: number | null = null
    renderControl: { start: () => void, stop: () => void } | null = null

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas

        // Create a ResizeObserver to watch for canvas size changes
        this.resizeObserver = new ResizeObserver(() => this.handleCanvasResize())
        this.resizeObserver.observe(canvas)

        this.canvas.addEventListener('mousedown', this.handleMouseClick.bind(this))
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))

        this.gl = canvas.getContext('webgl2', {antialias: true, alpha: true}) as WebGL2RenderingContext
        gll.enableAllExtensions(this.gl)

        this.init()
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

        this.setParticleMaterial(false)

        this.isReady = true

        this.pulseStartTime = Date.now()

        this.render()
    }

    get particleUpdateMaterial(): { fbo: WebGLFramebuffer, texture: WebGLTexture } {
        let material: { fbo: WebGLFramebuffer, texture: WebGLTexture }
        this.swapCounter % 2 === 0
        ? material = { fbo: this.particleFBO1, texture: this.particleTexture1 }
        : material = { fbo: this.particleFBO2, texture: this.particleTexture2 }
        this.swapCounter = (this.swapCounter + 1) % 2
        return material
    }

    private fitTexture(sourceTexture: WebGLTexture, targetTexture?: WebGLTexture) {
        const gl = this.gl

        // Create target texture
        if (targetTexture) gl.deleteTexture(targetTexture)
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

    private setParticleMaterial(reset: boolean) {
        const gl = this.gl

        if (reset) {
            gl.deleteTexture(this.particleTexture1)
            gl.deleteTexture(this.particleTexture2)
            gl.deleteFramebuffer(this.particleFBO1)
            gl.deleteFramebuffer(this.particleFBO2)
        }

        // Sample hello texture to init particles
        this.particleTexture1 = gll.createTexture2D(gl, 0, Math.floor(this.canvasWidth / this.samplingStep), Math.floor(this.canvasHeight / this.samplingStep), gl.RGBA32F, gl.RGBA, gl.FLOAT)
        this.particleTexture2 = gll.createTexture2D(gl, 0, Math.floor(this.canvasWidth / this.samplingStep), Math.floor(this.canvasHeight / this.samplingStep), gl.RGBA32F, gl.RGBA, gl.FLOAT)
        const initFBO = gll.createFrameBuffer(gl, [this.particleTexture1])
        gl.bindFramebuffer(gl.FRAMEBUFFER, initFBO)
        gl.viewport(0, 0, Math.floor(this.canvasWidth / this.samplingStep), Math.floor(this.canvasHeight / this.samplingStep))
        gl.clearColor(0, 0, 0, 0)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.useProgram(this.particleInitShader)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this.helloTexture)
        gl.uniform1i(gl.getUniformLocation(this.particleInitShader, 'uTexture'), 0)
        gl.uniform1f(gl.getUniformLocation(this.particleInitShader, 'uSamplingStep'), this.samplingStep)

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.bindTexture(gl.TEXTURE_2D, null)
        gl.useProgram(null)

        gl.deleteFramebuffer(initFBO)

        // Create particle FBOs
        this.particleFBO1 = gll.createFrameBuffer(gl, [this.particleTexture2])
        this.particleFBO2 = gll.createFrameBuffer(gl, [this.particleTexture1])

        this.swapCounter = 0
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
        
        this.startAnimation()
    }

    private handleMouseMove = (event: MouseEvent) => {
        if (!this.isReady) return
        // Convert mouse coordinates to normalized coordinates [0,1]
        const rect = this.canvas.getBoundingClientRect()
        const x = (event.clientX - rect.left) / rect.width
        const y = 1.0 - (event.clientY - rect.top) / rect.height  // flip Y coordinate

        this.forceCenter = [x * 2.0 - 1.0, y * 2.0 - 1.0]

        if (this.renderControl && !this.isAnimating) {
            this.renderControl.start()
            this.isAnimating = true
        }

        this.scheduleStopRendering()
    }

    private scheduleStopRendering() {
        if (this.stopTimeout) clearTimeout(this.stopTimeout)
        
        this.stopTimeout = setTimeout(() => {
            if (this.renderControl) {
                this.renderControl.stop()
                this.isAnimating = false
            }
        }, this.mouseEffectDuration)
    }

    private startAnimation() {
        if (this.isAnimating) return
        
        this.isAnimating = true
        const animate = () => {
            this.render()
            
            // Continue animation only if pulse is active
            if (this.isPulseActive) {
                this.animationId = requestAnimationFrame(animate)
            } else {
                this.stopAnimation()
            }
        }
        this.animationId = requestAnimationFrame(animate)
    }

    private stopAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId)
            this.animationId = null
        }
        this.isAnimating = false
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

        // Reset canvas-related GPU resources
        if (!this.isReady) return

        this.helloTexture = this.fitTexture(this.helloImageTexture, this.helloTexture)
        this.cooperationTexture = this.fitTexture(this.cooperationImageTexture, this.cooperationTexture)

        this.setParticleMaterial(true)

        this.render()
    }

    render() {
        if (!this.isReady) return

        const gl = this.gl
        const eatEasterEgg = (this.gridPixelResolution / Math.pow(2, this.gridDimFactor)) < this.pixelRatio

        // Pass 1: Update particles
        if (!eatEasterEgg) {
            const { fbo, texture } = this.particleUpdateMaterial

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
            gl.uniform4f(gl.getUniformLocation(this.particleUpdateShader, 'uAction'), this.repulsionForce, this.repulsionRadius, this.friction, this.returnSpeed)

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
        }

        // Pass 1: Render grids
        gl.enable(gl.BLEND)
        gl.disable(gl.DEPTH_TEST)
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
            const currentTime = (Date.now() - this.pulseStartTime) / 1000.0
            
            // Check if pulse duration has expired
            if (currentTime >= this.pulseDuration) {
                this.isPulseActive = false
                this.gridDimFactor += 1

            } else {
                gl.uniform1f(gl.getUniformLocation(this.gridShader, 'uTime'), currentTime)
                gl.uniform1f(gl.getUniformLocation(this.gridShader, 'uPulseSpeed'), this.pulseSpeed)
                gl.uniform1f(gl.getUniformLocation(this.gridShader, 'uPulseRadius'), this.pulseRadius)
                gl.uniform2f(gl.getUniformLocation(this.gridShader, 'uPulseCenter'), this.pulseCenter[0], this.pulseCenter[1])
            }
        } else {
            // Set pulse brightness to 0 when inactive
            gl.uniform1f(gl.getUniformLocation(this.gridShader, 'uPulseRadius'), 0.0)
            gl.uniform1i(gl.getUniformLocation(this.gridShader, 'uGridDimFactor'), this.gridDimFactor)
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        // Pass 3: Render particles
        if (!eatEasterEgg) {
            gl.useProgram(this.particleShader)

            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, this.swapCounter % 2 === 0 ? this.particleTexture2 : this.particleTexture1)

            gl.uniform1i(gl.getUniformLocation(this.particleShader, 'uTexture'), 0)
            gl.uniform1f(gl.getUniformLocation(this.particleShader, 'uParticleSize'), this.particleSize)
            gl.uniform2f(gl.getUniformLocation(this.particleShader, 'uResolution'), this.canvasWidth, this.canvasHeight)

            gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, Math.floor(this.canvasWidth / this.samplingStep) * Math.floor(this.canvasHeight / this.samplingStep))
        }

        // Error check
        gll.errorCheck(gl)
    }

    clean() {
        this.stopAnimation()

        this.resizeObserver.unobserve(this.canvas)
        this.canvas.removeEventListener('mousedown', this.handleMouseClick)
        this.canvas.removeEventListener('mousemove', this.handleMouseMove)

        const gl = this.gl
        gl.deleteProgram(this.fitShader)
        gl.deleteProgram(this.gridShader)
        gl.deleteTexture(this.helloTexture)
        gl.deleteTexture(this.helloImageTexture)
        gl.deleteTexture(this.cooperationTexture)
        gl.deleteTexture(this.cooperationImageTexture)
    }
}