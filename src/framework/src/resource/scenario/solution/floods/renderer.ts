import Model from '@/threejs/model/model';
import ThreejsSceneLayer from '@/threejs/threejs-scene';
import { extend } from '@/threejs/utils/Util';
import { SceneUpdateEvent, SceneUpdateEventType } from '@/threejs/object/scene-event';
import { TerrainFragmentShader, TerrainVertexShader } from './shaders/TerrainShader';
import { WaterFragmentShader, WaterVertexShader } from './shaders/WaterShader';

import * as THREE from 'three';
import FloodsResources from './resources';

export type FloodsConfig = {
    center: [number, number];
    lightColor: string;
    lightDirection: [number, number, number];

    terrainColor: string;
    terrainGeometrySize: [number, number];
    terrainCorners3857: [[number, number], [number, number], [number, number], [number, number]];
    terrainNormalY: number;

    waterGeometrySize: [number, number];
    waterCorners3857: [[number, number], [number, number], [number, number], [number, number]];

    foamMap: string;
    normalMap: string;
    displacementMap: string;
    heightNoiseMap: string;
    heightNoiseNormalMap: string;
    rampMap: string;

    durationTimeScale: number;
    waterNormalY: number;
    normalStrength: number;
    waterAlpha: number;

    minWaterDepth: number;
    maxWaterDepth: number;
    minWaterDepthAlpha: number;
    maxWaterDepthAlpha: number;
    swapTimeMinRange: number;
    swapTimeMaxRange: number;

    waterShallowColor: string;
    waterDeepColor: string;
    waterShallowAlpha: number;
    waterDeepAlpha: number;
    depthDensity: number;
    flowStrength: number;
    gridResolutionA: number;
    wavePeriodA: number;
    flowVelocityStrengthA: number;
    gridResolutionB: number;
    wavePeriodB: number;
    flowVelocityStrengthB: number;
    gridResolutionC: number;
    wavePeriodC: number;
    flowVelocityStrengthC: number;
    gridResolutionD: number;
    wavePeriodD: number;
    flowVelocityStrengthD: number;
    foamMinEdge: number;
    foamMaxEdge: number;
    foamVelocityMaskMinEdge: number;
    foamVelocityMaskMaxEdge: number;
};

const defaultConfig: FloodsConfig = {
    center: [114.028140134, 22.472900679],
    lightColor: '#FFF4D6',
    lightDirection: [50, -30, 0],

    terrainColor: '#FFFFFF',
    terrainGeometrySize: [640, 640],
    terrainCorners3857: [
        [12679881.570319263, 2560830.1529902862],
        [12807218.697355295, 2560830.1529902862],
        [12707218.697355295, 2575950.053680579],
        [12679881.570319263, 2575950.053680579]
    ],
    terrainNormalY: 0.2,

    waterGeometrySize: [640, 640],
    waterCorners3857: [
        [12679908.694269724, 2560846.214908679],
        [12807202.416285772, 2560846.214908679],
        [12707202.416285772, 2575922.747069924],
        [12679908.694269724, 2575922.746308551]
    ],

    foamMap: './floods/Textures/Foam.png',
    normalMap: './floods/Textures/NormalMap.png',
    displacementMap: './floods/Textures/DisplacementMap.png',
    heightNoiseMap: './floods/Textures/HeightMap.png',
    heightNoiseNormalMap: './floods/Textures/HeightNormalMap.png',
    rampMap: './floods/Textures/RampMap.png',

    durationTimeScale: 1.0,
    waterNormalY: 0.2,
    normalStrength: 10,
    waterAlpha: 0.8,

    minWaterDepth: 0.0,
    maxWaterDepth: 5.0,
    minWaterDepthAlpha: 0.1,
    maxWaterDepthAlpha: 1.0,
    swapTimeMinRange: 0.75,
    swapTimeMaxRange: 1.0,

    waterShallowColor: '#008BA7',
    waterDeepColor: '#2E4A6D',
    waterShallowAlpha: 166.0 / 255.0,
    waterDeepAlpha: 228.0 / 255.0,
    depthDensity: 3.0,
    flowStrength: 1.0,
    gridResolutionA: 52,
    wavePeriodA: 1.578,
    flowVelocityStrengthA: 0.562,
    gridResolutionB: 60,
    wavePeriodB: 1.36,
    flowVelocityStrengthB: 0.512,
    gridResolutionC: 58,
    wavePeriodC: 1.66,
    flowVelocityStrengthC: 0.678,
    gridResolutionD: 54,
    wavePeriodD: 2.54,
    flowVelocityStrengthD: 0.602,
    foamMinEdge: 0.25,
    foamMaxEdge: 0.5,
    foamVelocityMaskMinEdge: 0.05,
    foamVelocityMaskMaxEdge: 0.2,
};

