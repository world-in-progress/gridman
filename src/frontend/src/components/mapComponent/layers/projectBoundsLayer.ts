import { Map, CustomLayerInterface } from 'mapbox-gl';
import { Project } from '../../projectPanel/types/types';
import { convertCoordinate } from '../../operatePanel/utils/coordinateUtils';
import { ProjectService } from '../../projectPanel/utils/ProjectService';
import { generateRandomRgbColor } from '../../../utils/colorUtils';

export default class ProjectBoundsLayer implements CustomLayerInterface {
    id: string;
    type: 'custom' = 'custom';
    renderingMode: '2d' | '3d' = '3d';

    private _visibility: 'visible' | 'none' = 'visible';

    map!: Map;
    program!: WebGLProgram;
    positionBuffer!: WebGLBuffer;
    aPosition!: number;

    projects: Project[] = [];
    projectColors: Record<string, number[]> = {};
    selectedProject: string | null = null;

    private vertexSource = `
    precision highp float;
    attribute vec2 aPosition;
    uniform mat4 uMatrix;
    uniform vec4 uBounds;
    
    varying vec2 vPosition;
    varying vec4 vBounds;
    
    void main() {
        vPosition = aPosition;
        vBounds = uBounds;
        gl_Position = uMatrix * vec4(aPosition, 0.0, 1.0);
    }`;

    private fragmentSource = `
    precision highp float;
    
    void main() {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 0.8);
    }`;

    constructor(options: { id: string }) {
        this.id = options.id;
    }

    async onAdd(map: Map, gl: WebGLRenderingContext) {
        this.map = map;

        try {
            const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
            gl.shaderSource(vertexShader, this.vertexSource);
            gl.compileShader(vertexShader);
            if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
                console.error(
                    '顶点着色器编译失败:',
                    gl.getShaderInfoLog(vertexShader)
                );
                throw new Error('顶点着色器编译失败');
            }

            const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
            gl.shaderSource(fragmentShader, this.fragmentSource);
            gl.compileShader(fragmentShader);
            if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
                console.error(
                    '片段着色器编译失败:',
                    gl.getShaderInfoLog(fragmentShader)
                );
                throw new Error('片段着色器编译失败');
            }

            this.program = gl.createProgram()!;
            gl.attachShader(this.program, vertexShader);
            gl.attachShader(this.program, fragmentShader);
            gl.linkProgram(this.program);
            if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
                console.error(
                    '程序链接失败:',
                    gl.getProgramInfoLog(this.program)
                );
                throw new Error('程序链接失败');
            }

            await this.loadAllProjects();
        } catch (error) {
            console.error('初始化项目边界图层失败:', error);
        }
    }

    async loadAllProjects() {
        const projectService = new ProjectService('zh');

        projectService.fetchAllProjects(0, 1000, (err, result) => {
            this.projects = result.project_metas;
            this.projects.forEach((project) => {
                if (!this.projectColors[project.name]) {
                    this.projectColors[project.name] = generateRandomRgbColor(0.5, 0.3, 0.7);
                }
            });
        });
        // this.projects = await projectService.fetchAllProjects();

        // this.projects.forEach((project) => {
        //     if (!this.projectColors[project.name]) {
        //         this.projectColors[project.name] = generateRandomRgbColor(0.5, 0.3, 0.7);
        //     }
        // });
    }

    render(gl: WebGLRenderingContext, matrix: number[]) {
        if (this._visibility === 'none') return;

        if (!this.program || this.projects.length === 0) {
            return;
        }

        try {
            gl.useProgram(this.program);

            const uMatrix = gl.getUniformLocation(this.program, 'uMatrix');
            gl.uniformMatrix4fv(uMatrix, false, matrix);

            const uBorderWidth = gl.getUniformLocation(
                this.program,
                'uBorderWidth'
            );
            gl.uniform1f(uBorderWidth, 0.0002);

            const currentBlendEnabled = gl.isEnabled(gl.BLEND);
            const currentDepthTestEnabled = gl.isEnabled(gl.DEPTH_TEST);

            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

            gl.disable(gl.DEPTH_TEST);

            for (const project of this.projects) {
                this.drawProjectBounds(gl, project);
            }

            if (currentBlendEnabled) {
                gl.enable(gl.BLEND);
            } else {
                gl.disable(gl.BLEND);
            }

            if (currentDepthTestEnabled) {
                gl.enable(gl.DEPTH_TEST);
            } else {
                gl.disable(gl.DEPTH_TEST);
            }
        } catch (error) {
            console.error('渲染项目边界失败:', error);
        }
    }

    drawProjectBounds(gl: WebGLRenderingContext, project: Project) {
        try {
            const { bounds, name } = project;
            if (!bounds || bounds.length !== 4) {
                return;
            }

            const sw = convertCoordinate(
                [bounds[0], bounds[1]],
                '2326',
                '4326'
            );
            const ne = convertCoordinate(
                [bounds[2], bounds[3]],
                '2326',
                '4326'
            );

            if (!sw || !ne || sw.length !== 2 || ne.length !== 2) {
                return;
            }

            const testColor = [0.8, 0.7, 0.02, 0.4]; // 鲜红色，高透明度

            const uBounds = gl.getUniformLocation(this.program, 'uBounds');
            gl.uniform4f(uBounds, sw[0], sw[1], ne[0], ne[1]);

            const isSelected = name === this.selectedProject;

            const uFillColor = gl.getUniformLocation(
                this.program,
                'uFillColor'
            );
            gl.uniform4f(
                uFillColor,
                testColor[0],
                testColor[1],
                testColor[2],
                testColor[3]
            );

            const uBorderColor = gl.getUniformLocation(
                this.program,
                'uBorderColor'
            );
            gl.uniform4f(uBorderColor, 1.0, 1.0, 0.0, 1.0); // 亮黄色边框

            const uSelected = gl.getUniformLocation(this.program, 'uSelected');
            gl.uniform1i(uSelected, isSelected ? 1 : 0);

            const simpleVertices = [
                sw[0],
                sw[1], // LB
                (sw[0] + ne[0]) / 2,
                ne[1], // TM
                ne[0],
                sw[1], // RB
            ];

            const simpleIndices = [0, 1, 2];

            const vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(
                gl.ARRAY_BUFFER,
                new Float32Array(simpleVertices),
                gl.STATIC_DRAW
            );

            const aPosition = gl.getAttribLocation(this.program, 'aPosition');
            gl.enableVertexAttribArray(aPosition);
            gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

            const indexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Uint16Array(simpleIndices),
                gl.STATIC_DRAW
            );

            gl.drawElements(
                gl.TRIANGLES,
                simpleIndices.length,
                gl.UNSIGNED_SHORT,
                0
            );

            gl.deleteBuffer(vertexBuffer);
            gl.deleteBuffer(indexBuffer);
        } catch (error) {
            console.error(`绘制项目 ${project.name} 边界失败:`, error);
        }
    }

    setSelectedProject(projectName: string | null) {
        this.selectedProject = projectName;
    }

    remove(map: Map, gl: WebGLRenderingContext) {
        if (this.program) {
            gl.deleteProgram(this.program);
        }
    }

    setVisibility(visibility: 'visible' | 'none') {
        this._visibility = visibility;
    }

    getVisibility(): 'visible' | 'none' {
        return this._visibility;
    }
}
