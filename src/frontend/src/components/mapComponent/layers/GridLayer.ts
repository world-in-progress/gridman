import proj4 from 'proj4'
import axios from 'axios'
import { mat4 } from 'gl-matrix'
import { GUI, GUIController } from 'dat.gui'
import { Map, MapMouseEvent } from 'mapbox-gl'

import '../../editor-style.css'
import gll from '../utils/GlLib'
import NHLayerGroup from '../NHLayerGroup'
import FileDownloader from '../utils/DownloadHelper'
import BoundingBox2D from '../../../core/util/boundingBox2D'
import GridRecorder from '../../../core/grid/NHGridRecorder'
import { NHCustomLayerInterface } from '../utils/interfaces'
import { MercatorCoordinate } from '../../../core/math/mercatorCoordinate'
import VibrantColorGenerator from '../../../core/util/vibrantColorGenerator'

proj4.defs("EPSG:2326","+proj=tmerc +lat_0=22.3121333333333 +lon_0=114.178555555556 +k=1 +x_0=836694.05 +y_0=819069.8 +ellps=intl +towgs84=-162.619,-276.959,-161.764,0.067753,-2.243649,-1.158827,-1.094246 +units=m +no_defs")

const STATUS_URL = 'http://127.0.0.1:8000' + '/v0/mc/status'
const RESULT_URL = 'http://127.0.0.1:8000' + '/v0/mc/result'
const DOWNLOAD_URL = 'http://127.0.0.1:8000' + '/v0/fs/result/zip'
const PROCESS_URL = 'http://127.0.0.1:8000' + '/v0/nh/grid-process'


export interface GridLayerOptions {

    maxGridNum?: number
    edgeProperties?: string[]
}

export default class GridLayer implements NHCustomLayerInterface {

    // Layer-related //////////////////////////////////////////////////

    type = 'custom'
    id = 'GridLayer'
    renderingMode = '3d'
    initialized = false
    visible = true
    layerGroup!: NHLayerGroup

    // Function-related //////////////////////////////////////////////////

    // Grid properties
    maxGridNum: number
    bBox: BoundingBox2D
    hitSet = new Set<number>
    gridRecorder: GridRecorder
    hitFlag = new Uint8Array([1])   // 0 is a special value and means no selection
    projConverter: proj4.Converter
    
    lastPickedId: number = -1

    // Boundary center
    relativeCenter = new Float32Array([0.0, 0.0])

    // GPU-related //////////////////////////////////////////////////

    storageTextureSize: number
    paletteColorList: Uint8Array

    private _gl: WebGL2RenderingContext

    // Shader
    private _edgeShader: WebGLProgram = 0
    private _edgeRibbonedShader: WebGLProgram = 0
    private _pickingShader: WebGLProgram = 0
    private _gridMeshShader: WebGLProgram = 0
    private _gridLineShader: WebGLProgram = 0

    // Texture resource
    private _levelTexture: WebGLTexture = 0
    private _paletteTexture: WebGLTexture = 0
    private _storageTextureArray: WebGLTexture = 0

    // Buffer resource
    private _gridSignalBuffer: WebGLBuffer = 0      // [ [isHit], [isSssigned] ]
    private _gridTlStorageBuffer: WebGLBuffer = 0
    private _gridTrStorageBuffer: WebGLBuffer = 0
    private _gridBlStorageBuffer: WebGLBuffer = 0
    private _gridBrStorageBuffer: WebGLBuffer = 0
    private _gridLevelStorageBuffer: WebGLBuffer = 0
    private _gridStorageVAO: WebGLVertexArrayObject = 0

    private _edgeStorageBuffer: WebGLBuffer = 0
    private _edgeRibbonedBuffer: WebGLBuffer = 0
    private _edgeStorageVAO: WebGLVertexArrayObject = 0
    private _edgeRibbonedVAO: WebGLVertexArrayObject = 0

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

    // Edge assignment resource
    private _vertexBuffer!: Float32Array
    private _assignedEdges: Array<number> = []

    // GPU grid update function
    updateGPUGrid: Function
    updateGPUGrids: Function
    updateGPUEdges: (fromStorageId: number, vertexBuffer: Float32Array) => void

    // Interaction-related //////////////////////////////////////////////////

    // Interaction mode
    private _EditorState: Record<string, string> = {
        editor: 'none',   // 'none' | 'topology' | 'attribute'
        tool: 'none',     // 'none' | 'brush' | 'box'
        mode: 'none'      // 'none' | 'check'
    }
    EditorState: Record<string, string> = {}

    // Attr-Setter
    activeAttrFeature: Record<string, any> = {}
    attrSetter: HTMLDivElement | null = null
    edgeDom: HTMLDivElement | null = null
    showLoading: Function | null = null
    isTopologyParsed = false

    typeChanged = false
    isShiftClick = false
    isTransparent = false

    resizeHandler: Function
    mouseupHandler: Function
    mouseoutHandler: Function
    mousedownHandler: Function
    mousemoveHandler: Function

    // Dat.GUI
    gui: GUI
    capacityController: GUIController
    uiOption: { capacity: number, level: number }

    constructor(
        public map: Map,
        public srcCS: string,
        public firstLevelSize: [number, number],
        subdivideRules: [number, number][],
        boundaryCondition: [number, number, number, number],
        options: GridLayerOptions = {}
    ) {

        // Set basic members
        this.projConverter = proj4(this.srcCS, 'EPSG:4326')
        this.maxGridNum = options.maxGridNum || 4096 * 4096

        // Resize boundary condition by the first level size
        boundaryCondition[2] = boundaryCondition[0] + Math.ceil((boundaryCondition[2] - boundaryCondition[0]) / this.firstLevelSize[0]) * this.firstLevelSize[0]
        boundaryCondition[3] = boundaryCondition[1] + Math.ceil((boundaryCondition[3] - boundaryCondition[1]) / this.firstLevelSize[1]) * this.firstLevelSize[1]
        this.bBox = new BoundingBox2D(...boundaryCondition)
        
        // Calculate relative center
        const center = this.projConverter.forward([
            (this.bBox.xMin + this.bBox.xMax) / 2.0,
            (this.bBox.yMin + this.bBox.yMax) / 2.0,
        ])
        this.relativeCenter = new Float32Array(MercatorCoordinate.fromLonLat(center as [number, number]))

        // Set first level rule of subdivide rules by new boundary condition
        const modifiedSubdivideRules: [number, number][] = [[
            (boundaryCondition[2] - boundaryCondition[0]) / this.firstLevelSize[0],
            (boundaryCondition[3] - boundaryCondition[1]) / this.firstLevelSize[1],
        ]]
        // Add other level rules to modified subdivide rules
        modifiedSubdivideRules.push(...subdivideRules)

        // Create core recorders
        this.gridRecorder = new GridRecorder(
            {
                bBox: this.bBox,
                srcCS: this.srcCS,
                targetCS: 'EPSG:4326',
                rules: modifiedSubdivideRules
            },
            this.maxGridNum,
            {
                workerCount: 4,
                operationCapacity: 200,
                projectLoadCallback: this._updateGPUGrids.bind(this),
            })

        // Set WebGL2 context
        this._gl = this.map.painter.context.gl

        // Set storage texture memory
        this.storageTextureSize = Math.ceil(Math.sqrt(this.maxGridNum))

        // Make palette color list
        const colorGenerator = new VibrantColorGenerator()
        this.paletteColorList = new Uint8Array(this.subdivideRules.length * 3)
        for (let i = 0; i < this.subdivideRules.length; i++) {
            const color = colorGenerator.nextColor().map(channel => channel * 255.0)
            this.paletteColorList.set(color, i * 3)
        }

        // Bind callbacks and event handlers
        this.updateGPUGrid = this._updateGPUGrid.bind(this)
        this.updateGPUGrids = this._updateGPUGrids.bind(this)
        this.updateGPUEdges = this._updateGPUEdges.bind(this)

        this.resizeHandler = this._resizeHandler.bind(this)
        this.mouseupHandler = this._mouseupHandler.bind(this)
        this.mouseoutHandler = this._mouseoutHandler.bind(this)
        this.mousedownHandler = this._mousedownHandler.bind(this)
        this.mousemoveHandler = this._mousemoveHandler.bind(this)

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
    }