export type TerrainData = {
    terrainMap: string;
    terrainMapSize: [number, number];
    terrainHeightMin: number;
    terrainHeightMax: number;
    terrainCorners3857: [[number, number], [number, number], [number, number], [number, number]];

    terrainTexture?: THREE.Texture;
};

export type WaterData = {
    durationTime: number;
    waterHuvMaps: string[];
    waterHuvMapsSize: [number, number];
    waterCorners3857: [[number, number], [number, number], [number, number], [number, number]];

    waterHeightMin: number[];
    waterHeightMax: number[];
    velocityUMin: number[];
    velocityUMax: number[];
    velocityVMin: number[];
    velocityVMax: number[];
};

export type WaterStepData = {
    waterHuvMap: string;
    waterHeightMin: number;
    waterHeightMax: number;
    velocityUMin: number;
    velocityUMax: number;
    velocityVMin: number;
    velocityVMax: number;
};

export default class FloodsRenderer {
    private _map: mapboxgl.Map;
    private _scene: ThreejsSceneLayer | null;
    private _rootModel: Model | null;
    private _terrainMesh: THREE.Mesh | null;
    private _waterMesh: THREE.Mesh | null;
    private _textureLoader: THREE.TextureLoader;
    private _config: FloodsConfig = defaultConfig;
    private _floodsResources: FloodsResources;
    private _terrainData: TerrainData | null = null;
    private _waterData: WaterData | null = null;
    private _waterTextures: THREE.Texture[] = []; // 新增：在渲染器中缓存水体纹理
    private _simulationTime: number = 0.0;
    private _useConfigFile: boolean = false; // 新增变量，控制是否使用配置文件

    private currentStepBeforeWaterData: WaterStepData | null = null;
    private currentStepAfterWaterData: WaterStepData | null = null;
    private nextStepWaterData: WaterStepData | null = null;
    private currentBeforeWaterTexture: THREE.Texture | null = null;
    private currentAfterWaterTexture: THREE.Texture | null = null;
    private nextWaterTexture: THREE.Texture | null = null;
    private currentWaterStep = 0;
    private stepTime: number = 0.0;
    private stepProgressCallback: ((currentStep: number, totalSteps: number) => void) | null = null;

    constructor(map: mapboxgl.Map, nodeKey: string, simulationName: string, simulationAddress: string) {
        this._map = map;
        this._scene = null;
        this._rootModel = null;
        this._terrainMesh = null;
        this._waterMesh = null;

        this._floodsResources = new FloodsResources(nodeKey, simulationName, simulationAddress);
        this._textureLoader = new THREE.TextureLoader();

        this._map.transform._allowWorldUnderZoom = true;
    }

    async init() {
        if (this._useConfigFile) {
            await fetch('./floods/config.json')
                .then((response) => response.json())
                .then((config) => {
                    this._config = extend({}, defaultConfig, config);
                });
        } else {
            this._config = defaultConfig; // 使用默认配置
        }

        await this.initScene();
    }

    clean() {
        if (this._scene) this._map.removeLayer(this._scene.id);

        // 清理动态更新定时器
        if ((this as any)._dynamicUpdateInterval) {
            clearInterval((this as any)._dynamicUpdateInterval);
            (this as any)._dynamicUpdateInterval = null;
        }

        // 清理持续轮询定时器
        if ((this as any)._continuousPollingInterval) {
            clearInterval((this as any)._continuousPollingInterval);
            (this as any)._continuousPollingInterval = null;
        }

        // 清理纹理缓存
        this._waterTextures.forEach(texture => {
            texture.dispose();
        });
        this._waterTextures = [];

        // 停止资源轮询
        if (this._floodsResources) {
            this._floodsResources.stopPolling();
        }
    }

