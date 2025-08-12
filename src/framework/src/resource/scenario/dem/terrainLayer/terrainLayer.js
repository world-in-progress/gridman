import { mat4, vec4, vec3 } from "gl-matrix"
// import gll from '@/core/gl/glLib'
import gll from '../../../../core/gl/glLib'
// import * as dat from 'dat.gui'

const { createShader, enableAllExtensions, createTexture2D, loadImage, createArrayBuffer, createIndexBuffer, createFrameBuffer } = gll

class LRUCache {
    constructor(capacity) {
        this.capacity = capacity;
        this.cache = {};
        this.keys = [];
    }

    get(key) {
        if (key in this.cache) {
            // 如果键存在，将其移动到数组的末尾
            this.keys.splice(this.keys.indexOf(key), 1);
            this.keys.push(key);
            return this.cache[key];
        }
        return 0; // 如果键不在缓存中，返回0
    }

    put(key, value) {
        if (key in this.cache) {
            // 如果键已存在，更新其值并将其移动到数组的末尾
            this.keys.splice(this.keys.indexOf(key), 1);
        } else if (Object.keys(this.cache).length >= this.capacity) {
            // 如果缓存已满，移除数组开头的键（最早加入的键）
            const oldestKey = this.keys.shift();
            delete this.cache[oldestKey];
        }
        // 将新键值对添加到缓存和数组的末尾
        this.cache[key] = value;
        this.keys.push(key);
    }
}


export default class TerrainByProxyTile {

    constructor(_id, _source, _bbox, _elevationRange = [0, 500], _params) {

        this.id = _id;
        this.source = _source;
        this.type = 'custom'
        this.renderingMode = '3d'
        this.frame = 0.0
        this.debugKey = ''

        this.bbox = _bbox

        this.isReady = false

        this.canvasWidth = 0
        this.canvasHeight = 0

        this.altitudeDeg = 45.0
        this.azimuthDeg = 135.0
        this.u_offset_x = 1.5
        this.u_offset_y = 1.5
        this.exaggeration = 1
        this.opacity = 80
        this.palette = 0
        this.reversePalette = false
        this.withLighting = 1.0
        this.elevationRange = _elevationRange
        // this.elevationRange = [-15.514, 10.0]
        this.diffPower = 1.1
        this.use_skirt = 1.0

        this.shallowColor = [50, 25, 0];
        this.deepColor = [175, 175, 175];

        this.LightPos = [-0.1, -0.12, 0.25]
        this.ep = -3
        // this.smoothingPassCount = 3
        this.smoothingPassCount = 0

        // this.loadSettings();
        this.defaultParams = _params;

        this.modelConfig = null
        this.modelPositions = [];


        window.addEventListener('keydown', (event) => {
            this.debugKey = event.key
            this.map.triggerRepaint()

            if (this.debugKey === 'w') {
                this.map.showTerrainWireframe = !this.map.showTerrainWireframe
            }
        })
    }

    initProxy(map) {
        map.addSource(this.id + "-underwater-dem", {
            'type': 'raster-dem',
            tiles: [this.source],
            'tileSize': 256,
            'maxzoom': 14
        })

        map.setTerrain({ 'source': this.id + "-underwater-dem", 'exaggeration': this.exaggeration })
    }

    initGUI() {


        this._shallowColor = `rgb(${this.shallowColor[0]}, ${this.shallowColor[1]}, ${this.shallowColor[2]})`
        this._deepColor = `rgb(${this.deepColor[0]}, ${this.deepColor[1]}, ${this.deepColor[2]})`
        this.LightPosX = this.LightPos[0]
        this.LightPosY = this.LightPos[1]
        this.LightPosZ = this.LightPos[2]


        // this.gui = new dat.GUI()
        // this.gui.add(this, 'exaggeration', 0, 100).step(1).onChange((value) => { this.map.setTerrain({ 'exaggeration': value }); this.map.triggerRepaint(); })
        // this.gui.add(this, 'withLighting', 0, 1).step(1).onChange(() => { })


        // this.gui.addColor(this, '_shallowColor').name('deepColor').onChange(value => { this.shallowColor = parseRGB(value) })
        // this.gui.addColor(this, '_deepColor').name('shallowColor').onChange(value => { this.deepColor = parseRGB(value) })

        // this.gui.add(this, 'LightPosX', -1, 1, 0.01).onChange(value => { this.LightPos[0] = value })
        // this.gui.add(this, 'LightPosY', -1, 1, 0.01).onChange(value => { this.LightPos[1] = value })
        // this.gui.add(this, 'LightPosZ', 0, 2, 0.01).onChange(value => { this.LightPos[2] = value })

        // this.gui.add(this, "ep", -3.0, 3.0, 1.0).onChange(() => { })
        // this.gui.add(this, "smoothingPassCount", 0, 8, 1).onChange(() => { })
        // this.gui.add(this, "use_skirt", 0, 1, 1).onChange(() => { })
        // this.gui.add(this, 'u_offset_x', -5, 5, 0.1).onChange(() => { })
        // this.gui.add(this, 'u_offset_y', -5, 5, 0.1).onChange(() => { })

        // this.gui.domElement.style.position = 'absolute';
        // this.gui.domElement.style.top = '10vh';
        // this.gui.domElement.style.right = '1vw';
    }


