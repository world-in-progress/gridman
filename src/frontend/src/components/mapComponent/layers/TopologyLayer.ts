import proj4 from 'proj4'
import axios from 'axios'
import { mat4 } from 'gl-matrix'
import { GUI, GUIController } from 'dat.gui'
import { Map, MapMouseEvent } from 'mapbox-gl'

import '../../editor-style.css'
import gll from '../utils/GlLib'
import NHLayerGroup from '../utils/NHLayerGroup'
import FileDownloader from '../utils/DownloadHelper'
import BoundingBox2D from '../../../core/util/boundingBox2D'
import GridRecorder from '../../../core/grid/NHGridRecorder'
import { NHCustomLayerInterface } from '../utils/interfaces'
import { MercatorCoordinate } from '../../../core/math/mercatorCoordinate'
import VibrantColorGenerator from '../../../core/util/vibrantColorGenerator'
import store from '../../../store'
proj4.defs("EPSG:2326","+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.243649,-1.158827,-1.094246 +units=m +no_defs")

const STATUS_URL = 'http://127.0.0.1:8000' + '/v0/mc/status'
const RESULT_URL = 'http://127.0.0.1:8000' + '/v0/mc/result'
const DOWNLOAD_URL = 'http://127.0.0.1:8000' + '/v0/fs/result/zip'
const PROCESS_URL = 'http://127.0.0.1:8000' + '/v0/nh/grid-process'


export interface TopologyLayerOptions {

    maxGridNum?: number
    edgeProperties?: string[]
}

export default class TopologyLayer implements NHCustomLayerInterface {

    // Layer-related //////////////////////////////////////////////////
    type = 'custom' as const
    id = 'TopologyLayer'
    visible = true
    layerGroup!: NHLayerGroup

    // Function-related //////////////////////////////////////////////////

    // Grid properties
    srcCS!: string
    maxGridNum: number
    bBox!: BoundingBox2D
    hitSet = new Set<number>
    _gridRecorder: GridRecorder | null = null
    hitFlag = new Uint8Array([1])   // 0 is a special value and means no selection
    projConverter!: proj4.Converter
    
    lastPickedId: number = -1
    _forceUpdate = false

    // GPU-related //////////////////////////////////////////////////

    storageTextureSize: number
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
    private _gridSignalBuffer: WebGLBuffer = 0      // [ [isHit], [isSssigned] ]
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

    // Picking pass resource
    private _pickingFBO: WebGLFramebuffer = 0
    private _pickingTexture: WebGLTexture = 0
    private _pickingRBO: WebGLRenderbuffer = 0

    ////// ADDON
    // Box Picking pass resource
    private _boxPickingFBO: WebGLFramebuffer = 0
    private _boxPickingTexture: WebGLTexture = 0
    private _boxPickingRBO: WebGLRenderbuffer = 0

    private _boxPickingStart: MapMouseEvent | null = null
    private _boxPickingEnd: MapMouseEvent | null = null

    private _ctx: CanvasRenderingContext2D | null = null

    // ADDON
    private _overlayCanvas: HTMLCanvasElement | null = null;
    private _overlayCtx: CanvasRenderingContext2D | null = null;

    // GPU grid update function
    updateGPUGrid: Function
    updateGPUGrids: Function

    // Interaction-related //////////////////////////////////////////////////

    typeChanged = false
    isShiftClick = false
    isTransparent = false

    resizeHandler: Function

    // Dat.GUI
    gui: GUI
    capacityController: GUIController
    uiOption: { capacity: number, level: number }