    async initScene() {
        console.log('Starting scene initialization...');

        // 第一步：获取初始数据并更新配置
        await this.loadInitialDataAndUpdateConfig();

        // 第二步：计算统一的中心点（使用更新后的配置）
        const center = this.calculateUnifiedNormalizationAndCenter();
        const { center4326: sceneCenter } = center;

        console.log('Scene Center:', sceneCenter);
        this._scene = new ThreejsSceneLayer({
            id: 'floods-scene',
            refCenter: sceneCenter,
        });

        this._map.addLayer(this._scene);

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const scope = this;
        // 使用计算得到的中心点
        const { center4326: modelCenter } = center;
        this._rootModel = this._scene.addModel({
            id: 'root-model',
            position: modelCenter,
            rotation: [0, 0, 0],
            scale: 1,
            offset: [0, 0, 0],
            callback: function (model) {
                if (model.children.length > 0) {
                    const group = model.children[0];

                    // 第三步：使用更新的配置创建mesh
                    // scope._terrainMesh = scope.createTerrainMesh();
                    // group.add(scope._terrainMesh);
                    scope._waterMesh = scope.createWaterMesh();
                    group.add(scope._waterMesh);

                    // 第四步：更新资源（纹理等）
                    scope.updateTerrainResources();
                    scope.updateTerrainUniforms();
                    scope.updateWaterResources();

                    // 第五步：开始持续的水体数据轮询
                    scope.startContinuousWaterPolling();

                    const onSceneUpdate = function onSceneUpdate(event: SceneUpdateEvent) {
                        scope.updateSceneTime(event.time, event.delta);
                    };
                    scope._scene?.addEventListener(SceneUpdateEventType, onSceneUpdate);
                }
            },
        });
    }

