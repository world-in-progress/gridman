import { Map } from 'mapbox-gl'
import { mat4 } from 'gl-matrix'

import '@/App.css'
import store from '@/store'
import GridCore from '@/core/grid/NHGridCore'
import VibrantColorGenerator from '@/core/util/vibrantColorGenerator'
import { GridCheckingInfo, MultiGridBaseInfo } from '@/core/grid/types'

import gll from '@/core/gl/glLib'
import HitBuffer from './hitBuffer'
import CustomLayerGroup from './customLayerGroup'
import { NHCustomLayerInterface } from './interfaces'

let CHECK_ON_EVENT: Function
let CHECK_OFF_EVENT: Function

const LEVEL_PALETTE_LENGTH = 256 // Grid level range is 0 - 255 (UInt8)
const DEFAULT_MAX_GRID_NUM = 4096 * 4096 // 16M grids, a size that most GPUs can handle

export default class TopologyLayer implements NHCustomLayerInterface {
    // Layer-related ///////////////////////////////////////////////////////

    visible = true
    id = 'TopologyLayer'
    type = 'custom' as const
    layerGroup!: CustomLayerGroup

    // Grid-related /////////////////////////////////////////////////////////

    private _gridCore: GridCore | null = null

    // Interaction-related //////////////////////////////////////////////////

    hitFlag = new Uint8Array([1])   // 0 is a special value and means no selection
    unhitFlag = new Uint8Array([0])
    deletedFlag = new Uint8Array([1])
    undeletedFlag = new Uint8Array([0])
    hitBuffer = new HitBuffer(DEFAULT_MAX_GRID_NUM)

    isTransparent = false
    lastPickedId: number = -1

    _startCallback: Function = () => {}
    _endCallback: Function = () => {}

    // Box picking context
    private _ctx: CanvasRenderingContext2D | null = null
    private _overlayCanvas: HTMLCanvasElement | null = null;
    private _overlayCtx: CanvasRenderingContext2D | null = null;

    resizeHandler: Function

    // GPU-related ///////////////////////////////////////////////////////

    initialized = false
    paletteColorList: Uint8Array

    private _gl: WebGL2RenderingContext

    // Screen properties
    private _screenWidth: number = 0
    private _screenHeight: number = 0

    // Shader
    private _pickingShader: WebGLProgram = 0
    private _gridMeshShader: WebGLProgram = 0
    private _gridLineShader: WebGLProgram = 0

    // Texture resource
    private _paletteTexture: WebGLTexture = 0

    // Buffer resource
    private _gridSignalBuffer: WebGLBuffer = 0  // [ [isHit], [isDeleted] ]
    private _gridTlStorageBuffer: WebGLBuffer = 0
    private _gridTrStorageBuffer: WebGLBuffer = 0
    private _gridBlStorageBuffer: WebGLBuffer = 0
    private _gridBrStorageBuffer: WebGLBuffer = 0
    private _gridTlLowStorageBuffer: WebGLBuffer = 0
    private _gridTrLowStorageBuffer: WebGLBuffer = 0
    private _gridBlLowStorageBuffer: WebGLBuffer = 0
    private _gridBrLowStorageBuffer: WebGLBuffer = 0
    private _gridLevelStorageBuffer: WebGLBuffer = 0
    private _gridStorageVAO: WebGLVertexArrayObject = 0

    // Brush picking pass resource
    private _pickingFBO: WebGLFramebuffer = 0
    private _pickingTexture: WebGLTexture = 0
    private _pickingRBO: WebGLRenderbuffer = 0

    // Box picking pass resource
    private _boxPickingFBO: WebGLFramebuffer = 0
    private _boxPickingTexture: WebGLTexture = 0
    private _boxPickingRBO: WebGLRenderbuffer = 0

    constructor(public map: Map) {
        // Set WebGL2 context
        this._gl = this.map.painter.context.gl

        // Make palette color list
        const colorGenerator = new VibrantColorGenerator()
        this.paletteColorList = new Uint8Array(LEVEL_PALETTE_LENGTH * 3)
        for (let i = 0; i < LEVEL_PALETTE_LENGTH; i++) {
            const color = colorGenerator.nextColor().map(channel => channel * 255.0)
            this.paletteColorList.set(color, i * 3)
        }

        // Bind callbacks and event handlers
        this.resizeHandler = this._resizeHandler.bind(this)

        // Create overlay canvas
        this._overlayCanvas = document.createElement('canvas');
        this._overlayCtx = this._overlayCanvas.getContext('2d');
        this._overlayCanvas.style.top = '0'
        this._overlayCanvas.style.left = '0'
        this._overlayCanvas.style.zIndex = '1'
        this._overlayCanvas.style.position = 'absolute'
        this._overlayCanvas.style.pointerEvents = 'none'

        const mapContainer = this.map.getContainer()
        mapContainer.appendChild(this._overlayCanvas)

        this._resizeOverlayCanvas()
        const resizeObserver = new ResizeObserver(() => this._resizeOverlayCanvas())
        resizeObserver.observe(mapContainer)

        // Bind event handlers for checking switch
        CHECK_ON_EVENT = (() => this.executeClearSelection()).bind(this)
        CHECK_OFF_EVENT = (() => this.executeClearSelection()).bind(this)
    }

