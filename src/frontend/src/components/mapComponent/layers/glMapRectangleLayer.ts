import { mat4 } from 'gl-matrix';
import { Map, CustomLayerInterface } from 'mapbox-gl';
import * as tilebelt from '@mapbox/tilebelt';

export default class GLMapRectangleLayer implements CustomLayerInterface {
    id: string;
    initialized: boolean;
    z_order?: number;
    type: 'custom' = 'custom';
    renderingMode: '2d' | '3d' = '3d';
    // map
    map!: Map;
    origin!: [number, number];
    program!: WebGLProgram;

    // render params

    constructor(options: {
        id: string;
        z_order?: number;
        origin: [number, number];
    }) {
        this.id = options.id;
        options.z_order && (this.z_order = options.z_order);
        this.initialized = false;
        this.origin = options.origin;
    }

    /** Method to initialize gl resources and register event listeners. */
    async onAdd(map: Map, gl: WebGL2RenderingContext) {
        this.map = map;

        const vertexSource = `#version 300 es
        uniform vec2 base_tile_pos;
        uniform float meter_to_tile;
        uniform mat4 tile_matrix;

        out vec3 vv;

        void main() {
            // 定义立方体的顶点
            vec3[] pos = vec3[8](
                vec3(-0.5, -0.5, 0.01), // 左下后
                vec3(0.5, -0.5, 0.01),  // 右下后
                vec3(0.5, 0.5, 0.01),   // 右上后
                vec3(-0.5, 0.5, 0.01),  // 左上后
                vec3(-0.5, -0.5, 0.02),  // 左下前
                vec3(0.5, -0.5, 0.02),   // 右下前
                vec3(0.5, 0.5, 0.02),    // 右上前
                vec3(-0.5, 0.5, 0.02)    // 左上前
            );

            // 使用三维坐标
            // vec3 vertInTile = vec3(base_tile_pos, 0.0) + pos[gl_VertexID] * 500.0 * meter_to_tile;
            // gl_Position = tile_matrix * vec4(vertInTile, 1.0);


            // vec3 vertInTile = vec3(base_tile_pos, 0.0) + pos[gl_VertexID] * 500.0 * meter_to_tile;
            vec2 vertInTilexy = vec2(base_tile_pos) + pos[gl_VertexID].xy * 500.0 * meter_to_tile;
            float z = pos[gl_VertexID].z * 500.0;
            gl_Position = tile_matrix * vec4(vertInTilexy, z, 1.0);


            vv = vec3(pos[gl_VertexID]);
        }`;

        const fragmentSource = `#version 300 es
        precision highp float;

        in vec3 vv;
        out vec4 outColor;

        void main() {
            outColor = vec4(0.0, 0.3, 0.7, 0.4); // 绿色
        }`;

        const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error(
                'Vertex shader compilation failed:',
                gl.getShaderInfoLog(vertexShader)
            );
        }

        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error(
                'Fragment shader compilation failed:',
                gl.getShaderInfoLog(fragmentShader)
            );
        }

        this.program = gl.createProgram()!;
        gl.attachShader(this.program, vertexShader);
        gl.attachShader(this.program, fragmentShader);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(
                'Program linking failed:',
                gl.getProgramInfoLog(this.program)
            );
        }

        this.initialized = true;
    }

    /** Method called during a render frame */
    render(gl: WebGL2RenderingContext, matrix: Array<number>) {
        if (!this.initialized) return;

        // Tick logic operation
        const tr = this.map.transform;

        /** target tile in specified point and zoom */
        const targetTile = point2Tile(
            this.origin[0],
            this.origin[1],
            Math.floor(tr.zoom)
        );

        /** transform from Local-Tile-Space to Clip-Space */
        const tileMatrix = calcTileMatrix(tr, targetTile);

        /** lnglat to Local-Tile-Space in specified tile  */
        const originInTileCoord = lnglat2TileLocalCoord(
            this.origin,
            targetTile
        );

        const meterPerTileUnit = tileToMeter(targetTile, originInTileCoord[1]);
        const tileUnitPerMeter = 1.0 / meterPerTileUnit;

        gl.useProgram(this.program);
        gl.uniformMatrix4fv(
            gl.getUniformLocation(this.program, 'tile_matrix'),
            false,
            tileMatrix
        );
        gl.uniform2fv(
            gl.getUniformLocation(this.program, 'base_tile_pos'),
            originInTileCoord
        );
        gl.uniform1f(
            gl.getUniformLocation(this.program, 'meter_to_tile'),
            tileUnitPerMeter
        );

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL); // 设置深度测试的函数
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // 定义立方体的面
        const indices = new Uint16Array([
            0,
            1,
            2,
            0,
            2,
            3, // 后面
            4,
            5,
            6,
            4,
            6,
            7, // 前面
            0,
            1,
            5,
            0,
            5,
            4, // 左面
            1,
            2,
            6,
            1,
            6,
            5, // 右面
            2,
            3,
            7,
            2,
            7,
            6, // 上面
            3,
            0,
            4,
            3,
            4,
            7, // 下面
        ]);

        // 使用元素数组绘制
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        // gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND); // 禁用混合模式
    }

    /** Method to clean up gl resources and event listeners. */
    remove(map: Map, gl: WebGL2RenderingContext) {}

    show() {}
    hide() {}
}