    loadTexture(image: string) {
        const textureLoader = this._textureLoader;
        const texture = textureLoader.load(image);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    // 将3857坐标转换为4326坐标系
    convert3857To4326(x: number, y: number): [number, number] {
        const lon = (x / 20037508.34) * 180;
        let lat = (y / 20037508.34) * 180;
        lat = 180 / Math.PI * (2 * Math.atan(Math.exp(lat * Math.PI / 180)) - Math.PI / 2);
        return [lon, lat];
    }

    // 计算八个角点的统一归一化和中心点
    calculateUnifiedNormalizationAndCenter(): {
        terrainNormalizedCorners: [[number, number], [number, number], [number, number], [number, number]],
        waterNormalizedCorners: [[number, number], [number, number], [number, number], [number, number]],
        center4326: [number, number]
    } {
        // 收集所有八个角点
        const allCorners3857: [number, number][] = [
            ...this._config.terrainCorners3857,
            ...this._config.waterCorners3857
        ];

        // 找到所有点的边界
        const minX = Math.min(...allCorners3857.map(p => p[0]));
        const maxX = Math.max(...allCorners3857.map(p => p[0]));
        const minY = Math.min(...allCorners3857.map(p => p[1]));
        const maxY = Math.max(...allCorners3857.map(p => p[1]));

        // 计算八个点的中心点（3857坐标系）
        const centerX3857 = (minX + maxX) / 2;
        const centerY3857 = (minY + maxY) / 2;

        // 转换中心点到4326坐标系
        const center4326 = this.convert3857To4326(centerX3857, centerY3857);

        // 计算归一化坐标（相对于中心点）
        const terrainNormalizedCorners: [[number, number], [number, number], [number, number], [number, number]] =
            this._config.terrainCorners3857.map(([x, y]) => [x - centerX3857, y - centerY3857]) as [[number, number], [number, number], [number, number], [number, number]];

        const waterNormalizedCorners: [[number, number], [number, number], [number, number], [number, number]] =
            this._config.waterCorners3857.map(([x, y]) => [x - centerX3857, y - centerY3857]) as [[number, number], [number, number], [number, number], [number, number]];

        return {
            terrainNormalizedCorners,
            waterNormalizedCorners,
            center4326
        };
    }

    // 从四个角点的归一化坐标创建BufferGeometry，功能等同于PlaneGeometry
    createGeometryFromCorners(
        corner: [[number, number], [number, number], [number, number], [number, number]],
        size: [number, number]
    ): THREE.BufferGeometry {
        const [widthSegments, heightSegments] = size;
        const [p00, p10, p11, p01] = corner.map(([x, y]) => new THREE.Vector3(x, y, 0));

        const vertices: number[] = [];
        const uvs: number[] = [];
        const indices: number[] = [];

        // 生成顶点和 UV
        for (let iy = 0; iy <= heightSegments; iy++) {
            const v = iy / heightSegments;
            for (let ix = 0; ix <= widthSegments; ix++) {
                const u = ix / widthSegments;

                // 双线性插值计算（使用归一化坐标）
                const scale = 0.93; // 缩放因子
                const px = (1 - u) * (1 - v) * p00.x +
                    u * (1 - v) * p10.x +
                    u * v * p11.x +
                    (1 - u) * v * p01.x;
                const py = (1 - u) * (1 - v) * p00.y +
                    u * (1 - v) * p10.y +
                    u * v * p11.y +
                    (1 - u) * v * p01.y;

                vertices.push(px * scale, py * scale, 0);
                uvs.push(u, v);
            }
        }

        // 生成索引（两个三角形构成一个方格）
        for (let iy = 0; iy < heightSegments; iy++) {
            for (let ix = 0; ix < widthSegments; ix++) {
                const a = iy * (widthSegments + 1) + ix;
                const b = a + 1;
                const c = a + (widthSegments + 1);
                const d = c + 1;

                indices.push(a, b, d);
                indices.push(a, d, c);
            }
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();

        return geometry;
    }

    createTerrainMesh(): THREE.Mesh {
        const lightColor = new THREE.Color(this._config.lightColor).convertLinearToSRGB();
        const lightEuler = new THREE.Euler((this._config.lightDirection[0] * Math.PI) / 180, (this._config.lightDirection[1] * Math.PI) / 180, (this._config.lightDirection[2] * Math.PI) / 180);
        const lightDirection = new THREE.Vector3(0, 0, -1).applyEuler(lightEuler);

        const terrainColor = new THREE.Color(this._config.terrainColor); //.convertLinearToSRGB();

        // 获取统一归一化的坐标
        const { terrainNormalizedCorners } = this.calculateUnifiedNormalizationAndCenter();
        const geometry = this.createGeometryFromCorners(terrainNormalizedCorners, this._config.terrainGeometrySize);
        console.log(geometry);
        const terrainNormalY = this._config.terrainNormalY;

        const terrainUniforms = {
            lightColor: { value: lightColor },
            lightDirection: { value: lightDirection },
            terrainMap: { value: null },
            terrainMapSize: { value: new THREE.Vector2(0, 0) },
            terrainColor: { value: terrainColor },
            terrainNormalY: { value: terrainNormalY },
            minTerrainHeight: { value: 0.0 },
            maxTerrainHeight: { value: 0.0 },
        };

        const material = new THREE.ShaderMaterial({
            uniforms: terrainUniforms,
            vertexShader: TerrainVertexShader,
            fragmentShader: TerrainFragmentShader,
            side: THREE.DoubleSide,
        });

        // 创建地形网格
        const terrain = new THREE.Mesh(geometry, material);
        console.log(terrain);
        return terrain;
    }

    createWaterMesh(): THREE.Mesh {
        const lightColor = new THREE.Color(this._config.lightColor).convertLinearToSRGB();
        const lightEuler = new THREE.Euler((this._config.lightDirection[0] * Math.PI) / 180, (this._config.lightDirection[1] * Math.PI) / 180, (this._config.lightDirection[2] * Math.PI) / 180);
        const lightDirection = new THREE.Vector3(0, 0, -1).applyEuler(lightEuler);

        const foamMap = this.loadTexture(this._config.foamMap);
        const normalMap = this.loadTexture(this._config.normalMap);
        const displacementMap = this.loadTexture(this._config.displacementMap);
        const heightNoiseMap = this.loadTexture(this._config.heightNoiseMap);
        const heightNoiseNormalMap = this.loadTexture(this._config.heightNoiseNormalMap);
        const rampMap = this.loadTexture(this._config.rampMap);

        foamMap.repeat = new THREE.Vector2(500, 500);

        // 获取统一归一化的坐标
        const { waterNormalizedCorners } = this.calculateUnifiedNormalizationAndCenter();
        const geometry = this.createGeometryFromCorners(waterNormalizedCorners, this._config.waterGeometrySize);

        const uniforms = {
            // 纹理
            displacementMap: { value: displacementMap },
            normalMap: { value: normalMap },
            terrainMap: { value: null },
            foamMap: { value: foamMap },
            heightNoiseMap: { value: heightNoiseMap },
            heightNoiseNormalMap: { value: heightNoiseNormalMap },
            rampMap: { value: rampMap },

            // 参数
            time: { value: 0.0 },
            timeStep: { value: 0.0 },

            lightColor: { value: lightColor },
            lightDirection: { value: lightDirection },
            huvMapSize: { value: new THREE.Vector2(0, 0) },
            terrainMapSize: { value: new THREE.Vector2(0, 0) },
            minTerrainHeight: { value: 0.0 },
            maxTerrainHeight: { value: 0.0 },

            huvMapBefore: { value: null },
            huvMapAfter: { value: null },
            minWaterHeightBefore: { value: 0.001 },
            maxWaterHeightBefore: { value: 0.01 },
            minWaterHeightAfter: { value: 0.001 },
            maxWaterHeightAfter: { value: 0.01 },
            minVelocityUBefore: { value: 0.0 },
            maxVelocityUBefore: { value: 0.0 },
            minVelocityUAfter: { value: 0.0 },
            maxVelocityUAfter: { value: 0.0 },
            minVelocityVBefore: { value: 0.0 },
            maxVelocityVBefore: { value: 0.0 },
            minVelocityVAfter: { value: 0.0 },
            maxVelocityVAfter: { value: 0.0 },

            normalStrength: { value: this._config.normalStrength },
            waterNormalY: { value: this._config.waterNormalY },
            waterAlpha: { value: this._config.waterAlpha },

            minWaterDepth: { value: this._config.minWaterDepth },
            maxWaterDepth: { value: this._config.maxWaterDepth },
            minWaterDepthAlpha: { value: this._config.minWaterDepthAlpha },
            maxWaterDepthAlpha: { value: this._config.maxWaterDepthAlpha },
            swapTimeMinRange: { value: this._config.swapTimeMinRange },
            swapTimeMaxRange: { value: this._config.swapTimeMaxRange },

            waterShallowColor: { value: new THREE.Color(this._config.waterShallowColor) },
            waterDeepColor: { value: new THREE.Color(this._config.waterDeepColor) },
            waterShallowAlpha: { value: this._config.waterShallowAlpha },
            waterDeepAlpha: { value: this._config.waterDeepAlpha },
            depthDensity: { value: this._config.depthDensity },
            flowStrength: { value: this._config.flowStrength },
            gridResolutionA: { value: this._config.gridResolutionA },
            wavePeriodA: { value: this._config.wavePeriodA },
            flowVelocityStrengthA: { value: this._config.flowVelocityStrengthA },
            gridResolutionB: { value: this._config.gridResolutionB },
            wavePeriodB: { value: this._config.wavePeriodB },
            flowVelocityStrengthB: { value: this._config.flowVelocityStrengthB },
            gridResolutionC: { value: this._config.gridResolutionC },
            wavePeriodC: { value: this._config.wavePeriodC },
            flowVelocityStrengthC: { value: this._config.flowVelocityStrengthC },
            gridResolutionD: { value: this._config.gridResolutionD },
            wavePeriodD: { value: this._config.wavePeriodD },
            flowVelocityStrengthD: { value: this._config.flowVelocityStrengthD },
            foamMinEdge: { value: this._config.foamMinEdge },
            foamMaxEdge: { value: this._config.foamMaxEdge },
            foamVelocityMaskMinEdge: { value: this._config.foamVelocityMaskMinEdge },
            foamVelocityMaskMaxEdge: { value: this._config.foamVelocityMaskMaxEdge },
        };

        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: WaterVertexShader,
            fragmentShader: WaterFragmentShader,
            transparent: true,
            depthWrite: true,
            blending: THREE.CustomBlending,
            blendSrc: THREE.SrcAlphaFactor,
            blendDst: THREE.OneMinusSrcAlphaFactor,
            blendEquation: THREE.AddEquation,
        });

        // 创建水面网格
        const water = new THREE.Mesh(geometry, material);

        return water;
    }