    get maxGridNum(): number {
        return this._gridCore?.maxGridNum || DEFAULT_MAX_GRID_NUM
    }

    set gridCore(core: GridCore) {
        const currentMaxGridNum = this.maxGridNum
        this._gridCore = core // after setting, this.maxGridNum will be updated
        this.startCallback()

        // Update GPU resources if maxGridNum changed
        if (currentMaxGridNum !== this.maxGridNum) {
            this.hitBuffer = new HitBuffer(this.maxGridNum)

            this.initialized = false
            this._removeGPUResource(this._gl)
            this.initGPUResource().then(() => {
                core.init((renderInfo: [number, Uint8Array, Float32Array, Float32Array, Uint8Array]) => {
                    this.updateGPUGrids(renderInfo)
                    this.initialized = true
                    this.endCallback()
                })
            })
        } else {
            core.init((renderInfo: [number, Uint8Array, Float32Array, Float32Array, Uint8Array]) => {
                this.updateGPUGrids(renderInfo)
                this.initialized = true
                this.endCallback()
            })
        }
    }

    get gridCore(): GridCore {
        if (!this._gridCore) {
            const err = new Error('GridCore is not initialized')
            console.error(err)
            throw err
        }
        return this._gridCore
    }

    get isReady() {
        // Check if the grid core is initialized
        if (!this._gridCore || !this._gridCore.gridNum) return false
        // Check if GPU resources are initialized
        if (!this.initialized) return false
        return true
    }

    set startCallback(func: Function) {
       this._startCallback = () => {
            func()
            this.map.triggerRepaint()
       }
    }

    get startCallback(): Function {
        return this._startCallback
    }

    set endCallback(func: Function) {
        this._endCallback = () => {
            func()
            this.map.triggerRepaint()
        }
    }

    get endCallback(): Function {
        return this._endCallback
    }

    // Initialization //////////////////////////////////////////////////

    async initialize(_: Map, gl: WebGL2RenderingContext) {
        console.log('Initializing TopologyLayer...')
        this._gl = gl
        this.initDOM()
        await this.initGPUResource()
    }