    /**
     * 
     * @param {*} map 
     * @param {WebGL2RenderingContext} gl 
     */
    async onAdd(map, gl) {
        this.map = map
        this.gl = gl
        enableAllExtensions(gl)
        this.demStore = new LRUCache(100)
        this.initGUI()

        this.initProxy(map)

        this.canvasWidth = gl.canvas.width
        this.canvasHeight = gl.canvas.height

        ///////////////////////////////////////////////////
        ///////////////// Load shaders

        this.maskProgram = await createShader(gl, '/shaders/dems/mask.glsl')
        this.meshProgram = await createShader(gl, '/shaders/dems/mesh.glsl')
        this.smoothingProgram = await createShader(gl, '/shaders/dems/smoothing.glsl')
        this.showProgram = await createShader(gl, '/shaders/dems/show.glsl')
        this.debugProgram = await createShader(gl, '/shaders/dems/debug.glsl')

        ///////////////////////////////////////////////////
        ///////////////// create textures
        /// mask pass ///
        this.maskTexture = createTexture2D(gl, 0, this.canvasWidth, this.canvasHeight, gl.R8, gl.RED, gl.UNSIGNED_BYTE)

        /// mesh pass ///
        this.meshTexture = createTexture2D(gl, 0, this.canvasWidth, this.canvasHeight, gl.RGBA32F, gl.RGBA, gl.FLOAT)
        const depthTexture = this.meshDepthTexture = createTexture2D(gl, 0, this.canvasWidth, this.canvasHeight, gl.DEPTH_COMPONENT32F, gl.DEPTH_COMPONENT, gl.FLOAT)
        this.emptyDEMTexture = createTexture2D(gl, 0, 1, 1, gl.R32F, gl.RED, gl.FLOAT, new Float32Array([this.elevationRange[0]]))

        /// smoothing pass ///
        this.smoothingTexture = createTexture2D(gl, 0, this.canvasWidth, this.canvasHeight, gl.RGBA32F, gl.RGBA, gl.FLOAT)
        this.tempSmoothingTexture = createTexture2D(gl, 0, this.canvasWidth, this.canvasHeight, gl.RGBA32F, gl.RGBA, gl.FLOAT);

        this.finalMeshTexture = null

        /// show pass ///
        // const paletteBitmap = await loadImage('/underwater/images/contourPalette1D.png')
        const paletteBitmap = await this.getPaletteImage(this.palette)
        this.paletteTexture = createTexture2D(gl, 0, paletteBitmap.width, paletteBitmap.height, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paletteBitmap)

        ///////////////////////////////////////////////////
        ///////////////// Prepare buffers

        //// mask pass ////
        this.maskFbo = createFrameBuffer(gl, [this.maskTexture], null, null)

        const { vertexData, indexData } = parseBBOX(this.bbox)

        let maskPosBuffer = createArrayBuffer(gl, new Float32Array(vertexData))
        let maskIdxBuffer = createIndexBuffer(gl, new Uint16Array(indexData)) //Uint16 --> gl.UNSIGNED_SHORT
        this.maskElements = indexData.length

        this.maskVao = gl.createVertexArray()
        gl.bindVertexArray(this.maskVao)
        gl.enableVertexAttribArray(0)
        gl.bindBuffer(gl.ARRAY_BUFFER, maskPosBuffer)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, maskIdxBuffer)
        gl.bindVertexArray(null)


        //// mesh Pass ////
        // let renderBuffer = createRenderBuffer(gl, this.canvasWidth, this.canvasHeight)
        this.meshFbo = createFrameBuffer(gl, [this.meshTexture], this.meshDepthTexture, null)

        const { meshElements: meshElements_128, meshVao: meshVao_128 } = this.createTerrainGridsVao(128)
        this.meshElements_128 = meshElements_128
        this.meshVao_128 = meshVao_128

        const { meshElements: meshElements_64, meshVao: meshVao_64 } = this.createTerrainGridsVao(64)
        this.meshElements_64 = meshElements_64
        this.meshVao_64 = meshVao_64

        const { meshElements: meshElements_32, meshVao: meshVao_32 } = this.createTerrainGridsVao(32)
        this.meshElements_32 = meshElements_32
        this.meshVao_32 = meshVao_32