    // 新增方法：加载初始数据并更新配置
    async loadInitialDataAndUpdateConfig() {
        console.log('Loading initial terrain and water data...');

        // 获取地形数据
        const terrainData = await this._floodsResources.fetchTerrainData();
        console.log('Initial terrain data loaded:', terrainData);

        // 更新配置中的地形相关数据
        this._config.terrainCorners3857 = terrainData.terrainCorners3857;
        console.log('Updated terrain corners in config:', this._config.terrainCorners3857);

        // 手动获取第一批水体数据
        console.log('Fetching initial water data...');
        const success = await (this._floodsResources as any).fetchWaterDataStep();
        if (success) {
            // 获取初始水体数据
            const initialWaterData = await this._floodsResources.fetchWaterData();

            // 更新配置中的水体相关数据
            this._config.waterCorners3857 = initialWaterData.waterCorners3857;
            console.log('Updated water corners in config:', this._config.waterCorners3857);

            this.currentStepBeforeWaterData = this._floodsResources.getWaterStepData(0);
            this.currentStepAfterWaterData = this._floodsResources.getWaterStepData(0);
        }

        console.log('Initial data loading and config update completed');

    }

    // 新增方法：开始持续的水体数据轮询
    startContinuousWaterPolling() {
        console.log('Starting continuous water data polling...');

        // 设置较长的帧时长以减少闪烁
        this._floodsResources.setFrameDuration(10000);

        // 开始从远程拉取获取水体数据
        const continuousFetch = async () => {
            while (true) {
                const success = await (this._floodsResources as any).fetchWaterDataStep();
            }
        };

        // 启动连续获取进程
        continuousFetch();
    }