    get subdivideRules() {
        return this.gridRecorder.subdivideRules.rules
    }

    // Fast function to upload one grid rendering info to GPU stograge buffer
    writeGridInfoToStorageBuffer(info: [storageId: number, level: number, vertices: Float32Array]) {

        const gl = this._gl
        const levelByteStride = 1 * 1
        const vertexByteStride = 2 * 4
        const [storageId, level, vertices] = info

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTlStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, vertices, 0, 2)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridTrStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, vertices, 2, 2)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBlStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, vertices, 4, 2)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridBrStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * vertexByteStride, vertices, 6, 2)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridLevelStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, storageId * levelByteStride, new Uint8Array([level]), 0, 1)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum * 1 + storageId, new Uint8Array([0]), 0, 1)

        gl.bindBuffer(gl.ARRAY_BUFFER, null)
    }

    // Optimized function to upload multiple grid rendering info to GPU storage buffer
    // Note: grids must have continuous storageIds from 'storageId' to 'storageId + gridCount'
    writeMultiGridInfoToStorageBuffer(infos: [fromStorageId: number, levels: Uint8Array, vertices: Float32Array]) {

        const gl = this._gl
        const [fromStorageId, levels, vertices] = infos
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
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridLevelStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * levelByteStride, levels)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum * 1 + fromStorageId, new Uint8Array(gridCount).fill(0), 0, 1)

        gl.bindBuffer(gl.ARRAY_BUFFER, null)
    }

    async init() {

        // Init DOM Elements and handlers ////////////////////////////////////////////////////////////

        // [--1] init loading DOM
        this.showLoading = initLoadingDOM()!
        this.showLoading(true)

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

        // [1] Create Control Panel Dom
        const pannel = document.createElement('div')
        pannel.id = 'pannel'
        pannel.classList.add('pannel')
        pannel.innerHTML = `
            <div class="pannel-title f-center f3">Control-Panel</div>
            <div class="pannel-content">
              <div class="tool-container f-row">
                <div class="tool-title f-center f2">Tool</div>
                <div class="tool-content f-row">
                  <div class="tool-item pic" id="brush" data-active="false" data-type="tool" data-val="brush"></div>
                  <div class="tool-item pic" id="box"   data-active="false" data-type="tool" data-val="box"></div>
                  <div class="tool-item pic button-style" id="clear" data-val="clear"></div>
                </div>
              </div>
              <div class="editor-container f-row">
                <div class="editor-title f-center f2">Editor</div>
                <div class="editor-content f-col">
                  <div class="editor-item p0_0_1_0" id="topology" data-active="false" data-type="editor" data-val="topology">
                    <div class="f-center p5_0 f1 editor-name">Topology-Editor</div>
                    <div class="f-row f-even">
                      <div class="f0 sub-item p0_5 button-style" id="subdivide" data-active="false" data-type="mode" data-val="subdivide">Subdivide</div>
                      <div class="f0 sub-item p0_5 button-style" id="delete"    data-active="false" data-type="mode" data-val="delete">Delete</div>
                    </div>
                  </div>
                  <div class="editor-item" id="attribute" data-active="false" data-type="editor" data-val="attribute">
                    <div class="f-center p10_5 f1 editor-name">Attribute-Editor</div>
                  </div>
                </div>
              </div>
            </div>
        `
        const controlPanelContainer = document.querySelector('#control-panel-container')
        if (controlPanelContainer) {
            controlPanelContainer.appendChild(pannel)
        } else {
            document.body.appendChild(pannel)
        }

        // [2] Setup Control Panne Surface Interaction
        const ids = ['box', 'brush', 'clear', 'topology', 'attribute', 'subdivide', 'delete']
        const doms = ids.map(id => document.querySelector(`#${id}`)! as HTMLDivElement)

        const handleClick = (dom: HTMLDivElement) => {
            const { type, val, active } = dom.dataset as { type: string, val: string, active: string }
            if (type === 'mode') {
                if (val === 'subdivide') this.subdivideActiveGrids()
                else if (val === 'delete') this.deleteActiveGrids()
                return
            }
            if (val === 'clear') {
                this.clearActiveGrids() 
                return
            }
            
            if (active === 'true' && val === 'topology') {
                for (const dom of doms) {
                    if (dom.dataset.type === 'mode' && dom.dataset.active === 'true') {
                        return
                    }
                }
            }
            else if (active === 'true') {
                dom.dataset.active = 'false' //only cancel the active
                this.EditorState[type] = 'none'
                return
            }

            deactivate(type)
            activate.call(this, dom)
            this.EditorState[type] = val

            // Local helper
            function deactivate(type: string) {
                if (type !== 'mode') doms.forEach(d => d.dataset.type === type && (d.dataset.active = 'false'))
            }

            function activate(this: GridLayer, dom: HTMLDivElement) {
                if (type !== 'mode') dom.dataset.active = 'true'
            }
        }

        doms.forEach((dom: HTMLDivElement) => {
            dom.addEventListener('click', _ => handleClick(dom))
        })

        // [3] Setup Control Panne Core Interaction
        const proxyHandler = {
            set: this._handleStateSet.bind(this),
            get: this._handleStateGet.bind(this)
        }

        this.EditorState = new Proxy(this._EditorState, proxyHandler)

        // Default Editor State
        const initState = (state: { editor: string, mode: string, tool: string }) => {
            requestAnimationFrame(() => {
                doms.forEach((d: HTMLDivElement) => {
                    const activateVal = Object.values(state)
                    if (activateVal.includes(d.dataset.val as string)) {
                        d.dataset.active = 'true'
                    }
                })
                this.EditorState.editor = state.editor
                this.EditorState.mode = state.mode
                this.EditorState.tool = state.tool
            })
        }

        initState(/* defaultState */ {
            editor: 'topology',
            tool: 'brush',
            mode: 'none'
        })

        // [4] Remove Event handler for map boxZoom
        this.map.boxZoom.disable()

        // [5] Add event listner for <Shift + T> (Set grid transparent or not)
        document.addEventListener('keydown', e => {

            if (e.shiftKey && e.key === 'T') {
                this.isTransparent = !this.isTransparent
                console.log(`Grid Transparent: ${this.isTransparent ? 'ON' : 'OFF'}`)
                this.map.triggerRepaint()
            }
        })

        // [6] Add event listner for <Shift + A> (Console Attribute Type)
        document.addEventListener('keydown', e => {

            if (e.shiftKey && e.key === 'A') {

                this.EditorState.mode = 'check'

                this.map.triggerRepaint()
            }
        })

        // [6.5] Add event listener for <Esc> (Clear hitset)
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.clearActiveGrids()
            }
        })


        // [7] Init the attrSettor DOM
        this.initAttrSetter({
            top: new Set(),
            left: new Set(),
            bottom: new Set(),
            right: new Set(),
            id: -1
        })

        // [-1] Add event lister for gridRecorder
        document.addEventListener('keydown', e => {

            const ctrlOrCmd = isMacOS() ? e.metaKey : e.ctrlKey

            // Register UNDO operation
            if (ctrlOrCmd && e.key.toLocaleLowerCase() === 'z' && !e.shiftKey) {
                e.preventDefault()
                this.gridRecorder.undo()
            }

            // Register REDO operation
            if (ctrlOrCmd && e.key.toLocaleLowerCase() === 'z' && e.shiftKey) {
                e.preventDefault()
                this.gridRecorder.redo()
            }

            // Register LOAD operation
            if (ctrlOrCmd && e.key.toLocaleLowerCase() === 'l') {
                e.preventDefault()

                const input = document.createElement('input')
                input.accept = '.json'
                input.type = 'file'
                input.click()

                input.addEventListener('change', e => {

                    if (!e.target) return
                    const inputElement = e.target as HTMLInputElement
                    if (!inputElement || !inputElement.files) return
                    const file = inputElement.files[0]
                    if (file) {
                        const reader = new FileReader()
                        reader.onload = () => {
                            try {
                                const data = JSON.parse(reader.result as string)
                                this.gridRecorder.deserialize(data)

                                // Update relative center //////////
                                this.srcCS = this.gridRecorder.srcCRS
                                this.projConverter = proj4(this.srcCS, 'EPSG:4326')
                                this.bBox = new BoundingBox2D(...this.gridRecorder.bBox.boundary)
        
                                // Calculate relative center
                                const center = this.projConverter.forward([
                                    (this.bBox.xMin + this.bBox.xMax) / 2.0,
                                    (this.bBox.yMin + this.bBox.yMax) / 2.0,
                                ])
                                this.relativeCenter = new Float32Array(MercatorCoordinate.fromLonLat(center as [number, number]))

                                    // Checkout to topology-editor
                                    ; (document.querySelector("#subdivide") as HTMLDivElement).dataset.active = "false"
                                    ; (document.querySelector("#subdivide") as HTMLDivElement).click()

                            } catch (err) {
                                console.error('Error parsing JSON file:', err)
                            }
                        }
                        reader.readAsText(file)
                    }
                })
            }

            // Register Topology-SAVE operation
            if (ctrlOrCmd && e.key.toLocaleLowerCase() === 's') {
                e.preventDefault()

                const data = this.gridRecorder.serialize()
                const jsonData = JSON.stringify(data)
                const blob = new Blob([jsonData], { type: 'application/json' })
                const link = document.createElement('a')
                link.href = URL.createObjectURL(blob)
                link.download = 'gridInfo.json'
                link.click()
                link.remove()
            }

            // Register Result-ZIP-SAVE operation
            if (ctrlOrCmd && e.key.toLocaleLowerCase() === 'e') {
                e.preventDefault()
                this.showLoading && this.showLoading(true)

                // Trigger grid-process
                axios.post(PROCESS_URL, {
                    "serialization": this.gridRecorder.serialize(),
                }).then(res => {

                    const caseID = res.data['case-id']
                    let timerID = -1

                    // Local helpers for <Status>, <Result> and <ZipFile>
                    const fetchStatus = async () => {

                        const status = (await axios.get(STATUS_URL, { "params": { "id": caseID } })).data.status
                        if (status === "RUNNING" || status === "LOCK") return false
                        else if (status === "COMPLETE") return true
                        else
                            throw new Error(`UNKNOWN STATUS: ${status}`);
                    }
                    const fetchResultJson = async () => {
                        const resultJson = (await axios.get(RESULT_URL, { "params": { "id": caseID } })).data.result
                        return { id: resultJson['case-id'], name: resultJson["result"] }
                    }
                    const fetchResultFile = (id: string, name: string) => {

                        const downloadURL = new URL(DOWNLOAD_URL)
                        downloadURL.searchParams.append("id", id)
                        downloadURL.searchParams.append("name", name)

                        const fileDownloader = new FileDownloader({
                            url: downloadURL.toString(),
                            fileName: 'gridInfo.zip',
                            chunkSize: 1024 * 1024 * 12,
                            threadNum: 4,
                            cb: (done: boolean, current: number, total: number) => {
                                if (done) {
                                    console.log('Download complete!');
                                    this.showLoading && this.showLoading(false)
                                    return
                                }
                                console.log(`Downloading... ${Math.round(current / total * 100)}%`)

                            }
                        })
                        fileDownloader.download()

                    }

                    // Core operation of Grid-Process-Model Run
                    const core = async () => {
                        try {
                            const completed = await fetchStatus()
                            if (completed) {
                                clearTimeout(timerID)
                                const { id, name } = await fetchResultJson()
                                fetchResultFile(id, name)
                                return
                            }
                            timerID = window.setTimeout(core, 2000)
                        }
                        catch (e) {
                            console.error(e)
                            clearTimeout(timerID)
                            this.showLoading && this.showLoading(false)
                        }
                    }

                    core()

                }).catch(() => {
                    console.warn(" Flask-Server:: Process Grid Error ")
                })

            }
        })

        // Init GPU resources ////////////////////////////////////////////////////////////

        const gl = this._gl

        gll.enableAllExtensions(gl)

        // Create shader
        this._edgeShader = await gll.createShader(gl, '/shaders/edge.glsl')
        this._edgeRibbonedShader = await gll.createShader(gl, '/shaders/edgeRibboned.glsl')
        this._pickingShader = await gll.createShader(gl, '/shaders/picking.glsl')
        this._gridLineShader = await gll.createShader(gl, '/shaders/gridLine.glsl')
        this._gridMeshShader = await gll.createShader(gl, '/shaders/gridMesh.glsl')

        // Set static uniform in shaders
        gl.useProgram(this._gridMeshShader)
        gl.uniform1i(gl.getUniformLocation(this._gridMeshShader, 'paletteTexture'), 0)

        gl.useProgram(this._edgeShader)
        gl.uniform1i(gl.getUniformLocation(this._edgeShader, 'paletteTexture'), 0)

        gl.useProgram(this._edgeRibbonedShader)
        gl.uniform1f(gl.getUniformLocation(this._edgeRibbonedShader, 'lineWidth'), 16)

        gl.useProgram(null)

        // Create edge storage buffer
        this._edgeStorageVAO = gl.createVertexArray()!
        // Max edge Size = maxGridNum * 4
        this._edgeStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 4 * 4 * 4, gl.DYNAMIC_DRAW)!

        gl.bindVertexArray(this._edgeStorageVAO)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._edgeStorageBuffer)
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 4 * 4, 0)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribDivisor(0, 1)

        gl.bindVertexArray(null)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        // Create ribboned edge buffer
        this._edgeRibbonedVAO = gl.createVertexArray()!
        this._edgeRibbonedBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 4 * 4 * 4, gl.DYNAMIC_DRAW)!
        gl.bindVertexArray(this._edgeRibbonedVAO)
        gl.bindBuffer(gl.ARRAY_BUFFER, this._edgeRibbonedBuffer)
        gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 4 * 4, 0);
        gl.enableVertexAttribArray(0)
        gl.vertexAttribDivisor(0, 1)

        gl.bindVertexArray(null)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        // Create grid storage buffer
        this._gridStorageVAO = gl.createVertexArray()!
        this._gridSignalBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 1, gl.DYNAMIC_DRAW)!

        this._gridTlStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridTrStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridBlStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
        this._gridBrStorageBuffer = gll.createArrayBuffer(gl, this.maxGridNum * 2 * 4, gl.DYNAMIC_DRAW)!
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

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridLevelStorageBuffer)
        gl.vertexAttribIPointer(4, 1, gl.UNSIGNED_BYTE, 1 * 1, 0)
        gl.enableVertexAttribArray(4)

        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
        gl.vertexAttribIPointer(5, 1, gl.UNSIGNED_BYTE, 1 * 1, 0)
        gl.enableVertexAttribArray(5)
        gl.vertexAttribIPointer(6, 1, gl.UNSIGNED_BYTE, 1 * 1, this.maxGridNum)
        gl.enableVertexAttribArray(6)

        gl.vertexAttribDivisor(0, 1)
        gl.vertexAttribDivisor(1, 1)
        gl.vertexAttribDivisor(2, 1)
        gl.vertexAttribDivisor(3, 1)
        gl.vertexAttribDivisor(4, 1)
        gl.vertexAttribDivisor(5, 1)
        gl.vertexAttribDivisor(6, 1)

        gl.bindVertexArray(null)
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        // Create texture
        this._paletteTexture = gll.createTexture2D(gl, 1, this.subdivideRules.length, 1, gl.RGB8)

        // Create picking pass
        this._pickingTexture = gll.createTexture2D(gl, 0, 1, 1, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]))
        this._pickingRBO = gll.createRenderBuffer(gl, 1, 1)
        this._pickingFBO = gll.createFrameBuffer(gl, [this._pickingTexture], 0, this._pickingRBO)!

        this._boxPickingTexture = gll.createTexture2D(gl, 0, gl.canvas.width, gl.canvas.height, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(gl.canvas.width * gl.canvas.height * 4).fill(0))
        this._boxPickingRBO = gll.createRenderBuffer(gl, gl.canvas.width, gl.canvas.height)
        this._boxPickingFBO = gll.createFrameBuffer(gl, [this._boxPickingTexture], 0, this._boxPickingRBO)!


        // Init palette texture (default in subdivider type)
        const colorList = new Uint8Array(this.subdivideRules.length * 3)
        for (let i = 0; i < this.subdivideRules.length; i++) {
            colorList.set([0, 127, 127], i * 3)
        }

        gll.fillSubTexture2DByArray(gl, this._paletteTexture, 0, 0, 0, this.subdivideRules.length, 1, gl.RGB, gl.UNSIGNED_BYTE, this.paletteColorList)

        // Init workers of gridRecorder ////////////////////////////////////////////////////////////

        this.gridRecorder.init(() => {

            this.gridRecorder.subdivideGrid(0, 0, (infos: any) => {

                this.updateGPUGrids(infos)

                // Raise flag when the root grid (level: 0, globalId: 0) has been subdivided
                this.initialized = true
                this.showLoading!(false)
            })
        })
    }

    removeUIHandler() {

        this.map
            .off('mouseup', this.mouseupHandler as any)
            .off('mousedown', this.mousedownHandler as any)
            .off('mousemove', this.mousemoveHandler as any)
            .off('mouseout', this.mouseoutHandler as any)
            .off('resize', this.resizeHandler as any)
    }

    addTopologyEditorUIHandler() {

        this.removeUIHandler()

        this.map
            .on('mouseup', this.mouseupHandler as any)
            .on('mousedown', this.mousedownHandler as any)
            .on('mousemove', this.mousemoveHandler as any)
            .on('mouseout', this.mouseoutHandler as any)
            .on('resize', this.resizeHandler as any)
    }

    addAttributeEditorUIHandler() {

        this.removeUIHandler()

        this.map
            .on('mouseup', this.mouseupHandler as any)
            .on('mousedown', this.mousedownHandler as any)
            .on('mousemove', this.mousemoveHandler as any)
            .on('mouseout', this.mouseoutHandler as any)
            .on('resize', this.resizeHandler as any)
    }

    hit(storageIds: number | number[], isMaintained = false) {

        const ids = Array.isArray(storageIds) ? storageIds : [storageIds]
        ids.forEach(storageId => {
            if (storageId < 0) return

            if (!isMaintained && this.hitSet.has(storageId)) {

                if (this.hitSet.size === 1) return
                this.hitSet.delete(storageId)

            } else {
                this.hitSet.add(storageId)
            }
        })
        this.map.triggerRepaint()
    }

    hitAttributeEditor() {

        if (!this.isTopologyParsed) return
        if (this.hitSet.size === 1) this._hitAttribute()
        else if (this.hitSet.size > 1) this._hitAttributes()
    }

    removeGrid(storageId: number) {
        this.gridRecorder.removeGrid(storageId, this.updateGPUGrid)
        this.map.triggerRepaint()
    }

    removeGrids(storageIds: number[]) {
        this.gridRecorder.removeGrids(storageIds, this.updateGPUGrids)
        this.map.triggerRepaint()
    }

    subdivideGrid(uuId: string) {
        const [level, globalId] = decodeInfo(uuId)
        this.gridRecorder.subdivideGrid(level, globalId, this.updateGPUGrids)
    }

    subdivideGrids(uuIds: string[]) {
        const infos = uuIds.map(uuId => decodeInfo(uuId)) as [level: number, globalId: number][]
        this.gridRecorder.subdivideGrids(infos, this.updateGPUGrids)
    }

    subdivideActiveGrids() {
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

        if (subdividableUUIDs.length === 1) {
            this.removeGrid(removableStorageIds[0])
            this.subdivideGrid(subdividableUUIDs[0])
        }
        else {
            this.removeGrids(removableStorageIds)
            this.subdivideGrids(subdividableUUIDs)
        }
        this.hitSet.clear()
    }

    deleteActiveGrids() {

        this.removeGrids(Array.from(this.hitSet))
        this.hitSet.clear()
    }

    clearActiveGrids() {

        this.hitSet.clear()
        this._updateHitFlag()
        this.map.triggerRepaint()
    }

    tickGrids() {

        // Highlight all hit grids //////////////////////////////

        if (this.hitSet.size === 0) return

        // Update hit flag for this current frame
        this._updateHitFlag()

        // Update grid signal buffer
        const gl = this._gl
        gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
        this.hitSet.forEach(hitStorageId => gl.bufferSubData(gl.ARRAY_BUFFER, hitStorageId, this.hitFlag, 0))
        gl.bindBuffer(gl.ARRAY_BUFFER, null)

        // Process editor actions //////////////////////////////

        if (this.EditorState.editor === "attribute") {
            this.hitAttributeEditor()
        }

        this.typeChanged = false
    }

    async initialize(_: Map, gl: WebGL2RenderingContext) {

        this._gl = gl
        await this.init()
    }

    render(gl: WebGL2RenderingContext, _: number[]) {

        // Skip if not ready
        if (!this.initialized || !this.gridRecorder.isReady) return

        if (!this.visible) return

        // Tick logic
        this.tickGrids()

        // Tick render
        if (!this.isTransparent) {

            // Mesh Pass
            this.drawGridMeshes()

            // Line or Edge Pass
            this.gridRecorder.edgeNum ? this.drawEdges() : this.drawGridLines()
        }

        // WebGL check
        gll.errorCheck(gl)

        // Update display of capacity
        this.uiOption.capacity = this.gridRecorder.gridNum
        this.capacityController.updateDisplay()
    }

    picking(e: MapMouseEvent, e2: MapMouseEvent | undefined = undefined) {

        let storageIds
        if (e2) { //box mode
            const canvas = this._gl.canvas as HTMLCanvasElement
            const box = genPickingBox(canvas, this._boxPickingStart!, this._boxPickingEnd!)
            storageIds = this._boxPicking(box)
        } else {
            storageIds = this._brushPicking(this._calcPickingMatrix(e))
        }
        return storageIds
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
        gl.uniform2fv(gl.getUniformLocation(this._gridMeshShader, 'relativeCenter'), this.relativeCenter)
        gl.uniform2fv(gl.getUniformLocation(this._gridMeshShader, 'centerLow'), this.layerGroup.centerLow)
        gl.uniform2fv(gl.getUniformLocation(this._gridMeshShader, 'centerHigh'), this.layerGroup.centerHigh)
        gl.uniform1f(gl.getUniformLocation(this._gridMeshShader, 'mode'), this.isTopologyParsed ? 1.0 : 0.0)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._gridMeshShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.gridRecorder.gridNum)
    }

    drawGridLines() {
        const gl = this._gl

        gl.disable(gl.BLEND)
        gl.disable(gl.DEPTH_TEST)

        gl.useProgram(this._gridLineShader)

        gl.bindVertexArray(this._gridStorageVAO)

        gl.uniform2fv(gl.getUniformLocation(this._gridLineShader, 'relativeCenter'), this.relativeCenter)
        gl.uniform2fv(gl.getUniformLocation(this._gridLineShader, 'centerLow'), this.layerGroup.centerLow)
        gl.uniform2fv(gl.getUniformLocation(this._gridLineShader, 'centerHigh'), this.layerGroup.centerHigh)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._gridLineShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)

        gl.drawArraysInstanced(gl.LINE_LOOP, 0, 4, this.gridRecorder.gridNum)
    }

    drawEdges() {

        const gl = this._gl

        // Draw common edges
        gl.disable(gl.DEPTH_TEST)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

        gl.useProgram(this._edgeShader)

        gl.bindVertexArray(this._edgeStorageVAO)

        gl.uniform2fv(gl.getUniformLocation(this._edgeShader, 'relativeCenter'), this.relativeCenter)
        gl.uniform2fv(gl.getUniformLocation(this._edgeShader, 'centerLow'), this.layerGroup.centerLow)
        gl.uniform2fv(gl.getUniformLocation(this._edgeShader, 'centerHigh'), this.layerGroup.centerHigh)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._edgeShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)

        gl.drawArraysInstanced(gl.LINE_STRIP, 0, 2, this.gridRecorder.edgeNum)

        // Draw ribboned edges (edges having been assigned)
        gl.useProgram(this._edgeRibbonedShader)

        gl.bindVertexArray(this._edgeRibbonedVAO)

        gl.uniform2fv(gl.getUniformLocation(this._edgeRibbonedShader, 'relativeCenter'), this.relativeCenter)
        gl.uniform2fv(gl.getUniformLocation(this._edgeRibbonedShader, 'centerLow'), this.layerGroup.centerLow)
        gl.uniform2fv(gl.getUniformLocation(this._edgeRibbonedShader, 'centerHigh'), this.layerGroup.centerHigh)
        gl.uniform2fv(gl.getUniformLocation(this._edgeRibbonedShader, 'viewport'), [gl.canvas.width, gl.canvas.height])
        gl.uniformMatrix4fv(gl.getUniformLocation(this._edgeRibbonedShader, 'uMatrix'), false, this.layerGroup.relativeEyeMatrix)

        gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this._assignedEdges.length)
    }

    remove(_: Map, __: WebGL2RenderingContext) {
    }

    show() {
        this.visible = true
    }

    hide() {
        this.visible = false
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

        gl.uniform2fv(gl.getUniformLocation(this._pickingShader, 'relativeCenter'), this.relativeCenter)
        gl.uniform2fv(gl.getUniformLocation(this._pickingShader, 'centerLow'), this.layerGroup.centerLow)
        gl.uniform2fv(gl.getUniformLocation(this._pickingShader, 'centerHigh'), this.layerGroup.centerHigh)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._pickingShader, 'pickingMatrix'), false, pickingMatrix)
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

        gl.bindFramebuffer(gl.FRAMEBUFFER, this._boxPickingFBO)
        gl.viewport(0, 0, canvasWidth, canvasHeight)

        gl.clearColor(1.0, 1.0, 1.0, 1.0)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

        gl.disable(gl.BLEND)

        gl.depthFunc(gl.LESS)
        gl.enable(gl.DEPTH_TEST)

        gl.useProgram(this._pickingShader)

        gl.bindVertexArray(this._gridStorageVAO)

        gl.uniform2fv(gl.getUniformLocation(this._pickingShader, 'relativeCenter'), this.relativeCenter)
        gl.uniform2fv(gl.getUniformLocation(this._pickingShader, 'centerLow'), this.layerGroup.centerLow)
        gl.uniform2fv(gl.getUniformLocation(this._pickingShader, 'centerHigh'), this.layerGroup.centerHigh)
        gl.uniformMatrix4fv(gl.getUniformLocation(this._pickingShader, 'pickingMatrix'), false, boxPickingMatrix)
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

    private _hitAttribute() {

        const [gridStorageId] = this.hitSet
        const [top, left, bottom, right] = this.gridRecorder.getEdgeInfoByStorageId(+gridStorageId)
        this.updateAttrSetter({ gridStorageId, top, left, bottom, right })
    }

    private _hitAttributes() {

        const gridStorageIds = Array.from(this.hitSet)
        this.updateAttrSetter({ gridStorageId: gridStorageIds })
    }

    private _updateGPUGrid(info?: [storageId: number, level: number, vertices: Float32Array]) {

        if (info) {
            this.writeGridInfoToStorageBuffer(info)
            this._gl.flush()
        }
        this.map.triggerRepaint()
    }

    private _updateGPUGrids(infos?: [fromStorageId: number, levels: Uint8Array, vertices: Float32Array]) {

        if (infos) {
            this.writeMultiGridInfoToStorageBuffer(infos)
            this._gl.flush()
        }
        this.map.triggerRepaint()
    }

    private _updateGPUEdges(fromStorageId: number, vertexBuffer: Float32Array) {

        const gl = this._gl
        const vertexByteStride = 4 * 4
        gl.bindBuffer(gl.ARRAY_BUFFER, this._edgeStorageBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, fromStorageId * vertexByteStride, vertexBuffer)

        gl.bindBuffer(gl.ARRAY_BUFFER, null)


        this.map.triggerRepaint()
    }

    private _calcPickingMatrix(e: MapMouseEvent) {
        const canvas = this._gl.canvas as HTMLCanvasElement
        const rect = canvas.getBoundingClientRect()
        
        const offsetX = e.originalEvent.clientX - rect.left
        const offsetY = e.originalEvent.clientY - rect.top

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

    private _mousedownHandler(e: MapMouseEvent) {

        if (this.EditorState.editor === "topology" || this.EditorState.editor === "attribute") {
            if (e.originalEvent.shiftKey && e.originalEvent.button === 0 && this.EditorState.tool === 'brush') {
                this.isShiftClick = true
                this.map.dragPan.disable()
            }
            //// ADDON 
            if (e.originalEvent.shiftKey && e.originalEvent.button === 0 && this.EditorState.tool === 'box') {
                this.isShiftClick = true
                this.map.dragPan.disable()
                this.map.scrollZoom.disable()
                this._boxPickingStart = e
                this._boxPickingEnd = e
            }
        }

    }

    private _mouseupHandler(e: MapMouseEvent) {

        if (this.EditorState.editor === "topology" || this.EditorState.editor === "attribute") {

            if (this.isShiftClick) {

                this.map.dragPan.enable()
                this.map.scrollZoom.enable()

                let e1, e2
                if (this.EditorState.tool === 'brush') {
                    e1 = e
                    e2 = undefined
                } else {
                    this._boxPickingEnd = e
                    e1 = this._boxPickingStart!
                    e2 = this._boxPickingEnd
                }

                const storageIds = this.picking(e1, e2)
                if (this.EditorState.mode === 'check') {
                    const storageId = Array.isArray(storageIds) ? storageIds[0] : storageIds
                    console.log(this.gridRecorder.checkGrid(storageId))

                } else {

                    this.hit(storageIds, true)
                }

                clear(this._ctx!)
                this._boxPickingStart = null
                this._boxPickingEnd = null
                this.isShiftClick = false
            }
        }
    }

    private _mousemoveHandler(e: MapMouseEvent) {

        if (this.EditorState.editor === "topology") {
            if (this.isShiftClick && this.EditorState.tool === 'brush') {
                this.map.dragPan.disable()
                const storageId = this.picking(e) as number
                if (this.lastPickedId === storageId) return
                this.lastPickedId = storageId
                this.hit(storageId)
            }

            if (this.isShiftClick && this.EditorState.tool === 'box' && this._boxPickingStart) {
                // Render the picking box
                this._boxPickingEnd = e
                const canvas = this._gl.canvas as HTMLCanvasElement
                const box = genPickingBox(canvas, this._boxPickingStart, this._boxPickingEnd!)
                drawRectangle(this._ctx!, box)
            }
        }
        else if (this.EditorState.editor === "attribute") {
            if (this.isShiftClick && this.EditorState.tool === 'box' && this._boxPickingStart) {
                // Render the picking box
                this._boxPickingEnd = e
                const canvas = this._gl.canvas as HTMLCanvasElement
                const box = genPickingBox(canvas, this._boxPickingStart, this._boxPickingEnd!)
                drawRectangle(this._ctx!, box)
            }
        }
    }

    private _mouseoutHandler(e: MapMouseEvent) {

        if (this.isShiftClick && this.EditorState.tool === 'box') {

            this._boxPickingEnd = e

            const storageIds = this.picking(this._boxPickingStart!, this._boxPickingEnd!)
            this.hit(storageIds)

            // Reset
            clear(this._ctx!)
            this._boxPickingStart = null
            this._boxPickingEnd = null

        }
        this.map.dragPan.enable()
        this.map.scrollZoom.enable()
        this.isShiftClick = false
    }

    private _resizeHandler() {

        // Resize canvas 2d
        const canvas = this._ctx!.canvas
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth
            canvas.height = canvas.clientHeight
        }
    }

    private _handleStateGet(target: Record<string, string>, prop: string): string {
        return Reflect.get(target, prop)
    }

    private _handleStateSet(target: Record<string, string>, prop: string, value: string): boolean {

        if (!(prop in target))
            throw new Error(`Property ${prop} does not exist on editorControl`)

        target[prop] = value
        switch (prop) {
            case 'editor':
                console.log('Set editor ', value)
                this.typeChanged = true
                switch (value) {
                    case 'topology':

                        this.clearActiveGrids()

                        this.attrSetter!.style.display = 'none'
                        const pannel = document.querySelector('#pannel') as HTMLDivElement
                        pannel.style.height = '200px'
                        
                        // Reset state, attr cache, gridSignalBuffer
                        this.isTopologyParsed = false
                        this.gridRecorder.resetEdges()
                        this.gridRecorder.resetGrids()
                        this.addTopologyEditorUIHandler()

                        break

                    case 'attribute':
                        
                        this.clearActiveGrids()

                        this.addAttributeEditorUIHandler()
                        this.showLoading!(true)

                        interface BufferInfoItem {
                            fromStorageId: number;
                            vertexBuffer: Float32Array;
                        }

                        const bufferInfo: BufferInfoItem[] = [];
                        this.gridRecorder.parseGridTopology((isCompleted: boolean, fromStorageId: number, vertexBuffer: Float32Array) => {

                            this.updateGPUEdges(fromStorageId, vertexBuffer)
                            bufferInfo.push({ fromStorageId, vertexBuffer })

                            if (!isCompleted) return

                            this._vertexBuffer = new Float32Array(this.gridRecorder.edgeNum * 4).fill(0)
                            this._assignedEdges = []
                            bufferInfo.forEach((info) => {
                                this._vertexBuffer.set(info.vertexBuffer, info.fromStorageId * 4)
                            })

                            this.isTopologyParsed = true
                            this.showLoading!(false)
                            this.updateAttrSetter({
                                top: [],
                                left: [],
                                bottom: [],
                                right: [],
                                gridStorageId: -1
                            })
                            this.attrSetter!.style.display = 'block'
                            const pannel = document.querySelector('#pannel') as HTMLDivElement
                            pannel.style.height = '400px'

                            console.log(" ====Topology Parsed==== ")
                        })
                        this.map.triggerRepaint()
                        break
                }
                this.map.triggerRepaint()
                break

            case 'tool':
                console.log('set tool ', value)
                // Do nothing extra
                break

            case 'mode':
                // console.log('set mode ', value)
                // Do nothing extra
                break
        }
        return true
    }

    private _handleAttrEdgeClick(e: MouseEvent) {

        if ((e.target as HTMLDivElement).classList.contains("edge")) {
            // deactive last actived element
            if (this.activeAttrFeature.dom) {
                this.activeAttrFeature.dom.classList.remove("actived")
            }
            const attrTypeDom = document.querySelector('#attr_type') as HTMLDivElement
            attrTypeDom.textContent = 'Edge'

                ; (e.target as HTMLDivElement).classList.add("actived")
            const eID = (e.target as HTMLDivElement).dataset.eid
            this.activeAttrFeature.dom = e.target as HTMLDivElement
            this.activeAttrFeature.id = Number(eID)
            this.activeAttrFeature.t = 1
            const [height, type] = this._getInfoFromCache(this.activeAttrFeature.id, this.activeAttrFeature.t)
            this.activeAttrFeature.height = height
            this.activeAttrFeature.type = type

                ; (document.querySelector('#height') as HTMLInputElement).value = height + ''
                ; (document.querySelector('#type') as HTMLInputElement).value = type + ''

        }
    }

    private _handleAttrSetterKeyDown(_: KeyboardEvent) {

        const [heightVal, typeVal] = [
            (document.querySelector('#height') as HTMLInputElement).value,
            (document.querySelector('#type') as HTMLInputElement).value
        ]
        this.activeAttrFeature.height = +heightVal
        this.activeAttrFeature.type = +typeVal

        if (!Array.isArray(this.activeAttrFeature.id)) {
            this._setCacheInfo(this.activeAttrFeature.id, this.activeAttrFeature.t, this.activeAttrFeature.height, this.activeAttrFeature.type)
        } else {
            this._setCacheBatchInfo(this.activeAttrFeature.id, this.activeAttrFeature.t, this.activeAttrFeature.height, this.activeAttrFeature.type)
        }

        this.map.triggerRepaint()
    }


    private initAttrSetter(info: any) {

        // Parse grid and edge info ////////////////////////////////////////
        const { gridStorageId, top, left, bottom, right } = info

        // Default: grid clicked
        const [height, type] = this._getInfoFromCache(gridStorageId, 0) // 0 grid, 1 edge
        this.activeAttrFeature.id = gridStorageId
        this.activeAttrFeature.dom = null
        this.activeAttrFeature.t = 0
        this.activeAttrFeature.height = height
        this.activeAttrFeature.type = type

        // Set HTML //////////////////////////////////////////////////
        const html = genAttrEditorHTML({ top, left, bottom, right }, { id: gridStorageId, height, type })
        const attrSetter = this.attrSetter = document.createElement('div')
        attrSetter.id = 'attrSetter'
        attrSetter.classList.add("property-editor")
        attrSetter.innerHTML = html
        
        // Add attrSetter to control-panel-container
        const controlPanelContainer = document.querySelector('#control-panel-container')
        if (controlPanelContainer) {
            controlPanelContainer.appendChild(attrSetter)
        } else {
            document.body.appendChild(attrSetter)
        }

        //////// Set Handler
        const edgeDom = this.edgeDom = document.querySelector('#edges') as HTMLDivElement
        const handleEdgeClick = this._handleAttrEdgeClick.bind(this)
        edgeDom.addEventListener('click', handleEdgeClick)

        // Grid click 
        const attrTypeDom = document.querySelector('#attr_type') as HTMLDivElement
        attrTypeDom.addEventListener('click', e => {

            if (this.EditorState.tool === 'box') return
            if (this.activeAttrFeature.dom) {
                this.activeAttrFeature.dom.classList.remove("actived")
            }
            this.activeAttrFeature.dom = (e.target as HTMLDivElement)
            this.activeAttrFeature.id = +(e.target as HTMLDivElement).dataset.id!
            this.activeAttrFeature.t = 0
            const [height, type] = this._getInfoFromCache(this.activeAttrFeature.id, this.activeAttrFeature.t)
            this.activeAttrFeature.height = height
            this.activeAttrFeature.type = type
            attrTypeDom.textContent = "Grid"

                ; (document.querySelector('#height') as HTMLInputElement).value = height + ''
                ; (document.querySelector('#type') as HTMLInputElement).value = type + ''
        })

        // Input commit when 'enter' down
        const handleAttrSetterKeyDown = this._handleAttrSetterKeyDown.bind(this)
        this.attrSetter.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleAttrSetterKeyDown(e)
        })

        this.attrSetter.style.display = 'none'
    }

    private updateAttrSetter(info: any) {

        if (this.hitSet.size > 1) {
            const gridStorageIds = info.gridStorageId

            this.activeAttrFeature.id = gridStorageIds
            this.activeAttrFeature.dom = null
            this.activeAttrFeature.t = 0
            this.activeAttrFeature.height = -9999
            this.activeAttrFeature.type = 0

            // Reset grid dom data-id and input value
            const attrTypeDom = document.querySelector('#attr_type') as HTMLDivElement
            attrTypeDom.dataset.id = '-1'
            attrTypeDom.textContent = 'Grid'

            const topHtml = genEdgeHTML("top", [])
            const leftHtml = genEdgeHTML("left", [])
            const bottomHtml = genEdgeHTML("bottom", [])
            const rightHtml = genEdgeHTML("right", [])

            const edgesInnerHtml = `
                ${topHtml}
                ${leftHtml}
                ${bottomHtml}
                ${rightHtml}
            `
            const edgesDom = document.querySelector('#edges') as HTMLDivElement
            edgesDom.innerHTML = edgesInnerHtml

                ; (document.querySelector('#height') as HTMLInputElement).value = -9999 + ''
                ; (document.querySelector('#type') as HTMLInputElement).value = 0 + ''

        } else if (this.hitSet.size === 1) {

            // Parse grid and edge info
            const { top, left, bottom, right, gridStorageId } = info

            // Reset default :: grid clicked
            const [height, type] = this._getInfoFromCache(gridStorageId, 0) // 0 grid, 1 edge
            this.activeAttrFeature.id = gridStorageId
            this.activeAttrFeature.dom = null
            this.activeAttrFeature.t = 0
            this.activeAttrFeature.height = height
            this.activeAttrFeature.type = type

            // Reset grid dom data-id and input value
            const attrTypeDom = document.querySelector('#attr_type') as HTMLDivElement
            attrTypeDom.dataset.id = gridStorageId
            attrTypeDom.textContent = 'Grid'

                ; (document.querySelector('#height') as HTMLInputElement).value = height + ''
                ; (document.querySelector('#type') as HTMLInputElement).value = type + ''

            // Reset edges dom
            const topHtml = genEdgeHTML("top", top as number[])
            const leftHtml = genEdgeHTML("left", left as number[])
            const bottomHtml = genEdgeHTML("bottom", bottom as number[])
            const rightHtml = genEdgeHTML("right", right as number[])

            const edgesInnerHtml = `
                ${topHtml}
                ${leftHtml}
                ${bottomHtml}
                ${rightHtml}
                `
            const edgesDom = document.querySelector('#edges') as HTMLDivElement
            edgesDom.innerHTML = edgesInnerHtml
        }
    }

    private _getInfoFromCache(ID: number, T: number) {
        let height = -9999, type = 0
        if (!this.isTopologyParsed || ID < 0) return [height, type]

        if (T === 0) {
            height = this.gridRecorder.grid_attribute_cache[ID].height
            type = this.gridRecorder.grid_attribute_cache[ID].type
        } else {
            height = this.gridRecorder.edge_attribute_cache[ID].height
            type = this.gridRecorder.edge_attribute_cache[ID].type
        }

        return [height, type]
    }

    private _setCacheInfo(ID: number, T: number, height: number, type: number) {
        if (!this.isTopologyParsed) {
            throw "Topology Not Parsed!!" //never
        }

        // Valid test !
        if (height < -9999 || height > 9999) {
            alert("Height out of range [-9999, 9999] !!")
            console.error("Height out of range [-9999, 9999] !!")
                ; (document.querySelector('#height') as HTMLInputElement).value = '0'
        }
        if (type < 0 || type > 10) {
            alert("type out of range [0, 10] !!")
            console.error("type out of range [0, 10] !")
                ; (document.querySelector('#type') as HTMLInputElement).value = '0'
        }

        if (T === 0) {
            this.gridRecorder.grid_attribute_cache[ID].height = height
            this.gridRecorder.grid_attribute_cache[ID].type = type

            // Make grid assigned in GPU
            const gl = this._gl
            gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
            gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum * 1 + ID, new Uint8Array([1]))
            gl.bindBuffer(gl.ARRAY_BUFFER, null)

        } else {
            this.gridRecorder.edge_attribute_cache[ID].height = height
            this.gridRecorder.edge_attribute_cache[ID].type = type

            // Update array of assigned edges
            if (this._vertexBuffer !== null) {
                for (let i = 0; i < 4; i++) {
                    if (!this._assignedEdges.includes(ID)) {
                        this._assignedEdges.push(ID);
                    }
                }
            }

            this._updateRibbonedEdges();
        }

    }

    private _setCacheBatchInfo(IDs: number[], T: number = 0, height: number, type: number) {

        if (!this.isTopologyParsed) {
            throw "Topology Not Parsed!!" //never
        }
        if (T === 0) {
            IDs.forEach(ID => {
                this.gridRecorder.grid_attribute_cache[ID].height = height
                this.gridRecorder.grid_attribute_cache[ID].type = type
            })

            // Make grids assigned in GPU
            const gl = this._gl
            const assignedFlag = new Uint8Array([1])

            gl.bindBuffer(gl.ARRAY_BUFFER, this._gridSignalBuffer)
            IDs.forEach(ID => gl.bufferSubData(gl.ARRAY_BUFFER, this.maxGridNum * 1 + ID, assignedFlag))
            gl.bindBuffer(gl.ARRAY_BUFFER, null)

        } else {
            IDs.forEach(ID => {
                this.gridRecorder.edge_attribute_cache[ID].height = height
                this.gridRecorder.edge_attribute_cache[ID].type = type
                // update array of assigned edges
                if (this._vertexBuffer !== null) {
                    for (let i = 0; i < 4; i++) {
                        if (!this._assignedEdges.includes(ID)) {
                            this._assignedEdges.push(ID);
                        }
                    }
                }
            })

            this._updateRibbonedEdges();
        }

    }

    private _updateRibbonedEdges() {
        
        const tempArray: number[] = []
        this._assignedEdges.forEach((ID) => {
            for (let i = 0; i < 4; i++) {
                tempArray.push(this._vertexBuffer[ID * 4 + i])
            }
        })
        const ribbonedEdgeBuffer = new Float32Array(tempArray)
        const gl = this._gl
        gl.bindBuffer(gl.ARRAY_BUFFER, this._edgeRibbonedBuffer)
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, ribbonedEdgeBuffer)
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

    // Fast function to upload one grid rendering info to GPU stograge texture
    /** @deprecated */
    writeGridInfoToTexture(info: [storageId: number, level: number, vertices: Float32Array]) {

        const gl = this._gl
        const [storageId, level, vertices] = info
        const storageU = storageId % this.storageTextureSize
        const storageV = Math.floor(storageId / this.storageTextureSize)

        gll.fillSubTexture2DArrayByArray(gl, this._storageTextureArray, 0, storageU, storageV, 0, 1, 1, 4, gl.RG, gl.FLOAT, vertices)
        gll.fillSubTexture2DByArray(gl, this._levelTexture, 0, storageU, storageV, 1, 1, gl.RED_INTEGER, gl.UNSIGNED_SHORT, new Uint16Array([level]))
    }

    /** @deprecated */
    writeMultiGridInfoToTexture(infos: [fromStorageId: number, toStorageId: number, levels: Uint16Array, vertices: Float32Array]) {

        const gl = this._gl
        const [fromStorageId, toStorageId, levels, vertices] = infos

        const fromStorageU = fromStorageId % this.storageTextureSize
        const fromStorageV = Math.floor(fromStorageId / this.storageTextureSize)

        const toStorageU = toStorageId % this.storageTextureSize
        const toStorageV = Math.floor(toStorageId / this.storageTextureSize)

        const updateBlockHeight = toStorageV - fromStorageV + 1

        // FromStorageId and ToStorageId are on the same row of the storage texture
        if (updateBlockHeight === 1) {

            const updateBlockWidth = toStorageU - fromStorageU + 1
            gll.fillSubTexture2DArrayByArray(gl, this._storageTextureArray, 0, fromStorageU, fromStorageV, 0, updateBlockWidth, updateBlockHeight, 4, gl.RG, gl.FLOAT, vertices)
            gll.fillSubTexture2DByArray(gl, this._levelTexture, 0, fromStorageU, fromStorageV, updateBlockWidth, updateBlockHeight, gl.RED_INTEGER, gl.UNSIGNED_SHORT, levels)

        } else {

            const gridCount = vertices.length / 8
            const fullBlockRows = Math.max(updateBlockHeight - 2, 0)

            // Pre-allocate memory for a Float32Array that can satisfy all three updated situations
            const size_within_fromStorageU_textureSize = this.storageTextureSize - fromStorageU
            const size_within_fromStorageV_toStorageV = this.storageTextureSize * fullBlockRows
            const size_within_0_toStorageU = toStorageU + 1

            // Use the maximum size to allocate this memory
            const subBlockSize = Math.max(size_within_0_toStorageU, Math.max(size_within_fromStorageU_textureSize, size_within_fromStorageV_toStorageV))
            const subVertices = new Float32Array(subBlockSize * 8)

            // Update grid info for situation 1 //////////////////////////////////////////////////
            let srcOffset = 0
            let updateBlockWidth = this.storageTextureSize - fromStorageU
            let elementSize = updateBlockWidth * 2
            for (let i = 0; i < 4; i++) {
                const offset = (gridCount * i + srcOffset) * 2
                subVertices.set(vertices.subarray(offset, offset + elementSize), i * elementSize)
            }
            gll.fillSubTexture2DArrayByArray(gl, this._storageTextureArray, 0, fromStorageU, fromStorageV, 0, updateBlockWidth, 1, 4, gl.RG, gl.FLOAT, subVertices)
            gll.fillSubTexture2DByArray(gl, this._levelTexture, 0, fromStorageU, fromStorageV, updateBlockWidth, 1, gl.RED_INTEGER, gl.UNSIGNED_SHORT, levels, srcOffset)

            // Update grid info for situation 2 //////////////////////////////////////////////////
            srcOffset += updateBlockWidth
            if (fullBlockRows > 0) {

                updateBlockWidth = this.storageTextureSize
                elementSize = updateBlockWidth * fullBlockRows * 2
                for (let i = 0; i < 4; i++) {
                    const offset = (gridCount * i + srcOffset) * 2
                    subVertices.set(vertices.subarray(offset, offset + elementSize), i * elementSize)
                }
                gll.fillSubTexture2DArrayByArray(gl, this._storageTextureArray, 0, 0, fromStorageV + 1, 0, updateBlockWidth, fullBlockRows, 4, gl.RG, gl.FLOAT, subVertices)
                gll.fillSubTexture2DByArray(gl, this._levelTexture, 0, 0, fromStorageV + 1, updateBlockWidth, fullBlockRows, gl.RED_INTEGER, gl.UNSIGNED_SHORT, levels, srcOffset)
            }

            // Update grid info for situation 3 //////////////////////////////////////////////////
            srcOffset += updateBlockWidth * fullBlockRows
            updateBlockWidth = toStorageU + 1
            elementSize = updateBlockWidth * 2
            for (let i = 0; i < 4; i++) {
                const offset = (gridCount * i + srcOffset) * 2
                subVertices.set(vertices.subarray(offset, offset + elementSize), i * elementSize)
            }
            gll.fillSubTexture2DArrayByArray(gl, this._storageTextureArray, 0, 0, toStorageV, 0, updateBlockWidth, 1, 4, gl.RG, gl.FLOAT, subVertices)
            gll.fillSubTexture2DByArray(gl, this._levelTexture, 0, 0, toStorageV, updateBlockWidth, 1, gl.RED_INTEGER, gl.UNSIGNED_SHORT, levels, srcOffset)
        }
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
function genPickingBox(canvas: HTMLCanvasElement, startEvent: MapMouseEvent, endEvent: MapMouseEvent) {
    const rect = canvas.getBoundingClientRect()
    const _pickingBox = [
        startEvent.originalEvent.clientX - rect.left,
        startEvent.originalEvent.clientY - rect.top,
        endEvent.originalEvent.clientX - rect.left,
        endEvent.originalEvent.clientY - rect.top
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

function genEdgeHTML(edgeSide: string, edgeIds: Array<number>) {
    const rowcol = edgeSide === "top" || edgeSide === "bottom" ? "row" : "col"
    let html = `<div class="${edgeSide} ${rowcol}" id="${edgeSide}">\n`
    edgeIds.forEach(eId => {
        html += `<div class="edge" data-eId="${eId}"></div>\n`
    })
    html += "</div>\n"
    return html
}

function genAttrEditorHTML(edgeInfo: any, initGridInfo: { id: number, height: number, type: number }) {

    const topHtml = genEdgeHTML("top", edgeInfo.top)
    const leftHtml = genEdgeHTML("left", edgeInfo.left)
    const bottomHtml = genEdgeHTML("bottom", edgeInfo.bottom)
    const rightHtml = genEdgeHTML("right", edgeInfo.right)

    const edgesHtml = `
            <div id="edges">
                ${topHtml}
                ${leftHtml}
                ${bottomHtml}
                ${rightHtml}
            </div>
        `
    const propHtml = `
            <div class="property col">
              <div class="property-type f-center" id="attr_type" data-ID="${initGridInfo.id}">Grid</div>
              <div class="property-block row ">
                <div class="text">height</div>
                <input class="property-input" type="number" id="height" value="${initGridInfo.height}">
              </div>
              <div class="property-block row ">
                <div class="text">type</div>
                <input class="property-input" type="number" id="type" value="${initGridInfo.type}">
              </div>
            </div>
        `
    const html = `
            ${edgesHtml}
            ${propHtml}
        `
    return html
}

function initLoadingDOM() {
    const loadingDom = document.createElement('div')
    loadingDom.id = 'loading-container'
    loadingDom.innerHTML = `
        <div class="loading"></div>
        <div class="loading-text">Loading ...</div>
    `
    loadingDom.style.display = 'none'
    document.body.appendChild(loadingDom)

    return (show: boolean) => {
        loadingDom.style.display = show ? 'block' : 'none'
    }
}