        //// smoothing pass ////
        this.tempSmoothingFbo = createFrameBuffer(gl, [this.tempSmoothingTexture], null, null);
        this.smoothingFbo = createFrameBuffer(gl, [this.smoothingTexture], null, null)
        this.smoothingKernel = [
            1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0,
            2.0 / 16.0, 4.0 / 16.0, 2.0 / 16.0,
            1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0
        ]


        // await this.initDebug()

        this.isReady = true

        this.updateParams(this.defaultParams)

    }

    onRemove(map) {
        map.setTerrain(null);
        map.removeSource(this.id + "-underwater-dem");

        // 卸载渲染相关资源
        const gl = this.gl;
        if (gl) {
            // 删除 shader program
            gl.deleteProgram(this.maskProgram);
            gl.deleteProgram(this.meshProgram);
            gl.deleteProgram(this.smoothingProgram);
            gl.deleteProgram(this.showProgram);
            gl.deleteProgram(this.debugProgram);

            // 删除 texture
            gl.deleteTexture(this.maskTexture);
            gl.deleteTexture(this.meshTexture);
            gl.deleteTexture(this.meshDepthTexture);
            gl.deleteTexture(this.emptyDEMTexture);
            gl.deleteTexture(this.smoothingTexture);
            gl.deleteTexture(this.tempSmoothingTexture);
            gl.deleteTexture(this.paletteTexture);
            gl.deleteTexture(this.finalMeshTexture);

            // 删除 framebuffer
            gl.deleteFramebuffer(this.maskFbo);
            gl.deleteFramebuffer(this.meshFbo);
            gl.deleteFramebuffer(this.smoothingFbo);
            gl.deleteFramebuffer(this.tempSmoothingFbo);

            // 删除 VAO
            gl.deleteVertexArray(this.maskVao);
            gl.deleteVertexArray(this.meshVao_128);
            gl.deleteVertexArray(this.meshVao_64);
            gl.deleteVertexArray(this.meshVao_32);
        }
    }


    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {*} matrix 
     * @returns 
     */
    render(gl, matrix) {
        if (!this.isReady) { this.map.triggerRepaint(); return }
        this.frame++;

        const terrain = this.map.painter.terrain
        const tr = this.map.transform

        // const projMatrix = updateProjMatrix.call(this.map.transform, this.elevationRange[0] * this.exaggeration)
        const minElevationInTils = getMinElevationBelowMSL(terrain, this.exaggeration)
        const { projMatrix, mercatorMatrix } = updateProjMatrix.call(this.map.transform, minElevationInTils)


        const tileIDs = this.getTiles2()
        const skirt = skirtHeight(tr.zoom, this.exaggeration, terrain.sourceCache._source.tileSize);
        const sourceCache = terrain.proxySourceCache
        const nowTime = performance.now()
        const cameraPos = this.map.transform._camera.position



        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Pass 1: terrain mesh pass 
        /////////////////////////////////////////////////////////////////////////////////////////////////////////

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.meshFbo)
            gl.viewport(0.0, 0.0, this.canvasWidth, this.canvasHeight)

            gl.clearColor(9999.0, 0.0, 0.0, 0.0)
            gl.clear(gl.COLOR_BUFFER_BIT)

            gl.disable(gl.BLEND)

            gl.clear(gl.DEPTH_BUFFER_BIT)
            gl.enable(gl.DEPTH_TEST)
            gl.depthFunc(gl.LESS)

            gl.useProgram(this.meshProgram);
            // gl.bindVertexArray(this.meshVao);
            gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'u_altitudeDegree'), this.altitudeDeg)
            gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'u_azimuthDegree'), this.azimuthDeg)
            gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'u_offset_x'), this.u_offset_x)
            gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'u_offset_y'), this.u_offset_y)
            gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'ep'), this.ep)

            for (const coord of tileIDs) {
                const tile = sourceCache.getTile(coord);
                const z = tile.tileID.toUnwrapped().canonical.z

                // if (z < 14) {
                this.meshElements = this.meshElements_128
                this.meshVao = this.meshVao_128
                // } else if (z < 15) {
                //     this.meshElements = this.meshElements_64
                //     this.meshVao = this.meshVao_64
                // } else {
                //     this.meshElements = this.meshElements_32
                //     this.meshVao = this.meshVao_32
                // }
                // this.meshElements = this.meshElements_64
                // this.meshVao = this.meshVao_64
                // this.meshElements = this.meshElements_32
                // this.meshVao = this.meshVao_32
                gl.bindVertexArray(this.meshVao);


                // const prevDemTile = terrain.prevTerrainTileForTile[coord.key];
                // const nextDemTile = terrain.terrainTileForTile[coord.key];
                // if (demTileChanged(prevDemTile, nextDemTile)) {
                //     console.log('dem tile changing')
                // }

                const proxyTileProjMatrix = coord.projMatrix
                // const tileMatrix = tr.calculateProjMatrix(tile.tileID.toUnwrapped()) // 和上面一样的效果

                const posMatrix = tr.calculatePosMatrix(tile.tileID.toUnwrapped(), tr.worldSize);
                const tileMatrix = mat4.multiply(mat4.create(), projMatrix, posMatrix);
                tr._projMatrixCache[tile.tileID.toUnwrapped().key] = new Float32Array(tileMatrix);


                const uniformValues = {
                    'u_matrix': tileMatrix,
                    'u_skirt_height': skirt,
                    'u_exaggeration': this.exaggeration,
                    'u_dem_size': 514 - 2,
                }
                const demTile = this.demStore.get(coord.key)
                if (!demTile) { continue }
                const proxyId = tile.tileID.canonical;
                const demId = demTile.tileID.canonical;
                const demScaleBy = Math.pow(2, demId.z - proxyId.z);
                uniformValues[`u_dem_tl`] = [proxyId.x * demScaleBy % 1, proxyId.y * demScaleBy % 1];
                uniformValues[`u_dem_scale`] = demScaleBy;

                // const drapedTexture = tile.texture //地图纹理
                let demTexture = this.emptyDEMTexture
                if (demTile.demTexture && demTile.demTexture.texture) {
                    demTexture = demTile.demTexture.texture
                    uniformValues.u_dem_size = demTile.demTexture.size[0] - 2
                }

                gl.activeTexture(gl.TEXTURE0)
                gl.bindTexture(gl.TEXTURE_2D, demTexture)
                gl.uniform1i(gl.getUniformLocation(this.meshProgram, 'float_dem_texture'), 0);
                gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'use_skirt'), this.use_skirt)
                gl.uniformMatrix4fv(gl.getUniformLocation(this.meshProgram, 'u_matrix'), false, uniformValues['u_matrix'])
                gl.uniform2fv(gl.getUniformLocation(this.meshProgram, 'u_dem_tl'), uniformValues['u_dem_tl']);
                gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'u_dem_size'), uniformValues['u_dem_size']);
                gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'u_dem_scale'), uniformValues['u_dem_scale']);
                gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'u_exaggeration'), uniformValues['u_exaggeration'])
                gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'u_skirt_height'), uniformValues['u_skirt_height'])
                gl.uniform1f(gl.getUniformLocation(this.meshProgram, 'u_rand'), proxyId.x * proxyId.y * 2)

                if (this.debugKey === 'l')
                    gl.drawElements(gl.LINES, this.meshElements, gl.UNSIGNED_SHORT, 0);
                else
                    gl.drawElements(gl.TRIANGLES, this.meshElements, gl.UNSIGNED_SHORT, 0);

            }
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)

            this.finalMeshTexture = this.meshTexture


            ///////////////////////////////////////////
            // Pass 2: smoothing pass 
            //////////////////////////////////////////
            if (this.smoothingPassCount > 0) {
                let currentSmoothingSourceTexture = this.meshTexture
                let currentSmoothingTargetFbo = this.smoothingFbo

                gl.bindFramebuffer(gl.FRAMEBUFFER, currentSmoothingTargetFbo)
                gl.viewport(0.0, 0.0, this.canvasWidth, this.canvasHeight)
                gl.clearColor(0.0, 0.0, 0.0, 0.0)
                gl.clear(gl.COLOR_BUFFER_BIT)
                gl.disable(gl.BLEND)

                gl.useProgram(this.smoothingProgram)
                gl.bindTexture(gl.TEXTURE_2D, currentSmoothingSourceTexture)
                gl.uniform1i(gl.getUniformLocation(this.smoothingProgram, 'u_texture'), 0)
                gl.uniform2fv(gl.getUniformLocation(this.smoothingProgram, 'u_textureSize'), [this.canvasWidth, this.canvasHeight])
                gl.uniform1fv(gl.getUniformLocation(this.smoothingProgram, 'u_kernel'), this.smoothingKernel)
                gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)


                for (let i = 1; i < this.smoothingPassCount; i++) {

                    currentSmoothingSourceTexture = i % 2 === 0 ? this.tempSmoothingTexture : this.smoothingTexture
                    currentSmoothingTargetFbo = i % 2 === 0 ? this.smoothingFbo : this.tempSmoothingFbo

                    gl.bindFramebuffer(gl.FRAMEBUFFER, currentSmoothingTargetFbo)
                    gl.viewport(0.0, 0.0, this.canvasWidth, this.canvasHeight)
                    gl.clearColor(0.0, 0.0, 0.0, 0.0)
                    gl.clear(gl.COLOR_BUFFER_BIT)
                    gl.disable(gl.BLEND)

                    gl.useProgram(this.smoothingProgram)
                    gl.bindTexture(gl.TEXTURE_2D, currentSmoothingSourceTexture)
                    gl.uniform1i(gl.getUniformLocation(this.smoothingProgram, 'u_texture'), 0)
                    gl.uniform2fv(gl.getUniformLocation(this.smoothingProgram, 'u_textureSize'), [this.canvasWidth, this.canvasHeight])
                    gl.uniform1fv(gl.getUniformLocation(this.smoothingProgram, 'u_kernel'), this.smoothingKernel)
                    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

                }

                this.finalMeshTexture = this.smoothingPassCount % 2 === 0 ? this.tempSmoothingTexture : this.smoothingTexture


                gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            }

        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Pass 3: generate mask texture
        /////////////////////////////////////////////////////////////////////////////////////////////////////////

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFbo)
            gl.viewport(0.0, 0.0, this.canvasWidth, this.canvasHeight)
            gl.clearColor(0.0, 0.0, 0.0, 0.0)
            gl.clear(gl.COLOR_BUFFER_BIT)
            gl.useProgram(this.maskProgram)
            gl.bindVertexArray(this.maskVao)
            // gl.bindTexture()
            gl.activeTexture(gl.TEXTURE0)
            gl.bindTexture(gl.TEXTURE_2D, this.meshDepthTexture)
            gl.uniform1i(gl.getUniformLocation(this.maskProgram, 'depth_texture'), 0)
            gl.uniformMatrix4fv(gl.getUniformLocation(this.maskProgram, 'u_matrix'), false, mercatorMatrix)
            gl.drawElements(gl.TRIANGLES, this.maskElements, gl.UNSIGNED_SHORT, 0)
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        }

        /////////////////////////////////////////////////////////////////////////////////////////////////////////
        // Pass 4: show pass --> contourCanvasTexture 
        /////////////////////////////////////////////////////////////////////////////////////////////////////////

        {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null)
            gl.viewport(0.0, 0.0, gl.canvas.width, gl.canvas.height)

            gl.enable(gl.BLEND)
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

            gl.useProgram(this.showProgram)

            gl.activeTexture(gl.TEXTURE0)
            // if (this.debugKey === '1')
            //     gl.bindTexture(gl.TEXTURE_2D, this.meshTexture)
            // else
            //     gl.bindTexture(gl.TEXTURE_2D, this.smoothingTexture)
            gl.bindTexture(gl.TEXTURE_2D, this.finalMeshTexture)
            gl.activeTexture(gl.TEXTURE1)
            gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture)
            gl.activeTexture(gl.TEXTURE2)
            gl.bindTexture(gl.TEXTURE_2D, this.maskTexture)


            gl.uniform1i(gl.getUniformLocation(this.showProgram, 'meshTexture'), 0)
            gl.uniform1i(gl.getUniformLocation(this.showProgram, 'paletteTexture'), 1)
            gl.uniform1i(gl.getUniformLocation(this.showProgram, 'maskTexture'), 2)
            gl.uniform2fv(gl.getUniformLocation(this.showProgram, 'e'), this.elevationRange)
            gl.uniform1f(gl.getUniformLocation(this.showProgram, 'withLighting'), this.withLighting)
            gl.uniform1f(gl.getUniformLocation(this.showProgram, 'opacity'), this.opacity / 100)
            gl.uniform1i(gl.getUniformLocation(this.showProgram, 'reverse'), this.reversePalette ? 1 : 0)
            gl.uniform3fv(gl.getUniformLocation(this.showProgram, 'LightPos'), this.LightPos)
            gl.uniform1f(gl.getUniformLocation(this.showProgram, 'diffPower'), this.diffPower)
            gl.uniform3fv(gl.getUniformLocation(this.showProgram, 'shallowColor'), this.shallowColor)
            gl.uniform3fv(gl.getUniformLocation(this.showProgram, 'deepColor'), this.deepColor)

            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

        }

        this.map.triggerRepaint()
    }

    getTiles2() {

        const terrain = this.map.painter.terrain
        const proxySourceCache = terrain.proxySourceCache

        const accumulatedDrapes = []
        const proxies = terrain.proxiedCoords[proxySourceCache.id]

        for (const proxy of proxies) {
            const tile = proxySourceCache.getTileByID(proxy.proxyTileKey);
            accumulatedDrapes.push(tile.tileID);

            const prevDemTile = terrain.prevTerrainTileForTile[tile.tileID.key];
            const nextDemTile = terrain.terrainTileForTile[tile.tileID.key];
            if (prevDemTile && prevDemTile.demTexture) {
                this.demStore.put(tile.tileID.key, prevDemTile)
            }
            if (nextDemTile && nextDemTile.demTexture) {
                this.demStore.put(tile.tileID.key, nextDemTile)
            }
        }
        // console.log('accumulatedDrapes', accumulatedDrapes.length, accumulatedDrapes)
        return accumulatedDrapes
    }

    createTerrainGridsVao(element = 128) {
        let gl = this.gl
        let grid = createGrid(8192, element + 1)
        let posBuffer = createArrayBuffer(gl, new Float32Array(grid.vertices))
        let idxBuffer = createIndexBuffer(gl, new Uint16Array(grid.indices))
        let meshElements = grid.indices.length

        let meshVao = gl.createVertexArray()
        gl.bindVertexArray(meshVao)
        gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer)
        gl.enableVertexAttribArray(0)
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer)
        gl.bindVertexArray(null)

        return {
            meshElements,
            meshVao
        }
    }



    async initDebug() {
        this.debugProgram = createShaderFromCode(this.gl, debugCode)
    }
    // temp
    doDebug(texture) {
        let gl = this.gl
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)

        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
        // gl.disable(gl.BLEND)
        // gl.clearColor(1.0, 0.0, 0.0, 1.0)
        // gl.clear(gl.COLOR_BUFFER_BIT)
        gl.viewport(0.0, 0.0, gl.canvas.width, gl.canvas.height)
        gl.useProgram(this.debugProgram)
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.activeTexture(gl.TEXTURE1)
        gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture)
        gl.uniform1f(gl.getUniformLocation(this.debugProgram, 'mipmap'), 0.0)
        gl.uniform1i(gl.getUniformLocation(this.debugProgram, 'debugTexture'), 0)
        gl.uniform1i(gl.getUniformLocation(this.debugProgram, 'paletteTexture'), 1)
        gl.uniform1f(gl.getUniformLocation(this.debugProgram, 'debugLevel'), 0)
        gl.uniform2fv(gl.getUniformLocation(this.debugProgram, 'u_screenSize'), [this.canvasWidth, this.canvasHeight])
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    }

    getParams() {
        return {
            exaggeration: this.exaggeration,
            opacity: this.opacity,
            palette: this.palette,
            reversePalette: this.reversePalette,
            // withLighting: this.withLighting,
            lightPos: this.LightPos
        };
    }

    async updateParams(updateSet) {
        if (!updateSet || typeof updateSet !== 'object') return;
        // 遍历更新参数
        for (const [key, value] of Object.entries(updateSet)) {
            // 直接更新参数值
            this[key] = value;
            // 特殊参数的额外处理
            if (key === 'exaggeration') {
                this.map.setTerrain({ exaggeration: value });
            } else if (key === 'lightPos' && Array.isArray(value) && value.length === 3) {
                this.LightPos[0] = value[0];
                this.LightPos[1] = value[1];
                this.LightPos[2] = value[2];
            } else if (key === 'palette') {
                let gl = this.gl
                const paletteBitmap = await this.getPaletteImage(value)
                this.gl.deleteTexture(this.paletteTexture);
                this.paletteTexture = createTexture2D(gl, 0, paletteBitmap.width, paletteBitmap.height, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, paletteBitmap)
            }

            this.map.triggerRepaint();
        }
    }

    async getPaletteImage(paletteIndex) {
        const paletteBitmap = await loadImage(`/images/dems/palettes/${paletteIndex}.png`)
        return paletteBitmap
    }

}