    async updateTerrainResources() {
        // 使用轮询机制获取的地形数据
        if (this._floodsResources.terrainData) {
            this._terrainData = this._floodsResources.terrainData;

            const textureLoader = this._textureLoader;
            const terrainTexture = textureLoader.load(this._terrainData.terrainMap);
            terrainTexture.minFilter = THREE.NearestFilter; // 或 THREE.LinearFilter
            terrainTexture.magFilter = THREE.NearestFilter; // 或 THREE.LinearFilter
            terrainTexture.generateMipmaps = false; // 禁用 Mipmap

            this._terrainData.terrainTexture = terrainTexture;

            // 更新配置中的角点信息
            this._config.terrainCorners3857 = this._terrainData.terrainCorners3857;

            console.log('Terrain resources updated with new data');
        } else {
            console.error('No terrain data available from resources');
        }
    }

    async updateWaterResources() {
        // 使用轮询机制获取的水体数据
        try {
            const data = await this._floodsResources.fetchWaterData();

            // 直接替换数据
            this._waterData = data;

            // // 检查是否有新的纹理URL需要加载
            // const currentTextureCount = this._waterTextures.length;
            // const requiredTextureCount = this._waterData.waterHuvMaps.length;

            // if (requiredTextureCount > currentTextureCount) {
            //     console.log(`Loading ${requiredTextureCount - currentTextureCount} new water textures...`);

            //     // 只加载新的纹理
            //     for (let i = currentTextureCount; i < requiredTextureCount; i++) {
            //         const textureUrl = this._waterData.waterHuvMaps[i];
            //         const waterTexture = this._textureLoader.load(textureUrl,
            //             // 纹理加载完成后的回调
            //             () => {
            //                 // 设置纹理参数
            //                 waterTexture.premultiplyAlpha = false;
            //                 waterTexture.minFilter = THREE.NearestFilter;
            //                 waterTexture.magFilter = THREE.LinearFilter;
            //                 waterTexture.generateMipmaps = false;
            //                 waterTexture.wrapS = THREE.ClampToEdgeWrapping;
            //                 waterTexture.wrapT = THREE.ClampToEdgeWrapping;
            //                 waterTexture.name = textureUrl;

            //                 // 添加到纹理缓存
            //                 this._waterTextures.push(waterTexture);
            //             },
            //             // 纹理加载进度回调
            //             undefined,
            //             // 纹理加载失败回调
            //             (error) => {
            //                 console.error(`Failed to load texture: ${textureUrl}`, error);
            //             }
            //         );


            //     }
            // }

            // 更新配置中的角点信息
            this._config.waterCorners3857 = this._waterData.waterCorners3857;

            console.log(`Water resources updated. Total textures: ${this._waterTextures.length}`);
        } catch (error) {
            console.error('Error updating water resources:', error);
        }
    }

    updateTerrainUniforms() {
        const material = this._terrainMesh?.material as THREE.ShaderMaterial;
        if (!material || !this._terrainData || !this._terrainData.terrainTexture) {
            return;
        }
        const uniforms = material.uniforms;
        uniforms.terrainMap.value = this._terrainData.terrainTexture;
        uniforms.minTerrainHeight.value = this._terrainData.terrainHeightMin;
        uniforms.maxTerrainHeight.value = this._terrainData.terrainHeightMax;
        uniforms.terrainMapSize.value = new THREE.Vector2(...this._terrainData.terrainMapSize);
    }

