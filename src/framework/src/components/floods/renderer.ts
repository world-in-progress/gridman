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
    terrainGeometrySize: [number, number, number, number];
    terrainNormalY: number;

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
    terrainGeometrySize: [25155, 13765, 640, 640],
    terrainNormalY: 0.2,

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

    terrainTexture?: THREE.Texture;
};

export type WaterData = {
    durationTime: number;
    waterHuvMaps: string[];
    waterHuvMapsSize: [number, number];

    waterHeightMin: number[];
    waterHeightMax: number[];
    velocityUMin: number[];
    velocityUMax: number[];
    velocityVMin: number[];
    velocityVMax: number[];

    waterTextures?: THREE.Texture[];
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
    private _simulationTime: number = 0.0;

    constructor(map: mapboxgl.Map) {
        this._map = map;
        this._scene = null;
        this._rootModel = null;
        this._terrainMesh = null;
        this._waterMesh = null;

        this._floodsResources = new FloodsResources();
        this._textureLoader = new THREE.TextureLoader();

        //@ts-ignore
        this._map.transform._allowWorldUnderZoom = true;
        this._map.on('load', async () => {
            await fetch('./floods/config.json')
                .then((response) => response.json())
                .then((config) => {
                    this._config = extend({}, defaultConfig, config);
                });

            this.initScene();
        });
    }

    clean() {
        if (this._scene) this._map.removeLayer(this._scene.id);
    }

    initScene() {
        this._scene = new ThreejsSceneLayer({
            id: 'floods-scene',
            refCenter: this._config.center,
        });

        this._map.addLayer(this._scene);

        // const tileUrl = 'http://192.168.31.159:8000/api/raster/tile/root.dems.raster0724/{z}/{x}/{y}.png';

        // // 添加数据源 - 调整配置以确保瓦片正确加载
        // map.addSource('mapbox-dem', {
        //     type: 'raster-dem',
        //     tiles: [tileUrl],
        //     tileSize: 256,
        //     maxzoom: 18,
        //     minzoom: 0,
        //     scheme: 'xyz',
        //     // 添加错误处理配置
        //     volatile: false, // 防止频繁重新加载
        // });

        // // add the DEM source as a terrain layer with exaggerated height
        // map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 });

        // // 添加图层
        // map.addLayer({
        //   id: 'dem-test',
        //   type: "raster",
        //   source: 'dem-test',
        //   paint: {
        //     "raster-opacity": 0.8, // 稍微降低透明度以便调试
        //     "raster-fade-duration": 0, // 减少淡入时间
        //   },
        // });
        
        // const tileset = this._scene.addTileset({
        //     id: 'test1',
        //     url: 'https://services1.map.gov.hk/api/3d-data/3dtiles/ntwc1_f2/tileset.json?key=ad5940a63bd344c48b0351ef1c7a905e',
        //     // url:'http://localhost:8804/6-NW-9D/tileset.json'
        // });

        // tileset.position.z -= 300;

        const scope = this;
        this._rootModel = this._scene.addModel({
            id: 'root-model',
            position: this._config.center,
            rotation: [0, 0, 0],
            scale: 1,
            offset: [0, 0, 0],
            callback: function (model) {
                if (model.children.length > 0) {
                    const group = model.children[0];
                    scope._terrainMesh = scope.createTerrainMesh();
                    group.add(scope._terrainMesh);
                    scope._waterMesh = scope.createWaterMesh();
                    group.add(scope._waterMesh);

                    scope.updateTerrainResources();
                    scope.updateWaterResources();

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

    createTerrainMesh(): THREE.Mesh {
        const lightColor = new THREE.Color(this._config.lightColor).convertLinearToSRGB();
        const lightEuler = new THREE.Euler((this._config.lightDirection[0] * Math.PI) / 180, (this._config.lightDirection[1] * Math.PI) / 180, (this._config.lightDirection[2] * Math.PI) / 180);
        const lightDirection = new THREE.Vector3(0, 0, -1).applyEuler(lightEuler);

        const terrainColor = new THREE.Color(this._config.terrainColor); //.convertLinearToSRGB();

        const geometry = new THREE.PlaneGeometry(...this._config.terrainGeometrySize);
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

        const geometry = new THREE.PlaneGeometry(...this._config.terrainGeometrySize);

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

    async updateTerrainResources() {
        this._floodsResources.fetchTerrainData().then((data) => {
            this._terrainData = data;

            const textureLoader = this._textureLoader;
            const terrainTexture = textureLoader.load(this._terrainData.terrainMap);
            terrainTexture.minFilter = THREE.NearestFilter; // 或 THREE.LinearFilter
            terrainTexture.magFilter = THREE.NearestFilter; // 或 THREE.LinearFilter
            terrainTexture.generateMipmaps = false; // 禁用 Mipmap

            this._terrainData.terrainTexture = terrainTexture;
        });
    }

    async updateWaterResources() {
        this._floodsResources.fetchWaterData().then((data) => {
            this._waterData = data;

            const textureLoader = this._textureLoader;
            const waterTextures = this._waterData.waterHuvMaps.map((element) => {
                const waterTexture = textureLoader.load(element);
                waterTexture.premultiplyAlpha = false;

                // 设置纹理参数
                waterTexture.minFilter = THREE.NearestFilter; // 或 THREE.LinearFilter
                waterTexture.magFilter = THREE.LinearFilter; // 或 THREE.LinearFilter
                waterTexture.generateMipmaps = false; // 禁用 Mipmap

                // 如果需要，可以设置纹理的其他参数
                waterTexture.wrapS = THREE.ClampToEdgeWrapping; // 禁用重复
                waterTexture.wrapT = THREE.ClampToEdgeWrapping;
                waterTexture.name = element;
                return waterTexture;
            });
            this._waterData.waterTextures = waterTextures;
        });
    }

    updateTerrainUniforms(time: number) {
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
        if (!material || !this._waterData || !this._waterData.waterTextures || !this._terrainData || !this._terrainData.terrainTexture) {
            return;
        }

        const numRasters = this._waterData.waterTextures.length;
        if (numRasters < 1) {
            return;
        }

        const durationTime = this._waterData.durationTime * this._config.durationTimeScale;

        const currIndex = Math.floor(time / durationTime) % numRasters;
        const nextIndex = (currIndex + 1) % numRasters;

        // 更新uniforms
        const uniforms = material.uniforms;

        uniforms.time.value = time;
        uniforms.timeStep.value = (time % durationTime) / durationTime; // 将时间归一化到0-1范围

        uniforms.terrainMap.value = this._terrainData.terrainTexture;
        uniforms.minTerrainHeight.value = this._terrainData.terrainHeightMin;
        uniforms.maxTerrainHeight.value = this._terrainData.terrainHeightMax;
        uniforms.terrainMapSize.value = new THREE.Vector2(...this._terrainData.terrainMapSize);
        uniforms.huvMapSize.value = new THREE.Vector2(...this._waterData.waterHuvMapsSize);

        uniforms.huvMapBefore.value = this._waterData.waterTextures[currIndex];
        uniforms.huvMapAfter.value = this._waterData.waterTextures[nextIndex];

        uniforms.minWaterHeightBefore.value = this._waterData.waterHeightMin[currIndex];
        uniforms.maxWaterHeightBefore.value = this._waterData.waterHeightMax[currIndex];
        uniforms.minWaterHeightAfter.value = this._waterData.waterHeightMin[nextIndex];
        uniforms.maxWaterHeightAfter.value = this._waterData.waterHeightMax[nextIndex];

        uniforms.minVelocityUBefore.value = this._waterData.velocityUMin[currIndex];
        uniforms.maxVelocityUBefore.value = this._waterData.velocityUMax[currIndex];
        uniforms.minVelocityVBefore.value = this._waterData.velocityVMin[currIndex];
        uniforms.maxVelocityVBefore.value = this._waterData.velocityVMax[currIndex];
        uniforms.minVelocityUAfter.value = this._waterData.velocityUMin[nextIndex];
        uniforms.maxVelocityUAfter.value = this._waterData.velocityUMax[nextIndex];
        uniforms.minVelocityVAfter.value = this._waterData.velocityVMin[nextIndex];
        uniforms.maxVelocityVAfter.value = this._waterData.velocityVMax[nextIndex];
    }

    updateSceneTime(time: number, delta: number) {
        this._simulationTime += delta;
        this.updateTerrainUniforms(this._simulationTime);
        this.updateWaterUniforms(this._simulationTime);
    }
}