//#region helper functions
function parseBBOX(bbox) {
    const [xmin, ymin, xmax, ymax] = bbox;

    // 顶点顺序：左下、右下、右上、左上
    const vertexData = [
        xmin, ymin, // 0: 左下
        xmax, ymin, // 1: 右下
        xmax, ymax, // 2: 右上
        xmin, ymax  // 3: 左上
    ];

    // 两个三角形：0-1-2, 2-3-0
    const indexData = [
        0, 1, 2,
        2, 3, 0
    ];

    return {
        vertexData,
        indexData
    };
}

function createGrid(TILE_EXTENT, count) {

    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

    const EXTENT = TILE_EXTENT;
    const size = count + 2;

    // Around the grid, add one more row/column padding for "skirt".
    let vertices = [];
    let indices = [];
    let linesIndices = [];

    const step = EXTENT / (count - 1);
    const gridBound = EXTENT + step / 2;
    const bound = gridBound + step;

    // Skirt offset of 0x5FFF is chosen randomly to encode boolean value (skirt
    // on/off) with x position (max value EXTENT = 4096) to 16-bit signed integer.
    const skirtOffset = 24575; // 0x5FFF

    for (let y = -step; y < bound; y += step) {
        for (let x = -step; x < bound; x += step) {
            const offset = (x < 0 || x > gridBound || y < 0 || y > gridBound) ? skirtOffset : 0;
            const xi = clamp(Math.round(x), 0, EXTENT);
            const yi = clamp(Math.round(y), 0, EXTENT);
            vertices.push(xi + offset, yi);
        }
    }

    const skirtIndicesOffset = (size - 3) * (size - 3) * 2;
    const quad = (i, j) => {
        const index = j * size + i;
        indices.push(index + 1, index, index + size);
        indices.push(index + size, index + size + 1, index + 1);
    };
    for (let j = 1; j < size - 2; j++) {
        for (let i = 1; i < size - 2; i++) {
            quad(i, j);
        }
    }
    // Padding (skirt) indices:
    [0, size - 2].forEach(j => {
        for (let i = 0; i < size - 1; i++) {
            quad(i, j);
            quad(j, i);
        }
    });
    return {
        vertices,
        indices,
        skirtIndicesOffset,
        linesIndices
    }
}