    updateWaterUniforms(time: number) {
        const material = this._waterMesh?.material as THREE.ShaderMaterial;
        if (!material || !this._waterData || this._waterTextures.length === 0 || !this._terrainData || !this._terrainData.terrainTexture) {
            return;
        }

        const numRasters = this._waterTextures.length;
        if (numRasters < 1) {
            return;
        }

        // 使用固定的帧时长进行连续播放
        const frameDuration = this._floodsResources.getFrameDuration();

        let currIndex = Math.floor(time / frameDuration) % numRasters;
        let nextIndex = (currIndex + 1) % numRasters;
        const timeStep = (time % frameDuration) / frameDuration;

        // 确保索引在有效范围内
        currIndex = Math.max(0, Math.min(currIndex, numRasters - 1));
        nextIndex = Math.max(0, Math.min(nextIndex, numRasters - 1));
        // 确保纹理加载完成

        if (!this._waterTextures[currIndex] || !this._waterTextures[nextIndex]) {
            console.warn('Skipping frame update: textures not fully loaded');
            return;
        }

        // 更新uniforms
        const uniforms = material.uniforms;

        uniforms.time.value = time;
        uniforms.timeStep.value = timeStep;

        uniforms.terrainMap.value = this._terrainData.terrainTexture;
        uniforms.minTerrainHeight.value = this._terrainData.terrainHeightMin;
        uniforms.maxTerrainHeight.value = this._terrainData.terrainHeightMax;
        uniforms.terrainMapSize.value = new THREE.Vector2(...this._terrainData.terrainMapSize);
        uniforms.huvMapSize.value = new THREE.Vector2(...this._waterData.waterHuvMapsSize);

        uniforms.huvMapBefore.value = this._waterTextures[currIndex];
        uniforms.huvMapAfter.value = this._waterTextures[nextIndex];

        // 确保数据数组索引有效
        if (currIndex < this._waterData.waterHeightMin.length) {
            uniforms.minWaterHeightBefore.value = this._waterData.waterHeightMin[currIndex];
            uniforms.maxWaterHeightBefore.value = this._waterData.waterHeightMax[currIndex];
            uniforms.minVelocityUBefore.value = this._waterData.velocityUMin[currIndex];
            uniforms.maxVelocityUBefore.value = this._waterData.velocityUMax[currIndex];
            uniforms.minVelocityVBefore.value = this._waterData.velocityVMin[currIndex];
            uniforms.maxVelocityVBefore.value = this._waterData.velocityVMax[currIndex];
        }

        if (nextIndex < this._waterData.waterHeightMin.length) {
            uniforms.minWaterHeightAfter.value = this._waterData.waterHeightMin[nextIndex];
            uniforms.maxWaterHeightAfter.value = this._waterData.waterHeightMax[nextIndex];
            uniforms.minVelocityUAfter.value = this._waterData.velocityUMin[nextIndex];
            uniforms.maxVelocityUAfter.value = this._waterData.velocityUMax[nextIndex];
            uniforms.minVelocityVAfter.value = this._waterData.velocityVMin[nextIndex];
            uniforms.maxVelocityVAfter.value = this._waterData.velocityVMax[nextIndex];
        }
    }