    constructor(
        public map: Map,
        options: TopologyLayerOptions = {}
    ) {

        // Set basic members
        this.maxGridNum = options.maxGridNum || 4096 * 4096

        // this.gridRecorder = store.get<GridRecorder>('gridRecorder')!

        // this.srcCS = this.gridRecorder.srcCS

        // this.projConverter = proj4(this.srcCS, 'EPSG:4326')

        // this.bBox = this.gridRecorder.bBox

        // // Calculate relative center
        //   const center = this.projConverter.forward([
        //     (this.bBox.xMin + this.bBox.xMax) / 2.0,
        //     (this.bBox.yMin + this.bBox.yMax) / 2.0,
        // ])
        // this.relativeCenter = new Float32Array(MercatorCoordinate.fromLonLat(center as [number, number]))

        // Set WebGL2 context
        this._gl = this.map.painter.context.gl

        // Set storage texture memory
        this.storageTextureSize = Math.ceil(Math.sqrt(this.maxGridNum))

        // Make palette color list
        const colorGenerator = new VibrantColorGenerator()
        this.paletteColorList = new Uint8Array(256 * 3)
        for (let i = 0; i < 256; i++) {
            const color = colorGenerator.nextColor().map(channel => channel * 255.0)
            this.paletteColorList.set(color, i * 3)
        }

        // Bind callbacks and event handlers
        this.updateGPUGrid = this._updateGPUGrid.bind(this)
        this.updateGPUGrids = this._updateGPUGrids.bind(this)

        this.resizeHandler = this._resizeHandler.bind(this)

        // Init interaction option
        this.uiOption = {
            level: 2,
            capacity: 0.0,
        }

        // Launch Dat.GUI
        this.gui = new GUI()
        // const brushFolder = this.gui.addFolder('Brush')
        // brushFolder.add(this.uiOption, 'level', 1, this.subdivideRules.length - 1, 1)
        // brushFolder.open()
        this.gui.add(this.uiOption, 'capacity', 0, this.maxGridNum).name('Capacity').listen()

        this.capacityController = this.gui.__controllers[0]
        this.capacityController.setValue(0.0)
        this.capacityController.domElement.style.pointerEvents = 'none'

        // 创建overlay canvas
        this._overlayCanvas = document.createElement('canvas');
        this._overlayCanvas.style.position = 'absolute';
        this._overlayCanvas.style.top = '0';
        this._overlayCanvas.style.left = '0';
        this._overlayCanvas.style.pointerEvents = 'none';
        this._overlayCanvas.style.zIndex = '1';
        
        const mapContainer = this.map.getContainer();
        mapContainer.appendChild(this._overlayCanvas);
        
        this._overlayCtx = this._overlayCanvas.getContext('2d');
        
        this._resizeOverlayCanvas();
        
        const resizeObserver = new ResizeObserver(() => {
            this._resizeOverlayCanvas();
        });
        resizeObserver.observe(mapContainer);
    }

    set gridRecorder(recorder: GridRecorder) {
        
        this._gridRecorder = recorder

        this.srcCS = this._gridRecorder.srcCS

        this.projConverter = proj4(this.srcCS, 'EPSG:4326')

        this.bBox = this._gridRecorder.bBox
    }

    get gridRecorder(): GridRecorder {
        if (!this._gridRecorder) {
            const err = new Error('GridRecorder is not initialized')
            console.error(err)
            throw err
        }
        return this._gridRecorder
    }

    get initialized() {
        if (this._gridRecorder && this._gridRecorder!.gridNum) {
            return true
        }
        return false
    }

    get subdivideRules() {
        return this._gridRecorder!.subdivideRules.rules
    }

    // Fast function to upload one grid rendering info to GPU stograge buffer
    writeGridInfoToStorageBuffer(info: [storageId: number, level: number, vertices: Float32Array, verticesLow: Float32Array]) {
        const gl = this._gl
        const levelByteStride = 1 * 1
        const vertexByteStride = 2 * 4
        const [storageId, level, vertices, verticesLow] = info

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
        gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum * 1 + storageId, new Uint8Array([0]), 0, 1)