function skirtHeight(zoom, terrainExaggeration, tileSize) {
    // Skirt height calculation is heuristic: provided value hides
    // seams between tiles and it is not too large: 9 at zoom 22, ~20000m at zoom 0.
    if (terrainExaggeration === 0) return 0;
    const exaggerationFactor = (terrainExaggeration < 1.0 && tileSize === 514) ? 0.25 / terrainExaggeration : 1.0;
    return 10 * Math.pow(1.5, 22 - zoom) * Math.max(terrainExaggeration, 1.0) * exaggerationFactor;
}

function getMinElevationBelowMSL(terrain, exaggeration) {
    let min = 0.0;
    // The maximum DEM error in meters to be conservative (SRTM).
    const maxDEMError = 30.0;
    terrain._visibleDemTiles.filter(tile => tile.dem).forEach(tile => {
        const minMaxTree = (tile.dem).tree;
        min = Math.min(min, minMaxTree.minimums[0]);
    });
    return min === 0.0 ? min : (min - maxDEMError) * exaggeration;
}

function farthestPixelDistanceOnPlane(tr, minElevation, pixelsPerMeter) {
    // Find the distance from the center point [width/2 + offset.x, height/2 + offset.y] to the
    // center top point [width/2 + offset.x, 0] in Z units, using the law of sines.
    // 1 Z unit is equivalent to 1 horizontal px at the center of the map
    // (the distance between[width/2, height/2] and [width/2 + 1, height/2])
    const fovAboveCenter = tr.fovAboveCenter;

    // Adjust distance to MSL by the minimum possible elevation visible on screen,
    // this way the far plane is pushed further in the case of negative elevation.

    // 貌似 tr.elevation 就是 terrain
    const minElevationInPixels = minElevation * pixelsPerMeter;
    const cameraToSeaLevelDistance = ((tr._camera.position[2] * tr.worldSize) - minElevationInPixels) / Math.cos(tr._pitch);
    const topHalfSurfaceDistance = Math.sin(fovAboveCenter) * cameraToSeaLevelDistance / Math.sin(Math.max(Math.PI / 2.0 - tr._pitch - fovAboveCenter, 0.01));

    // Calculate z distance of the farthest fragment that should be rendered.
    const furthestDistance = Math.sin(tr._pitch) * topHalfSurfaceDistance + cameraToSeaLevelDistance;
    const horizonDistance = cameraToSeaLevelDistance * (1 / tr._horizonShift);

    // Add a bit extra to avoid precision problems when a fragment's distance is exactly `furthestDistance`
    return Math.min(furthestDistance * 1.01, horizonDistance);
}