    initDOM() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'A') {
                this.executePickAllGrids()
            }
        })

        // Box Picking Canvas
        let canvas2d = document.querySelector('#canvas2d') as HTMLCanvasElement
        if (!canvas2d) {
            // If canvas2d element not found, create one
            canvas2d = document.createElement('canvas')
            canvas2d.id = 'canvas2d'
            canvas2d.style.position = 'absolute'
            canvas2d.style.top = '0'
            canvas2d.style.left = '0'
            canvas2d.style.pointerEvents = 'none'
            canvas2d.style.zIndex = '1000'
            document.body.appendChild(canvas2d)
        }
        const rect = canvas2d.getBoundingClientRect()
        canvas2d.width = rect.width
        canvas2d.height = rect.height
        this._ctx = canvas2d.getContext('2d')

    }

    async initGPUResource() {
        const gl = this._gl

        gll.enableAllExtensions(gl)

        // Create shader
        this._pickingShader = await gll.createShader(gl, '/shaders/patch/picking.glsl')
        this._gridLineShader = await gll.createShader(gl, '/shaders/patch/gridLine.glsl')
        this._gridMeshShader = await gll.createShader(gl, '/shaders/patch/gridMesh.glsl')

        // Set static uniform in shaders
        gl.useProgram(this._gridMeshShader)
        gl.uniform1i(gl.getUniformLocation(this._gridMeshShader, 'paletteTexture'), 0)
        gl.useProgram(null)

        // Create grid storage buffer
        this._gridStorageVAO = gl.createVertexArray()!
        this._gridSignalBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 1, gl.DYNAMIC_DRAW)!

        this._gridTlStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridTrStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridBlStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridBrStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridTlLowStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridTrLowStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridBlLowStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridBrLowStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridLevelStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 1 * 1, gl.DYNAMIC_DRAW)!

        gl.bindVertexArray(this._gridStorageVAO)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTlStorageBuffer)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2 * 4, 0)
        gl.enableVertexAttribArray(0)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTrStorageBuffer)
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 2 * 4, 0)
        gl.enableVertexAttribArray(1)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBlStorageBuffer)
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 2 * 4, 0)
        gl.enableVertexAttribArray(2)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBrStorageBuffer)
        gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 2 * 4, 0)
        gl.enableVertexAttribArray(3)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTlLowStorageBuffer)
        gl.vertexAttribPointer(4, 2, gl.FLOAT, false, 2 * 4, 0)
        gl.enableVertexAttribArray(4)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTrLowStorageBuffer)
        gl.vertexAttribPointer(5, 2, gl.FLOAT, false, 2 * 4, 0)
        gl.enableVertexAttribArray(5)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBlLowStorageBuffer)
        gl.vertexAttribPointer(6, 2, gl.FLOAT, false, 2 * 4, 0)
        gl.enableVertexAttribArray(6)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBrLowStorageBuffer)
        gl.vertexAttribPointer(7, 2, gl.FLOAT, false, 2 * 4, 0)
        gl.enableVertexAttribArray(7)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridLevelStorageBuffer)
        gl.vertexAttribIPointer(8, 1, gl.UNSIGNED_BYTE, 1 * 1, 0)
        gl.enableVertexAttribArray(8)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum, new Uint8Array(this.maxGridNum).fill(this.undeletedFlag[0])) // set all grids to be undeleted
        gl.vertexAttribIPointer(9, 1, gl.UNSIGNED_BYTE, 1 * 1, 0)
        gl.enableVertexAttribArray(9)
        gl.vertexAttribIPointer(10, 1, gl.UNSIGNED_BYTE, 1 * 1, this.maxGridNum)
        gl.enableVertexAttribArray(10)

        gl.vertexAttribDivisor(0, 1)
        gl.vertexAttribDivisor(1, 1)
        gl.vertexAttribDivisor(2, 1)
        gl.vertexAttribDivisor(3, 1)
        gl.vertexAttribDivisor(4, 1)
        gl.vertexAttribDivisor(5, 1)
        gl.vertexAttribDivisor(6, 1)
        gl.vertexAttribDivisor(7, 1)
        gl.vertexAttribDivisor(8, 1)
        gl.vertexAttribDivisor(9, 1)
        gl.vertexAttribDivisor(10, 1)

        gl.bindVertexArray(null)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        // Create texture
        this._paletteTexture = gll.createTexture2D(gl, 0, LEVEL_PALETTE_LENGTH, 1, gl.RGB8, gl.RGB, gl.UNSIGNED_BYTE)

        // Create picking pass
        this._pickingTexture = gll.createTexture2D(gl, 0, 1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
        this._pickingRBO = gll.createRenderBuffer(gl, 1, 1)
        this._pickingFBO = gll.createFrameBuffer(gl, [this._pickingTexture], 0, this._pickingRBO)!
        this._resizeScreenFBO()

        // Init palette texture
        gll.fillSubTexture2DByArray(gl, this._paletteTexture, 0, 0, 0, LEVEL_PALETTE_LENGTH, 1, gl.RGB, gl.UNSIGNED_BYTE, this.paletteColorList)
    }

    // Picking //////////////////////////////////////////////////

    private _calcPickingMatrix(pos: [number, number]) {
        const canvas = this._gl.canvas as HTMLCanvasElement

        const offsetX = pos[0]
        const offsetY = pos[1]

        const computedStyle = window.getComputedStyle(canvas)
        const canvasWidth = +computedStyle.width.split('px')[0]
        const canvasHeight = +computedStyle.height.split('px')[0]

        const ndcX = offsetX / canvasWidth * 2.0 - 1.0
        const ndcY = 1.0 - offsetY / canvasHeight * 2.0

        const pickingMatrix = mat4.create()
        mat4.scale(pickingMatrix, pickingMatrix, [canvasWidth * 0.5, canvasHeight * 0.5, 1.0])
        mat4.translate(pickingMatrix, pickingMatrix, [-ndcX, -ndcY, 0.0])

        return pickingMatrix
    }

    /**
     * @param pickingMatrix 
     * @returns { number } StorageId of the picked grid
     */
    private _brushPicking(pickingMatrix: mat4): number {
        const gl = this._gl

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._pickingFBO)
        gl.viewport(0, 0, 1, 1)

        gl.clearColor(1.0, 1.0, 1.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.disable(gl.BLEND)

        gl.depthFunc(gl.LESS)
        gl.enable(gl.DEPTH_TEST)

        gl.useProgram(this._pickingShader)

        gl.bindVertexArray(this._gridStorageVAO)
        gl.uniform2fv(gl.getUniformLocation(this._pickingShader, 'centerHigh'), [this.layerGroup.mercatorCenterX[0], this.layerGroup.mercatorCenterY[0]]);
        gl.uniform2fv(gl.getUniformLocation(this._pickingShader, 'centerLow'), [this.layerGroup.mercatorCenterX[1], this.layerGroup.mercatorCenterY[1]]);
        gl.uniformMatrix4fv(gl.getUniformLocation(this._pickingShader, 'pickingMatrix'), false, pickingMatrix)
        gl.uniform4fv(gl.getUniformLocation(this._pickingShader, 'relativeCenter'), this.gridCore.renderRelativeCenter)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._pickingShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.gridCore.gridNum)

        gl.flush()

        const pixel = new Uint8Array(4)
        gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        // Return storageId of the picked grid
        return pixel[0] + (pixel[1] << 8) + (pixel[2] << 16) + (pixel[3] << 24)
    }

    private _boxPicking(pickingBox: number[]) {
        const gl = this._gl
        const canvas = gl.canvas as HTMLCanvasElement
        const computedStyle = window.getComputedStyle(canvas)
        const canvasWidth = +computedStyle.width.split('px')[0]
        const canvasHeight = +computedStyle.height.split('px')[0]

        this._resizeScreenFBO()
        const minx = Math.min(pickingBox[0], pickingBox[2])
        const miny = Math.max(pickingBox[1], pickingBox[3])
        const maxx = Math.max(pickingBox[0], pickingBox[2])
        const maxy = Math.min(pickingBox[1], pickingBox[3])

        const [startX, startY, endX, endY] = [minx, miny, maxx, maxy]

        const pixelX = (startX)
        const pixelY = (canvasHeight - startY - 1)
        const pixelEndX = (endX)
        const pixelEndY = (canvasHeight - endY - 1)
        const width = Math.floor(pixelEndX - pixelX)
        const height = Math.floor(pixelEndY - pixelY)

        const boxPickingMatrix = mat4.create()

        this._boxPickingTexture = gll.createTexture2D(gl, 0, gl.canvas.width, gl.canvas.height, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(gl.canvas.width * gl.canvas.height * 4).fill(0))
        gl.bindFramebuffer(gl.FRAMEBUFFER, this._boxPickingFBO)
        gl.viewport(0, 0, canvasWidth, canvasHeight)

        gl.clearColor(1.0, 1.0, 1.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.disable(gl.BLEND)

        gl.depthFunc(gl.LESS)
        gl.enable(gl.DEPTH_TEST)

        gl.useProgram(this._pickingShader)

        gl.bindVertexArray(this._gridStorageVAO)

        gl.uniform2fv(gl.getUniformLocation(this._pickingShader, 'centerHigh'), [this.layerGroup.mercatorCenterX[0], this.layerGroup.mercatorCenterY[0]]);
        gl.uniform2fv(gl.getUniformLocation(this._pickingShader, 'centerLow'), [this.layerGroup.mercatorCenterX[1], this.layerGroup.mercatorCenterY[1]]);
        gl.uniformMatrix4fv(gl.getUniformLocation(this._pickingShader, 'pickingMatrix'), false, boxPickingMatrix)
        gl.uniform4fv(gl.getUniformLocation(this._pickingShader, 'relativeCenter'), this.gridCore.renderRelativeCenter)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._pickingShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.gridCore.gridNum)

        gl.flush()

        const pixel = new Uint8Array(4 * width * height)
        gl.readPixels(pixelX, pixelY, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixel)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        const set = new Set<number>()
        for (let i = 0; i < height; i += 1) {
            for (let j = 0; j < width; j += 1) {

                const pixleId = 4 * (i * width + j)
                const storageId = pixel[pixleId] + (pixel[pixleId + 1] << 8) + (pixel[pixleId + 2] << 16) + (pixel[pixleId + 3] << 24)
                if (storageId < 0 || set.has(storageId)) continue

                set.add(storageId)
            }
        }
        return Array.from(set)
    }

    /**
     * @description: Update hit set and make grids in hitset highlight (hit) or unhighlight (unhit)
     */
    private _hit(storageIds: number | number[], addMode = true) {
        const gl = this._gl
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)

        const ids = Array.isArray(storageIds) ? storageIds : [storageIds]
        if (addMode) {
            // Highlight all grids
            if (ids.length === this.gridCore.gridNum) {

                this.hitBuffer.all = ids
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Uint8Array(this.maxGridNum).fill(this.hitFlag[0]))

            } else {
                ids.forEach(storageId => {
                    if (storageId < 0) return
                    this.hitBuffer.add(storageId)
                    gl.bufferSubData(gl.ARRAY_BUFFER, storageId, this.hitFlag, 0)
                })
            }
        } else {
            // Unhighlight all grids
            ids.forEach(storageId => {
                if (storageId < 0) return
                
                if (this.hitBuffer.isHit(storageId)) {
                    this.hitBuffer.remove(storageId)
                    gl.bufferSubData(gl.ARRAY_BUFFER, storageId, this.unhitFlag, 0)
                }
            })
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null)
        this.map.triggerRepaint()
    }

    private _updateHitFlag() {
        // Reset hitBuffer (Max number of hit flag is 255)
        if (this.hitFlag[0] === 255) {
            const gl = this._gl
            gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Uint8Array(this.maxGridNum).fill(0))
            gl.bindBuffer(gl.ARRAY_BUFFER, null)
            this.hitFlag[0] = 0
        }

        this.hitFlag[0] = this.hitFlag[0] + 1
    }

    /**
     * type: 0 - box, 1 - brush, 2 - feature
     * mode: true - add, false - remove
     */
    executePickGrids(type: string, mode: boolean, startPos: [number, number], endPos?: [number, number]) {
        this.startCallback()
        let storageIds
        if (type === 'box') {
            const box = genPickingBox(startPos, endPos!)
            storageIds = this._boxPicking(box)
        } else if (type === 'brush') {
            storageIds = this._brushPicking(this._calcPickingMatrix(startPos))
        } else if (type === 'feature') {
            // Implement feature picking logic through interface: executePickGridsByFeature
        } else {
            this.endCallback()
            return
        }
        this._hit(storageIds!, mode)
        this.endCallback()
    }

    executeCheckGrid(startPos: [number, number]): GridCheckingInfo | null {
        // Clear hit set
        this.executeClearSelection()

        // Get checkable grid
        const storageId = this._brushPicking(this._calcPickingMatrix(startPos))
        if (storageId < 0) return null

        // Highlight grid
        this._hit(storageId)
        this.map.triggerRepaint()

        // Check information
        return this.gridCore.checkGrid(storageId)
    }

    executePickGridsByFeature(path: string) {
        this.startCallback()
        this.gridCore.getGridInfoByFeature(path, (storageIds: number[]) => {
            this._hit(storageIds)
            this.endCallback()
            store.get<{ on: Function; off: Function }>('isLoading')!.off();
        })
    }

    executePickAllGrids() {
        this.startCallback()
        const storageIds = new Array<number>()
        for (let i = 0; i < this.gridCore.gridNum; i++) {
            storageIds.push(i)
        }
        this._hit(storageIds)
        this.endCallback()
    }

    /**
     * @description: Clear the current selection and return storageIds of picked grids
     */
    executeClearSelection(): number[] {
        const pickedStorageIds = this.hitBuffer.clear()
        this._updateHitFlag()
        this.map.triggerRepaint()

        return pickedStorageIds
    }

    // Delete grids  //////////////////////////////////////////////////

    deleteGridsLocally(storageIds: number[]) {
        if (storageIds.length === 0) return
        this.startCallback()

        if (storageIds.length === 1) {
            // Fast delete for single grid
            this.gridCore.deleteGridLocally(storageIds[0], (info: [sourceStorageId: number, targetStorageId: number]) => {
                this.copyGPUGrid(info[0], info[1])
                this.endCallback()
            })
        } else {
            this.gridCore.deleteGridsLocally(storageIds, (infos: [sourceStorageIds: number[], targetStorageIds: number[]]) => {
                for (let i = 0; i < infos[0].length; i++) {
                    this.copyGPUGrid(infos[0][i], infos[1][i])
                }
                this.endCallback()
            })
        }

    }

    deleteGrids(storageIds: number[]) {
        if (storageIds.length === 0) return
        this.startCallback()

        const gl = this._gl

        // Set grids deleted
        this.gridCore.markGridsAsDeleted(storageIds, () => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
            storageIds.forEach(storageId => {
                gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum + storageId, this.deletedFlag, 0)
            })
            gl.bindBuffer(gl.ARRAY_BUFFER, null)
            this._hit(storageIds)
            this.endCallback()
        })
    }

    recoverGrids(storageIds: number[]) {
        if (storageIds.length === 0) return
        this.startCallback()

        const gl = this._gl

        // Set grids undeleted
        this.gridCore.recoverGrids(storageIds, () => {
            gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
            storageIds.forEach(storageId => {
                gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum + storageId, this.undeletedFlag, 0)
            })
            gl.bindBuffer(gl.ARRAY_BUFFER, null)
            this._hit(storageIds)
            this.endCallback()
        })
    }

    executeDeleteGrids() {
        const removableStorageIds = this.executeClearSelection()
            .filter(removableStorageId => !this._gridCore!.isGridDeleted(removableStorageId))
        this.deleteGrids(removableStorageIds)
    }

    executeRecoverGrids() {
        const recoverableStorageIds = this.executeClearSelection()
            .filter(recoverableStorageId => this._gridCore!.isGridDeleted(recoverableStorageId))
        this.recoverGrids(recoverableStorageIds)
    }

    // Subdivide grids  //////////////////////////////////////////////////

    private _subdivideGrids(subdivideInfos: {levels: Uint8Array, globalIds: Uint32Array}) {
        if (subdivideInfos.levels.length === 0) return
        this.startCallback()

        this.gridCore.subdivideGrids(subdivideInfos, (renderInfos: any) => {
            this.updateGPUGrids(renderInfos)
            const [fromStorageId, levels] = renderInfos
            const storageIds = Array.from(
                { length: levels.length },
                (_, i) => fromStorageId + i
            )
            this._hit(storageIds)
            this.endCallback()
        })
    }

    private _mergeGrids(mergeableStorageIds: number[]) {
        if (mergeableStorageIds.length === 0) return
        this.startCallback()

        // Merge grids
        this.gridCore.mergeGrids(mergeableStorageIds, (info: { childStorageIds: number[], parentInfo: MultiGridBaseInfo }) => {
            // If no parent grid is provided, just hit the mergable grids and do nothing
            if (info.parentInfo.levels.length === 0) {
                this._hit(mergeableStorageIds)
                this.endCallback()
            }
            // Delete child grids
            this.gridCore.deleteGridsLocally(info.childStorageIds, (infos: [sourceStorageIds: number[], targetStorageIds: number[]]) => {
                for (let i = 0; i < infos[0].length; i++) {
                    this.copyGPUGrid(infos[0][i], infos[1][i])
                }

                const fromStorageId = this.gridCore.gridNum
                // Update parent grid in grid core and GPU resources
                this.gridCore.updateMultiGridRenderInfo(info.parentInfo, (renderInfo: any) => {
                    this.updateGPUGrids(renderInfo)
                
                    // Pick all merged grids
                    const storageIds = Array.from(
                        { length: info.parentInfo.levels.length },
                        (_, i) => fromStorageId + i
                    )
                    this._hit(storageIds)
                    this.endCallback()
                })
            })
        })
    }

    executeSubdivideGrids() {
        const subdivideLevels: number[] = []
        const subdivideGlobalIds: number[] = []
        const subdividableStorageIds = this.executeClearSelection()
            .filter(removableStorageId => {
                const level = this.gridCore.getGridInfoByStorageId(removableStorageId)[0]
                const isValid = (level !== this.gridCore.maxLevel) && (!this._gridCore!.isGridDeleted(removableStorageId))
                if (isValid) {
                    subdivideLevels.push(level)
                    const globalId = this.gridCore.getGridInfoByStorageId(removableStorageId)[1]
                    subdivideGlobalIds.push(globalId)
                }
                return isValid
            })
        const subdivideInfo = {
            levels: new Uint8Array(subdivideLevels),
            globalIds: new Uint32Array(subdivideGlobalIds)
        }
        this.deleteGridsLocally(subdividableStorageIds)
        this._subdivideGrids(subdivideInfo)
    }

    executeMergeGrids() {
        const mergeableStorageIds = this.executeClearSelection()
            .filter(mergeableStorageId => !this._gridCore!.isGridDeleted(mergeableStorageId))
        this._mergeGrids(mergeableStorageIds)
    }

    // Rendering ///////////////////////////////////////////////////

    render(gl: WebGL2RenderingContext, matrix: number[]) {

        // Skip if not ready or not visible
        if (!this.isReady || !this.visible) return

        // Tick render
        if (!this.isTransparent) {
            // Mesh Pass
            this.drawGridMeshes()
            // Line Pass
            this.drawGridLines()
        }

        // Error check
        gll.errorCheck(gl)
    }

    drawGridMeshes() {
        const gl = this._gl

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.LESS)

        gl.useProgram(this._gridMeshShader)

        gl.bindVertexArray(this._gridStorageVAO)

        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, this._paletteTexture)
        gl.uniform1i(gl.getUniformLocation(this._gridMeshShader, 'hit'), this.hitFlag[0])
        gl.uniform2fv(gl.getUniformLocation(this._gridMeshShader, 'centerHigh'), [this.layerGroup.mercatorCenterX[0], this.layerGroup.mercatorCenterY[0]]);
        gl.uniform2fv(gl.getUniformLocation(this._gridMeshShader, 'centerLow'), [this.layerGroup.mercatorCenterX[1], this.layerGroup.mercatorCenterY[1]]);
        gl.uniform1f(gl.getUniformLocation(this._gridMeshShader, 'mode'), 0.0)
        gl.uniform4fv(gl.getUniformLocation(this._gridMeshShader, 'relativeCenter'), this.gridCore.renderRelativeCenter)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._gridMeshShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.gridCore.gridNum)

        gl.disable(gl.BLEND)
    }

    drawGridLines() {
        const gl = this._gl

        gl.disable(gl.DEPTH_TEST)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

        gl.useProgram(this._gridLineShader)

        gl.bindVertexArray(this._gridStorageVAO)

        gl.uniform2fv(gl.getUniformLocation(this._gridLineShader, 'centerHigh'), [this.layerGroup.mercatorCenterX[0], this.layerGroup.mercatorCenterY[0]]);
        gl.uniform2fv(gl.getUniformLocation(this._gridLineShader, 'centerLow'), [this.layerGroup.mercatorCenterX[1], this.layerGroup.mercatorCenterY[1]]);
        gl.uniformMatrix4fv(gl.getUniformLocation(this._gridLineShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)
        gl.uniform4fv(gl.getUniformLocation(this._gridLineShader, 'relativeCenter'), this.gridCore.renderRelativeCenter)

        gl.drawArraysInstanced(gl.LINE_LOOP, 0, 4, this.gridCore.gridNum)

        gl.disable(gl.BLEND)
    }

    // GPU update //////////////////////////////////////////////////
    
    // Fast function to upload one grid rendering info to GPU stograge buffer
    private _writeGridInfoToStorageBuffer(info: [storageId: number, level: number, vertices: Float32Array, verticesLow: Float32Array, deleted: number]) {
        const gl = this._gl
        const levelByteStride = 1 * 1
        const vertexByteStride = 2 * 4
        const [storageId, level, vertices, verticesLow, deleted] = info

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTlStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, vertices, 0, 2)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTrStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, vertices, 2, 2)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBlStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, vertices, 4, 2)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBrStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, vertices, 6, 2)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTlLowStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, verticesLow, 0, 2)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTrLowStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, verticesLow, 2, 2)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBlLowStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, verticesLow, 4, 2)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBrLowStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, verticesLow, 6, 2)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridLevelStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * levelByteStride, new Uint8Array([level]), 0, 1)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum * 1 + storageId, new Uint8Array([deleted]), 0, 1)

        gl.bindBuffer(gl.ARRAY_BUFFER, null)
    }

    private _copyGridInBuffer(sourceStorageId: number, targetStorageId: number) {
        const gl = this._gl
        const vertexByteStride = 2 * 4
        const levelByteStride = 1 * 1
        
        const buffers = [
            this._gridTlStorageBuffer,
            this._gridTrStorageBuffer,
            this._gridBlStorageBuffer,
            this._gridBrStorageBuffer,
            this._gridTlLowStorageBuffer,
            this._gridTrLowStorageBuffer,
            this._gridBlLowStorageBuffer,
            this._gridBrLowStorageBuffer
        ]
        
        buffers.forEach(buffer => {
            gl.bindBuffer(gl.COPY_READ_BUFFER, buffer)
            gl.bindBuffer(gl.COPY_WRITE_BUFFER, buffer)
            gl.copyBufferSubData(
                gl.COPY_READ_BUFFER,
                gl.COPY_WRITE_BUFFER,
                sourceStorageId * vertexByteStride,
                targetStorageId * vertexByteStride,
                vertexByteStride
            )
        })

        gl.bindBuffer(gl.COPY_READ_BUFFER, this._gridLevelStorageBuffer)
        gl.bindBuffer(gl.COPY_WRITE_BUFFER, this._gridLevelStorageBuffer)
        gl.copyBufferSubData(
            gl.COPY_READ_BUFFER,
            gl.COPY_WRITE_BUFFER,
            sourceStorageId * levelByteStride,
            targetStorageId * levelByteStride,
            levelByteStride
        )

        gl.bindBuffer(gl.COPY_READ_BUFFER, this._gridSignalBuffer)
        gl.bindBuffer(gl.COPY_WRITE_BUFFER, this._gridSignalBuffer)
        gl.copyBufferSubData(
            gl.COPY_READ_BUFFER,
            gl.COPY_WRITE_BUFFER,
            this.maxGridNum + sourceStorageId,
            this.maxGridNum + targetStorageId,
            1
        )

        gl.bindBuffer(gl.COPY_READ_BUFFER, null)
        gl.bindBuffer(gl.COPY_WRITE_BUFFER, null)
    }

    updateGPUGrid(info?: [storageId: number, level: number, vertices: Float32Array, verticesLow: Float32Array, deleted: number]) {
        if (info) {
            this._writeGridInfoToStorageBuffer(info)
            this._gl.flush()
        }

        this.map.triggerRepaint()
    }

    copyGPUGrid(sourceStorageId: number, targetStorageId: number) {
        this._copyGridInBuffer(sourceStorageId, targetStorageId)
            this._gl.flush()
        this.map.triggerRepaint()
    }

    // Optimized function to upload multiple grid rendering info to GPU storage buffer
    // Note: grids must have continuous storageIds from 'storageId' to 'storageId + gridCount'
    private _writeMultiGridInfoToStorageBuffer(infos: [fromStorageId: number, levels: Uint8Array, vertices: Float32Array, verticesLow: Float32Array, deleteds: Uint8Array]) {

        const gl = this._gl
        const [fromStorageId, levels, vertices, verticesLow, deleteds] = infos
        const levelByteStride = 1 * 1
        const vertexByteStride = 2 * 4
        const gridCount = vertices.length / 8
        const lengthPerAttribute = 2 * gridCount

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTlStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * vertexByteStride, vertices, lengthPerAttribute * 0, lengthPerAttribute)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTrStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * vertexByteStride, vertices, lengthPerAttribute * 1, lengthPerAttribute)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBlStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * vertexByteStride, vertices, lengthPerAttribute * 2, lengthPerAttribute)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBrStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * vertexByteStride, vertices, lengthPerAttribute * 3, lengthPerAttribute)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTlLowStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * vertexByteStride, verticesLow, lengthPerAttribute * 0, lengthPerAttribute)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTrLowStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * vertexByteStride, verticesLow, lengthPerAttribute * 1, lengthPerAttribute)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBlLowStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * vertexByteStride, verticesLow, lengthPerAttribute * 2, lengthPerAttribute)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBrLowStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * vertexByteStride, verticesLow, lengthPerAttribute * 3, lengthPerAttribute)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridLevelStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * levelByteStride, levels)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum * 1 + fromStorageId, deleteds)

        gl.bindBuffer(gl.ARRAY_BUFFER, null)
    }

    updateGPUGrids(infos?: [fromStorageId: number, levels: Uint8Array, vertices: Float32Array, verticesLow: Float32Array, deleteds: Uint8Array]) {
        if (infos) {
            this._writeMultiGridInfoToStorageBuffer(infos)
            this._gl.flush()
        }
        this.map.triggerRepaint()
    }

    // Resize //////////////////////////////////////////////////

    private _resizeScreenFBO() {
        const gl = this._gl
        if (this._screenWidth === gl.canvas.width && this._screenHeight === gl.canvas.height) return

        if (this._boxPickingTexture !== 0) {
            gl.deleteTexture(this._boxPickingTexture)
        }
        if (this._boxPickingRBO !== 0) {
            gl.deleteRenderbuffer(this._boxPickingRBO)
        }
        if (this._boxPickingFBO !== 0) {
            gl.deleteFramebuffer(this._boxPickingFBO)
        }

        const factor = Math.min(1.0, window.devicePixelRatio)
        const width = Math.floor(gl.canvas.width / factor)
        const height = Math.floor(gl.canvas.height / factor)

        this._boxPickingTexture = gll.createTexture2D(gl, 0, width, height, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(width * height * 4).fill(0))
        this._boxPickingRBO = gll.createRenderBuffer(gl, width, height)
        this._boxPickingFBO = gll.createFrameBuffer(gl, [this._boxPickingTexture], 0, this._boxPickingRBO)!
    }

    private _resizeHandler() {
        // Resize canvas 2d
        const canvas = this._ctx!.canvas
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight
        }
    }

    private _resizeOverlayCanvas(): void {
        if (!this._overlayCanvas) return;
        const container = this.map.getContainer();
        const { width, height } = container.getBoundingClientRect();
        this._overlayCanvas.width = width;
        this._overlayCanvas.height = height;
    }

    // Show / Hide //////////////////////////////////////////////////

    show(): void {
        this.visible = true;
        if (this._overlayCanvas) {
            this._overlayCanvas.style.display = 'block';
        }
    }

    hide(): void {
        this.visible = false;
        if (this._overlayCanvas) {
            this._overlayCanvas.style.display = 'none';
        }
    }

    // Remove //////////////////////////////////////////////////

    private _removeGPUResource(gl: WebGL2RenderingContext) {
        gl.deleteProgram(this._pickingShader);
        gl.deleteProgram(this._gridMeshShader);
        gl.deleteProgram(this._gridLineShader);

        gl.deleteBuffer(this._gridSignalBuffer);
        gl.deleteBuffer(this._gridTlStorageBuffer);
        gl.deleteBuffer(this._gridTrStorageBuffer);
        gl.deleteBuffer(this._gridBlStorageBuffer);
        gl.deleteBuffer(this._gridBrStorageBuffer);
        gl.deleteBuffer(this._gridTlLowStorageBuffer);
        gl.deleteBuffer(this._gridTrLowStorageBuffer);
        gl.deleteBuffer(this._gridBlLowStorageBuffer);
        gl.deleteBuffer(this._gridBrLowStorageBuffer);
        gl.deleteBuffer(this._gridLevelStorageBuffer);

        gl.deleteVertexArray(this._gridStorageVAO);

        gl.deleteTexture(this._paletteTexture);
        gl.deleteTexture(this._pickingTexture);
        gl.deleteTexture(this._boxPickingTexture);

        gl.deleteFramebuffer(this._pickingFBO);
        gl.deleteFramebuffer(this._boxPickingFBO);

        gl.deleteRenderbuffer(this._pickingRBO);
        gl.deleteRenderbuffer(this._boxPickingRBO);
    }

    removeResource() {
        if (!this._gridCore) return

        this.executeClearSelection()
        this.initialized = false
        this._gridCore = null

        this.map.triggerRepaint()
    }

    remove(_: Map, gl: WebGL2RenderingContext) {
        this.removeResource();

        this._removeGPUResource(gl);

        // Remove overlay canvas
        if (this._overlayCanvas && this._overlayCanvas.parentNode) {
            this._overlayCanvas.parentNode.removeChild(this._overlayCanvas);
        }
        this._overlayCanvas = null;
        this._overlayCtx = null;
    }

    // Draw Box //////////////////////////////////////////////////

    executeDrawBox(startPos: [number, number], endPos: [number, number]): void {
        if (!this._overlayCtx) return

        this._overlayCtx.clearRect(0, 0, this._overlayCanvas!.width, this._overlayCanvas!.height)

        const box = genPickingBox(startPos, endPos)
        drawRectangle(this._overlayCtx, box)
    }

    executeClearDrawBox(): void {
        if (!this._overlayCtx) return
        this._overlayCtx.clearRect(0, 0, this._overlayCanvas!.width, this._overlayCanvas!.height)
    }

    setCheckMode(isChecking: boolean) {
        if (isChecking) {
            CHECK_ON_EVENT()
        } else {
            CHECK_OFF_EVENT()
        }
        this.map.triggerRepaint()
    }
}

// Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////

function genPickingBox(startPos: [number, number], endPos: [number, number]) {
    const _pickingBox = [
        startPos[0],
        startPos[1],
        endPos[0],
        endPos[1]
    ]
    return _pickingBox as [number, number, number, number]
}

function drawRectangle(ctx: CanvasRenderingContext2D, pickingBox: [number, number, number, number]) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    let [startX, startY, endX, endY] = pickingBox

    if (startX > endX) { [startX, endX] = [endX, startX] }
    if (startY > endY) { [startY, endY] = [endY, startY] }

    const width = (endX - startX)
    const height = (endY - startY)

    ctx.strokeStyle = 'rgba(227, 102, 0, 0.67)'
    ctx.fillStyle = 'rgba(235, 190, 148, 0.52)'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 3])
    ctx.strokeRect(startX, startY, width, height)
    ctx.fillRect(startX, startY, width, height)
}