        gl.bindBuffer(gl.ARRAY_BUFFER, null)
    }

    // Optimized function to upload multiple grid rendering info to GPU storage buffer
    // Note: grids must have continuous storageIds from 'storageId' to 'storageId + gridCount'
    writeMultiGridInfoToStorageBuffer(infos: [fromStorageId: number, levels: Uint8Array, vertices: Float32Array, verticesLow: Float32Array]) {

        const gl = this._gl
        const [fromStorageId, levels, vertices, verticesLow] = infos
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
        gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum * 1 + fromStorageId, new Uint8Array(gridCount).fill(0), 0, 1)

        gl.bindBuffer(gl.ARRAY_BUFFER, null)
    }

    async init() {

        // Init DOM Elements and handlers ////////////////////////////////////////////////////////////

        // [0] Box Picking Canvas
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

        // Init GPU resources ////////////////////////////////////////////////////////////

        const gl = this._gl

        gll.enableAllExtensions(gl)

        // Create shader
        this._pickingShader = await gll.createShader(gl, '/shaders/picking.glsl')
        this._gridLineShader = await gll.createShader(gl, '/shaders/gridLine.glsl')
        this._gridMeshShader = await gll.createShader(gl, '/shaders/gridMesh.glsl')

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
        this._paletteTexture = gll.createTexture2D(gl, 1, 256, 1, gl.RGB8)

        // Create picking pass
        this._pickingTexture = gll.createTexture2D(gl, 0, 1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
        this._pickingRBO = gll.createRenderBuffer(gl, 1, 1)
        this._pickingFBO = gll.createFrameBuffer(gl, [this._pickingTexture], 0, this._pickingRBO)!
        this._resetScreenFBO()


        // Init palette texture (default in subdivider type)
        const colorList = new Uint8Array(256 * 3)
        for (let i = 0; i < 256; i++) {
            colorList.set([0, 127, 127], i * 3)
        }

        gll.fillSubTexture2DByArray(gl, this._paletteTexture, 0, 0, 0, 256, 1, gl.RGB, gl.UNSIGNED_BYTE, this.paletteColorList)

        // Add event listener for topology editor
        // this.addTopologyEditorUIHandler()

        // Init workers of gridRecorder ////////////////////////////////////////////////////////////
                
        // this.gridRecorder.init(() => {

        //     this.gridRecorder.subdivideGrid(0, 0, (infos: any) => {

        //         this.updateGPUGrids(infos)

        //         // Raise flag when the root grid (level: 0, globalId: 0) has been subdivided
        //         this.initialized = true
        //         this.showLoading!(false)`
        //     })
        // })
    }

    _resetScreenFBO() {
        const gl = this._gl
        if (this._screenWidth === gl.canvas.width && this._screenHeight === gl.canvas.height) return

        if (this._boxPickingTexture !==0) {
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

    hit(storageIds: number | number[], addMode = true) {

        const ids = Array.isArray(storageIds) ? storageIds : [storageIds]
        if (addMode) {  
            ids.forEach(storageId => {
                if (storageId < 0) return
                this.hitSet.add(storageId)
            })
        } else {
            ids.forEach(storageId => {
                if (storageId < 0) return

                if (this.hitSet.has(storageId)) {
                    this.hitSet.delete(storageId)

                    // handle the situation that the hitset's length changes to 0
                    if (this.hitSet.size === 0) {
                        this._forceUpdate = true
                    }
                }
            })
        }
        
        this.map.triggerRepaint()
    }
    

    removeGridLocally(storageId: number) {
        this.gridRecorder.removeGridLocally(storageId, this.updateGPUGrid)
        this.map.triggerRepaint()
    }

    removeGridsLocally(storageIds: number[]) {
        this.gridRecorder.removeGridsLocally(storageIds, this.updateGPUGrid)
        this.map.triggerRepaint()
    }

    removeGrids(storageIds: number[]) {
        this.gridRecorder.removeGrids(storageIds, this.updateGPUGrid)
    }

    subdivideGrid(uuId: string) {
        const [level, globalId] = decodeInfo(uuId)
        this.gridRecorder.subdivideGrid(level, globalId, this.updateGPUGrids)
    }

    subdivideGrids(uuIds: string[]) {
        const infos = uuIds.map(uuId => decodeInfo(uuId)) as [level: number, globalId: number][]
        this.gridRecorder.subdivideGrids({levels: new Uint8Array(infos.map(info => info[0])), globalIds: new Uint32Array(infos.map(info => info[1]))}, (renderInfos: any) => {
            this.updateGPUGrids(renderInfos)
            const [fromStorageId, levels] = renderInfos
            const storageIds = []
            for (let i = fromStorageId; i <= fromStorageId + levels.length - 1; i++) {
                storageIds.push(i)
            }
            this.hit(storageIds)
        })
    }

    tickGrids() {

        // Highlight all hit grids //////////////////////////////

        if (this.hitSet.size === 0 && !this._forceUpdate) return

        this._forceUpdate = false

        // Update hit flag for this current frame
        this._updateHitFlag()

        // Update grid signal buffer
        const gl = this._gl
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
        this.hitSet.forEach(hitStorageId => gl.bufferSubData(gl.ARRAY_BUFFER, hitStorageId, this.hitFlag, 0))
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        this.typeChanged = false
    }

    async initialize(_: Map, gl: WebGL2RenderingContext) {
        this._gl = gl
        await this.init()
    }

    render(gl: WebGL2RenderingContext, matrix: number[]) {

        // Skip if not ready
        if (!this.initialized) return // check if topology layer is initialized


        if (!this.visible) return

        // Tick logic
        this.tickGrids()
        // Tick render
        if (!this.isTransparent) {

            // Mesh Pass
            this.drawGridMeshes()

            // Line Pass
            this.drawGridLines()
        }

        // WebGL check
        gll.errorCheck(gl)

        // console.log(this.gridRecorder.gridNum)

        // Update display of capacity
        this.uiOption.capacity = this.gridRecorder.gridNum
        this.capacityController.updateDisplay()
    }

    removeResource() {
        
        if (!this._gridRecorder) return

        this.executeClearSelection()
        console.log(this.hitSet)

        this._gridRecorder = null
        this.map.triggerRepaint()
    }

    drawGridMeshes() {

        const gl = this._gl

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

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
        gl.uniform4fv(gl.getUniformLocation(this._gridMeshShader, 'relativeCenter'), this.gridRecorder.relativeCenter)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._gridMeshShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.gridRecorder.gridNum)

    }

    drawGridLines() {
        const gl = this._gl

        gl.disable(gl.BLEND)
        gl.disable(gl.DEPTH_TEST)

        gl.useProgram(this._gridLineShader)

        gl.bindVertexArray(this._gridStorageVAO)

        gl.uniform2fv(gl.getUniformLocation(this._gridLineShader, 'centerHigh'), [this.layerGroup.mercatorCenterX[0], this.layerGroup.mercatorCenterY[0]]);
        gl.uniform2fv(gl.getUniformLocation(this._gridLineShader, 'centerLow'), [this.layerGroup.mercatorCenterX[1], this.layerGroup.mercatorCenterY[1]]);
        gl.uniformMatrix4fv(gl.getUniformLocation(this._gridLineShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)
        gl.uniform4fv(gl.getUniformLocation(this._gridLineShader, 'relativeCenter'), this.gridRecorder.relativeCenter)

        gl.drawArraysInstanced(gl.LINE_LOOP, 0, 4, this.gridRecorder.gridNum)
    }

    remove(_: Map, gl: WebGL2RenderingContext) {

        this.removeResource()
        
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

        // remove overlay canvas
        if (this._overlayCanvas && this._overlayCanvas.parentNode) {
            this._overlayCanvas.parentNode.removeChild(this._overlayCanvas);
        }
        this._overlayCanvas = null;
        this._overlayCtx = null;
    }

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
        gl.uniform4fv(gl.getUniformLocation(this._pickingShader, 'relativeCenter'), this.gridRecorder.relativeCenter)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._pickingShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.gridRecorder.gridNum)

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

        this._resetScreenFBO()
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
        gl.uniform4fv(gl.getUniformLocation(this._pickingShader, 'relativeCenter'), this.gridRecorder.relativeCenter)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._pickingShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.gridRecorder.gridNum)

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

    private _updateGPUGrid(info?: [storageId: number, level: number, vertices: Float32Array, verticesLow: Float32Array]) {
        
        if (info) {
            this.writeGridInfoToStorageBuffer(info)
            this._gl.flush()
        }

        this.map.triggerRepaint()
    }

    private _updateGPUGrids(infos?: [fromStorageId: number, levels: Uint8Array, vertices: Float32Array, verticesLow: Float32Array]) {

        if (infos) {
            this.writeMultiGridInfoToStorageBuffer(infos)
            this._gl.flush()
        }
        this.map.triggerRepaint()
    }

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

    private _resizeHandler() {

        // Resize canvas 2d
        const canvas = this._ctx!.canvas
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight
        }
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


    // Interaction API

    // type: 0 - box, 1 - brush, 2 - feature
    // mode: true - add, false - remove
    executePickGrids(type: string, mode: boolean, startPos: [number, number], endPos?: [number, number]) {

        let storageIds
        if (type === 'box') {
            const box = genPickingBox(startPos, endPos!)
            storageIds = this._boxPicking(box)
        } else if (type === 'brush') {
            storageIds = this._brushPicking(this._calcPickingMatrix(startPos))
        } else if (type === 'feature') {
            storageIds = []
            //TODO: feature picking
        } else {
            return
        }

        this.hit(storageIds!, mode)
    }

    executeSubdivideGrids() {
        
        if (this.hitSet.size === 0) return
        
        // Parse hitSet
        const subdividableUUIDs = new Array<string>()
        const removableStorageIds = new Array<number>()

        this.hitSet.forEach(removableStorageId => {

            const level = this.gridRecorder.getGridInfoByStorageId(removableStorageId)[0]
            
            // Nothing will happen if the hit grid has the maximize level
            if (level === this.gridRecorder.maxLevel) return

            // Add removable grids
            removableStorageIds.push(removableStorageId)
            // Add subdividable grids
            subdividableUUIDs.push(this.gridRecorder.getGridInfoByStorageId(removableStorageId).join('-'))
        })

        this.executeClearSelection()

        if (subdividableUUIDs.length === 1) {
            this.removeGridLocally(removableStorageIds[0])
            // this.subdivideGrid(subdividableUUIDs[0])
            this.subdivideGrids(subdividableUUIDs)
        }
        else if (subdividableUUIDs.length > 1) {
            this.removeGridsLocally(removableStorageIds)
            this.subdivideGrids(subdividableUUIDs)
        }
    }

    executeDeleteGrids() {

        if (this.hitSet.size === 0) return

        const removableStorageIds = Array.from(this.hitSet)
        this.removeGrids(removableStorageIds)
        this.executeClearSelection()
    }

    executeClearSelection() {

        this.hitSet.clear()
        this._updateHitFlag()
        this.map.triggerRepaint()
    }

    executeDrawBox(startPos: [number, number], endPos: [number, number]): void {
        if (!this._overlayCtx) return;
        
        this._overlayCtx.clearRect(0, 0, this._overlayCanvas!.width, this._overlayCanvas!.height);
        
        const box = genPickingBox(startPos, endPos);
        drawRectangle(this._overlayCtx, box);
    }

    executeClearDrawBox(): void {
        if (!this._overlayCtx) return;
        this._overlayCtx.clearRect(0, 0, this._overlayCanvas!.width, this._overlayCanvas!.height);
    }

    private _resizeOverlayCanvas(): void {
        if (!this._overlayCanvas) return;
        const container = this.map.getContainer();
        const { width, height } = container.getBoundingClientRect();
        this._overlayCanvas.width = width;
        this._overlayCanvas.height = height;
    }
}

// Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////

function decodeInfo(infoKey: string): Array<number> {

    return infoKey.split('-').map(key => +key)
}

function isMacOS(): boolean {
    return navigator.userAgent.includes('Mac')
}

// ADDON
function genPickingBox(startPos: [number, number], endPos: [number, number]) {

    const _pickingBox = [
        startPos[0], 
        startPos[1], 
        endPos[0],
        endPos[1]
    ]
    return _pickingBox as [number, number, number, number]
}

function clear(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
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