function updateProjMatrix(minElevation) {

    if (!this.height) return;

    const offset = this.centerOffset;

    // Z-axis uses pixel coordinates when globe mode is enabled
    const pixelsPerMeter = this.pixelsPerMeter;


    const projectionT = getProjectionInterpolationT(this.projection, this.zoom, this.width, this.height, 1024);

    // 'this._pixelsPerMercatorPixel' is the ratio between pixelsPerMeter in the current projection relative to Mercator.
    // This is useful for converting e.g. camera position between pixel spaces as some logic
    // such as raycasting expects the scale to be in mercator pixels
    this._pixelsPerMercatorPixel = this.projection.pixelSpaceConversion(this.center.lat, this.worldSize, projectionT);

    this.cameraToCenterDistance = 0.5 / Math.tan(this._fov * 0.5) * this.height * this._pixelsPerMercatorPixel;

    this._updateCameraState();

    this._farZ = farthestPixelDistanceOnPlane(this, minElevation, pixelsPerMeter);

    // The larger the value of nearZ is
    // - the more depth precision is available for features (good)
    // - clipping starts appearing sooner when the camera is close to 3d features (bad)
    //
    // Smaller values worked well for mapbox-gl-js but deckgl was encountering precision issues
    // when rendering it's layers using custom layers. This value was experimentally chosen and
    // seems to solve z-fighting issues in deckgl while not clipping buildings too close to the camera.
    this._nearZ = this.height / 50;

    const zUnit = this.projection.zAxisUnit === "meters" ? pixelsPerMeter : 1.0;
    const worldToCamera = this._camera.getWorldToCamera(this.worldSize, zUnit);

    let cameraToClip;

    const cameraToClipPerspective = this._camera.getCameraToClipPerspective(this._fov, this.width / this.height, this._nearZ, this._farZ);
    // Apply offset/padding
    cameraToClipPerspective[8] = -offset.x * 2 / this.width;
    cameraToClipPerspective[9] = offset.y * 2 / this.height;


    cameraToClip = cameraToClipPerspective;

    // @ts-expect-error - TS2345 - Argument of type 'Float64Array' is not assignable to parameter of type 'ReadonlyMat4'.
    const worldToClipPerspective = mat4.mul([], cameraToClipPerspective, worldToCamera);
    // @ts-expect-error - TS2345 - Argument of type 'Float64Array' is not assignable to parameter of type 'ReadonlyMat4'.
    let m = mat4.mul([], cameraToClip, worldToCamera);

    if (this.projection.isReprojectedInTileSpace) {
        // Projections undistort as you zoom in (shear, scale, rotate).
        // Apply the undistortion around the center of the map.
        const mc = this.locationCoordinate(this.center);
        const adjustments = mat4.identity([]);
        mat4.translate(adjustments, adjustments, [mc.x * this.worldSize, mc.y * this.worldSize, 0]);
        mat4.multiply(adjustments, adjustments, getProjectionAdjustments(this));
        mat4.translate(adjustments, adjustments, [-mc.x * this.worldSize, -mc.y * this.worldSize, 0]);
        mat4.multiply(m, m, adjustments);
        // @ts-expect-error - TS2345 - Argument of type 'number[] | Float32Array' is not assignable to parameter of type 'mat4'.
        mat4.multiply(worldToClipPerspective, worldToClipPerspective, adjustments);
        this.inverseAdjustmentMatrix = getProjectionAdjustmentInverted(this);
    } else {
        this.inverseAdjustmentMatrix = [1, 0, 0, 1];
    }

    // The mercatorMatrix can be used to transform points from mercator coordinates
    // ([0, 0] nw, [1, 1] se) to GL coordinates. / zUnit compensates for scaling done in worldToCamera.
    // @ts-expect-error - TS2322 - Type 'mat4' is not assignable to type 'number[]'. | TS2345 - Argument of type 'number[] | Float32Array' is not assignable to parameter of type 'ReadonlyMat4'.
    const mercatorMatrix = mat4.scale([], m, [this.worldSize, this.worldSize, this.worldSize / zUnit, 1.0]);

    return {
        projMatrix: m,
        mercatorMatrix,
    }
}