// // Helpers //////////////////////////////////////////////////////////////////////////////////////////////////////

function point2Tile(lng: any, lat: any, z: any) {
    const tile = tilebelt.pointToTile(lng, lat, z);
    return { x: tile[0], y: tile[1], z: tile[2] };
}

/** Transform from lnglat to tile local coord  */
function lnglat2TileLocalCoord([lng, lat]: any, tile: any) {
    const EXTENT = 8192;
    const tileXYZ = [tile.x, tile.y, tile.z];
    const tileBBox = tilebelt.tileToBBOX(tileXYZ as any);

    return [
        Math.floor(
            ((lng - tileBBox[0]) / (tileBBox[2] - tileBBox[0])) * EXTENT
        ),
        Math.floor(
            (1.0 - (lat - tileBBox[1]) / (tileBBox[3] - tileBBox[1])) * EXTENT
        ),
    ];
}

function tileToMeter(canonical: any, tileYCoordinate = 0) {
    let ycoord;

    canonical.z > 10 ? (ycoord = 0) : (ycoord = tileYCoordinate);
    const EXTENT = 8192;
    const circumferenceAtEquator = 40075017;
    const mercatorY = (canonical.y + ycoord / EXTENT) / (1 << canonical.z);
    const exp = Math.exp(Math.PI * (1 - 2 * mercatorY));
    // simplify cos(2 * atan(e) - PI/2) from mercator_coordinate.js, remove trigonometrics.
    return (
        (circumferenceAtEquator * 2 * exp) /
        (exp * exp + 1) /
        EXTENT /
        (1 << canonical.z)
    );
}

function calcTilePosMatrix(tr: any, tileXYZ: any) {
    let scale, scaledX, scaledY;
    // @ts-ignore
    const posMatrix = mat4.identity(new Float64Array(16));
    const EXTENT = 8192;

    // Note: Delete some operations about tile.wrap
    scale = tr.worldSize / Math.pow(2, tileXYZ.z);
    scaledX = tileXYZ.x * scale;
    scaledY = tileXYZ.y * scale;

    mat4.translate(posMatrix, posMatrix, [scaledX, scaledY, 0]);
    mat4.scale(posMatrix, posMatrix, [scale / EXTENT, scale / EXTENT, 1]);

    return posMatrix;
}

function calcTileMatrix(tr: any, tileXYZ: any) {
    const finalTileMatrix = mat4.create();
    const posMatrix = calcTilePosMatrix(tr, tileXYZ);
    const projMatrix = tr.projMatrix;
    mat4.multiply(finalTileMatrix, projMatrix, posMatrix);
    return finalTileMatrix;
}