    updateWaterUniforms2(time: number, stepStartCallback: () => void) {
        // 使用固定的帧时长进行连续播放
        const frameDuration = this._floodsResources.getFrameDuration();

        let timeStep = this.stepTime / frameDuration;
        if (timeStep >= 1.0) {
            this.stepTime = 0.0;
            timeStep = 0.0
        }

        if (this.stepTime === 0.0) {
            console.log("currentStep:", this.currentWaterStep)
            stepStartCallback();
        }

        // 更新uniforms
        const material = this._waterMesh?.material as THREE.ShaderMaterial;
        if (!material || !this._terrainData || !this._waterData || !this.currentBeforeWaterTexture || !this.currentAfterWaterTexture) {
            return;
        }

        const uniforms = material.uniforms;

        uniforms.time.value = time;
        uniforms.timeStep.value = timeStep;

        uniforms.terrainMap.value = this._terrainData.terrainTexture;
        uniforms.minTerrainHeight.value = this._terrainData.terrainHeightMin;
        uniforms.maxTerrainHeight.value = this._terrainData.terrainHeightMax;
        uniforms.terrainMapSize.value = new THREE.Vector2(...this._terrainData.terrainMapSize);

        if (!this.currentStepBeforeWaterData || !this.currentStepAfterWaterData) {
            return;
        }

        uniforms.huvMapSize.value = new THREE.Vector2(...this._waterData.waterHuvMapsSize);

        uniforms.huvMapBefore.value = this.currentBeforeWaterTexture;
        uniforms.huvMapAfter.value = this.currentAfterWaterTexture;

        uniforms.minWaterHeightBefore.value = this.currentStepBeforeWaterData.waterHeightMin;
        uniforms.maxWaterHeightBefore.value = this.currentStepBeforeWaterData.waterHeightMax;
        uniforms.minVelocityUBefore.value = this.currentStepBeforeWaterData.velocityUMin;
        uniforms.maxVelocityUBefore.value = this.currentStepBeforeWaterData.velocityUMax;
        uniforms.minVelocityVBefore.value = this.currentStepBeforeWaterData.velocityVMin;
        uniforms.maxVelocityVBefore.value = this.currentStepBeforeWaterData.velocityVMax;

        uniforms.minWaterHeightAfter.value = this.currentStepAfterWaterData.waterHeightMin;
        uniforms.maxWaterHeightAfter.value = this.currentStepAfterWaterData.waterHeightMax;
        uniforms.minVelocityUAfter.value = this.currentStepAfterWaterData.velocityUMin;
        uniforms.maxVelocityUAfter.value = this.currentStepAfterWaterData.velocityUMax;
        uniforms.minVelocityVAfter.value = this.currentStepAfterWaterData.velocityVMin;
        uniforms.maxVelocityVAfter.value = this.currentStepAfterWaterData.velocityVMax;
    }

    updateSceneTime(time: number, delta: number) {
        this._simulationTime += delta;
        this.stepTime += delta;
        this.updateWaterUniforms2(this._simulationTime, this.handleWaterStepStart.bind(this));
    }

    handleWaterStepStart() {
        if (this.nextStepWaterData) {
            this.currentStepBeforeWaterData = this.currentStepAfterWaterData;
            this.currentStepAfterWaterData = this.nextStepWaterData;
            this.currentBeforeWaterTexture?.dispose();
            this.currentBeforeWaterTexture = this.currentAfterWaterTexture;
            this.currentAfterWaterTexture = this.nextWaterTexture;
        } else {
            console.log("WaterStepStart!!!")
            // 第一次执行该函数，此时before和after均为第一个步长的数据，需初始化纹理
            const textureUrl = this.currentStepBeforeWaterData?.waterHuvMap;
            if (!textureUrl) {
                return;
            }
            const texture = this._textureLoader.load(textureUrl,
                () => {
                    texture.premultiplyAlpha = false;
                    texture.minFilter = THREE.NearestFilter;
                    texture.magFilter = THREE.LinearFilter;
                    texture.generateMipmaps = false;
                    texture.wrapS = THREE.ClampToEdgeWrapping;
                    texture.wrapT = THREE.ClampToEdgeWrapping;
                    texture.name = textureUrl;
                    this.currentBeforeWaterTexture = texture;
                    this.currentAfterWaterTexture = texture;
                }
            )
        }

        const nextStep = this._floodsResources.getNextStep(this.currentWaterStep);
        const _nextStepWaterData = this._floodsResources.getWaterStepData(nextStep);

        if (!_nextStepWaterData) {
            console.log("未加载下一个水流数据！")
            return;
        }

        const newTextureUrl = _nextStepWaterData.waterHuvMap;
        const newTexture = this._textureLoader.load(newTextureUrl,
            () => {
                console.log("texture of nextStep loaded:" + nextStep)
                newTexture.premultiplyAlpha = false;
                newTexture.minFilter = THREE.NearestFilter;
                newTexture.magFilter = THREE.LinearFilter;
                newTexture.generateMipmaps = false;
                newTexture.wrapS = THREE.ClampToEdgeWrapping;
                newTexture.wrapT = THREE.ClampToEdgeWrapping;
                newTexture.name = newTextureUrl;
                this.nextWaterTexture = newTexture;
                this.nextStepWaterData = _nextStepWaterData;
                console.log(newTexture, this.nextStepWaterData)
            }
        )
        this.currentWaterStep = nextStep;
        this.stepProgressCallback?.(this.currentWaterStep, this._floodsResources.getStepCount())
    }

    subscribeStepProgress(callback: (currentStep: number, totalSteps: number) => void) {
        this.stepProgressCallback = callback
        return () => {
            this.stepProgressCallback = null
        }
    }
}