function getProjectionInterpolationT(projection, zoom, width, height, maxSize = Infinity) {
    const range = projection.range;
    if (!range) return 0;

    const size = Math.min(maxSize, Math.max(width, height));
    // The interpolation ranges are manually defined based on what makes
    // sense in a 1024px wide map. Adjust the ranges to the current size
    // of the map. The smaller the map, the earlier you can start unskewing.
    const rangeAdjustment = Math.log(size / 1024) / Math.LN2;
    const zoomA = range[0] + rangeAdjustment;
    const zoomB = range[1] + rangeAdjustment;
    const t = smoothstep(zoomA, zoomB, zoom);
    return t;
}

function smoothstep(e0, e1, x) {
    x = clamp((x - e0) / (e1 - e0), 0, 1);
    return x * x * (3 - 2 * x);
}

function sortByDistanceToCamera(tileIDs, painter) {
    const cameraCoordinate = painter.transform.pointCoordinate(painter.transform.getCameraPoint());
    const cameraPoint = { x: cameraCoordinate.x, y: cameraCoordinate.y };

    tileIDs.sort((a, b) => {
        if (b.overscaledZ - a.overscaledZ) return b.overscaledZ - a.overscaledZ;

        const aPoint = {
            x: a.canonical.x + (1 << a.canonical.z) * a.wrap,
            y: a.canonical.y
        };

        const bPoint = {
            x: b.canonical.x + (1 << b.canonical.z) * b.wrap,
            y: b.canonical.y
        };

        const cameraScaled = {
            x: cameraPoint.x * (1 << a.canonical.z),
            y: cameraPoint.y * (1 << a.canonical.z)
        };

        cameraScaled.x -= 0.5;
        cameraScaled.y -= 0.5;

        const distSqr = (point1, point2) => {
            const dx = point1.x - point2.x;
            const dy = point1.y - point2.y;
            return dx * dx + dy * dy;
        };

        return distSqr(cameraScaled, aPoint) - distSqr(cameraScaled, bPoint);
    });
}

function demTileChanged(prev, next) {
    if (prev == null || next == null)
        return false;
    if (!prev.hasData() || !next.hasData())
        return false;
    if (prev.demTexture == null || next.demTexture == null)
        return false;
    return prev.tileID.key !== next.tileID.key;
}

function parseRGB(rgbString) {
    const regex = /rgb\((\d+),\s*(\d+),\s*(\d+)\)/;
    const match = rgbString.match(regex);
    if (match) {
        const [_, r, g, b] = match;
        return [parseInt(r), parseInt(g), parseInt(b)];
    } else {
        throw new Error('Invalid RGB string');
    }
}

//#endregion