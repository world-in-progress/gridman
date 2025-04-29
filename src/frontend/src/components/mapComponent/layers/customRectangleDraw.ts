import { mat4, vec3 } from 'gl-matrix';
import { Map, CustomLayerInterface, LngLat } from 'mapbox-gl';
import * as tilebelt from '@mapbox/tilebelt';

export default class CustomRectangleDraw implements CustomLayerInterface {
    id: string;
    initialized: boolean;
    z_order?: number;
    type: 'custom' = 'custom';
    renderingMode: '2d' | '3d' = '2d';
    // map
    map!: Map;
    program!: WebGLProgram;
    
    // 矩形的四个角点坐标 (EPSG:4326)
    corners: {
        southWest: [number, number]; // 左下
        southEast: [number, number]; // 右下
        northEast: [number, number]; // 右上
        northWest: [number, number]; // 左上
    };

    constructor(options: {
        id: string;
        z_order?: number;
        corners: {
            southWest: [number, number]; // 左下
            southEast: [number, number]; // 右下
            northEast: [number, number]; // 右上
            northWest: [number, number]; // 左上
        };
    }) {
        this.id = options.id;
        options.z_order && (this.z_order = options.z_order);
        this.initialized = false;
        this.corners = options.corners;
    }

    /** Method to initialize gl resources and register event listeners. */
    async onAdd(map: Map, gl: WebGL2RenderingContext) {
        this.map = map;

        const vertexSource = `#version 300 es
        uniform mat4 u_matrix;
        
        out vec3 vv;

        void main() {
            // 定义矩形的四个顶点（从左下角开始，按顺时针方向）
            vec3[] pos = vec3[4](
                vec3(0.0, 0.0, 0.01),  // 左下 (southWest)
                vec3(1.0, 0.0, 0.01),  // 右下 (southEast)
                vec3(1.0, 1.0, 0.01),  // 右上 (northEast)
                vec3(0.0, 1.0, 0.01)   // 左上 (northWest)
            );

            gl_Position = u_matrix * vec4(pos[gl_VertexID], 1.0);
            
            vv = vec3(pos[gl_VertexID]);
        }`;

        const fragmentSource = `#version 300 es
        precision highp float;

        in vec3 vv;
        out vec4 outColor;

        void main() {
            outColor = vec4(0.0, 0.3, 0.7, 0.6); // 蓝色，略微增加透明度
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

        gl.useProgram(this.program);
        
        // 为每个角点计算投影矩阵
        const cornerPositions = [
            this.corners.southWest, // 左下
            this.corners.southEast, // 右下
            this.corners.northEast, // 右上
            this.corners.northWest  // 左上
        ];
        
        // 创建WebGL矩阵
        const projectionMatrix = this.map.transform.projMatrix;
        const transformMatrix = mat4.create();
        
        // 计算包含所有点的变换矩阵
        this.calculateTransformMatrix(transformMatrix, cornerPositions);
        
        // 完整的矩阵（从经纬度到屏幕坐标）
        const finalMatrix = mat4.create();
        mat4.multiply(finalMatrix, projectionMatrix, transformMatrix);
        
        // 设置uniform
        gl.uniformMatrix4fv(
            gl.getUniformLocation(this.program, 'u_matrix'),
            false,
            finalMatrix
        );

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // 定义矩形的面（两个三角形）
        const indices = new Uint16Array([
            0, 1, 2,  // 第一个三角形 (左下 -> 右下 -> 右上)
            0, 2, 3   // 第二个三角形 (左下 -> 右上 -> 左上)
        ]);

        // 使用元素数组绘制
        const indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

        gl.disable(gl.BLEND); // 禁用混合模式
    }
    
    /**
     * 计算从经纬度坐标到矩形空间的变换矩阵
     */
    calculateTransformMatrix(matrix: mat4, cornerPositions: [number, number][]) {
        const tr = this.map.transform;
        
        // 重置矩阵
        mat4.identity(matrix);
        
        // 计算四个角的墨卡托投影坐标
        const mercatorPoints = cornerPositions.map(coord => 
            tr.project(new LngLat(coord[0], coord[1]))
        );
        
        // 计算单位矩形到实际墨卡托坐标的变换
        // 使用坐标系统原点在左下角的单位矩形 [0,0] -> [1,1]
        const mercatorSW = mercatorPoints[0]; // 左下
        const mercatorNE = mercatorPoints[2]; // 右上
        
        // 计算缩放和偏移
        const scaleVec = vec3.fromValues(
            mercatorNE.x - mercatorSW.x,
            mercatorNE.y - mercatorSW.y,
            1
        );
        
        const translateVec = vec3.fromValues(
            mercatorSW.x,
            mercatorSW.y,
            0
        );
        
        // 应用变换
        mat4.scale(matrix, matrix, scaleVec);
        mat4.translate(matrix, matrix, translateVec);
        
        return matrix;
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
