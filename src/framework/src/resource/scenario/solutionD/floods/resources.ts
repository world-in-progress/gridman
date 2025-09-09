import { TerrainData, WaterData, WaterStepData } from './renderer';
import * as apis from '@/core/apis/apis'

export default class FloodsResources {
    public terrainData: TerrainData | null = null;
    private waterData: WaterData = {
        durationTime: 0,
        waterHuvMaps: [],
        waterHuvMapsSize: [0, 0] as [number, number],
        waterCorners3857: [
            [0, 0], [0, 0], [0, 0], [0, 0]
        ] as [[number, number], [number, number], [number, number], [number, number]],
        waterHeightMin: [],
        waterHeightMax: [],
        velocityUMin: [],
        velocityUMax: [],
        velocityVMin: [],
        velocityVMax: []
    };
    private currentWaterStep = 1;
    private pollingIntervalId: number | null = null;
    private isPolling = false;
    private isDataReady = false;
    private renderReadyCallback: (() => void) | null = null;
    private nodeKey: string;
    private simulationName: string;
    private simulationAddress: string;

    // 记录每一帧的单帧时长（毫秒）
    private frameDuration: number = 3000;
    private maxStepCount: number = 99999;

    constructor(nodeKey: string, simulationName: string, simulationAddress: string) {
        this.nodeKey = nodeKey;
        this.simulationName = simulationName;
        this.simulationAddress = simulationAddress;
        console.log('FloodsResources initialized');
    }

    // 设置帧时长
    setFrameDuration(frameDuration: number): void {
        this.frameDuration = frameDuration;
        console.log(`Frame duration set to: ${this.frameDuration}ms`);
    }

    // 获取 TerrainData（仅获取一次）
    async fetchTerrainData(): Promise<TerrainData> {
        if (this.terrainData) {
            return this.terrainData;
        }
        // const response = await fetch('http://192.168.31.201:8001/api/solution/get_terrain_data/root.solutions.solution4');

        const result = await apis.solution.getTerrainData.fetch(this.nodeKey, false);

        if (result.success) {
            // 直接使用后端提供的地形图像路径和角点数据
            // 按照左下、右下、右上、左上的顺序组装角点数组
            const terrainCorners: [[number, number], [number, number], [number, number], [number, number]] = [
                result.data.lower_left,   // 左下
                result.data.lower_right,  // 右下
                result.data.upper_right,  // 右上
                result.data.upper_left    // 左上
            ];

            this.terrainData = {
                terrainMap: result.data.terrainMap,
                terrainMapSize: result.data.terrainMapSize,
                terrainHeightMin: result.data.terrainHeightMin,
                terrainHeightMax: result.data.terrainHeightMax,
                terrainCorners3857: terrainCorners,
            };

            console.log('TerrainData fetched successfully:');
            return this.terrainData;
        } else {
            throw new Error('Failed to fetch terrain data');
        }

    }

    // 轮询获取 WaterData
    async fetchWaterDataStep(): Promise<boolean> {
        try {
            // 确保轮询状态为true
            if (!this.isPolling) {
                this.isPolling = true;
            }

            if (this.currentWaterStep > this.maxStepCount) {
                return false;
            }

            let stepResultRes;
            let pollCount = 0;
            const maxPollCount = 200;
            const pollInterval = 1000;

            do {
                // 检查是否应该停止轮询
                if (!this.isPolling) {
                    console.log('Polling stopped by user request');
                    return false;
                }

                stepResultRes = await apis.simulation.getSimulationResult.fetch({
                    simulation_name: this.simulationName,
                    simulation_address: this.simulationAddress,
                    step: this.currentWaterStep
                }, true);

                if (!stepResultRes.success) {
                    pollCount++;

                    if (pollCount >= maxPollCount) {
                        console.warn(`Max polling count reached for step ${this.currentWaterStep}`);
                        // 此时当前步长已超越最大步长
                        this.maxStepCount = this.currentWaterStep - 1;
                        return false;
                    }

                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }
            } while (!stepResultRes.success);

            const result = await apis.simulation.getWaterData.fetch({
                simulation_name: this.simulationName,
                step: this.currentWaterStep
            }, true);

            if (result.success) {
                // 直接使用后端提供的水体图像路径
                // 累计持续时间
                this.waterData.durationTime += result.data.durationTime;

                // 尺寸只存储一次
                if (this.waterData.waterHuvMapsSize[0] === 0) {
                    this.waterData.waterHuvMapsSize = result.data.waterHuvMapsSize;
                }

                // 角点数据只存储一次（假设所有水体数据使用相同的角点）
                if (this.waterData.waterCorners3857[0][0] === 0) {
                    // 按照左下、右下、右上、左上的顺序组装角点数组
                    const waterCorners: [[number, number], [number, number], [number, number], [number, number]] = [
                        result.data.lower_left,   // 左下
                        result.data.lower_right,  // 右下
                        result.data.upper_right,  // 右上
                        result.data.upper_left    // 左上
                    ];
                    this.waterData.waterCorners3857 = waterCorners;
                }

                // 添加到数组
                this.waterData.waterHuvMaps.push(result.data.waterHuvMaps);
                this.waterData.waterHeightMin.push(result.data.waterHeightMin);
                this.waterData.waterHeightMax.push(result.data.waterHeightMax);
                this.waterData.velocityUMin.push(result.data.velocityUMin);
                this.waterData.velocityUMax.push(result.data.velocityUMax);
                this.waterData.velocityVMin.push(result.data.velocityVMin);
                this.waterData.velocityVMax.push(result.data.velocityVMax);

                // console.log(`WaterData step ${this.currentWaterStep} fetched successfully. Total maps: ${this.waterData.waterHuvMaps.length}`);

                // 递增步数，准备获取下一步数据
                this.currentWaterStep++;

                // 当获取到第一个 WaterData 时，标记数据准备就绪
                if (this.waterData.waterHuvMaps.length === 1 && !this.isDataReady) {
                    this.isDataReady = true;

                    // 触发渲染准备回调
                    if (this.terrainData && this.renderReadyCallback) {
                        console.log('Initial data ready - triggering render');
                        this.renderReadyCallback();
                        this.renderReadyCallback = null; // 只触发一次
                    }
                }
            }
            return true
        } catch (error) {
            console.warn(error)
            return true;
        }
    }

    // 返回水体数据（用于渲染）
    fetchWaterData(): Promise<WaterData> {
        return new Promise<WaterData>((resolve, reject) => {
            if (this.isDataReady && this.waterData.waterHuvMaps.length > 0) {
                // 设置帧时长
                this.waterData.durationTime = this.frameDuration;
                console.log(`Returning water data with ${this.waterData.waterHuvMaps.length} texture URLs`);
                resolve(this.waterData);
            } else {
                reject(new Error('Water data not ready. Call startPolling() first.'));
            }
        });
    }

    // 检查数据是否准备就绪
    isDataCreated(): boolean {
        return this.isDataReady;
    }

    // 检查是否准备好渲染（TerrainData已获取且水体数据已准备就绪）
    isReadyForRender(): boolean {
        return this.terrainData !== null && this.isDataReady;
    }

    // 获取当前帧时长
    getFrameDuration(): number {
        return this.frameDuration;
    }

    // 获取当前动态数据的帧数
    getCurrentFrameCount(): number {
        return this.waterData.waterHuvMaps.length;
    }

    getWaterStepData(step: number): WaterStepData | null {
        // 检查数组是否为空
        if (this.waterData.waterHuvMaps.length <= step) {
            return null;
        }

        // 返回包含最后一个值的新对象
        return {
            waterHuvMap: this.waterData.waterHuvMaps[step],
            waterHeightMin: this.waterData.waterHeightMin[step],
            waterHeightMax: this.waterData.waterHeightMax[step],
            velocityUMin: this.waterData.velocityUMin[step],
            velocityUMax: this.waterData.velocityUMax[step],
            velocityVMin: this.waterData.velocityVMin[step],
            velocityVMax: this.waterData.velocityVMax[step]
        };
    }

    getNextStep(step: number): number {
        if (step === this.waterData.waterHuvMaps.length - 1) {
            return 0;
        }
        return step + 1;
    }

    getStepCount(): number {
        return this.waterData.waterHuvMaps.length;
    }

    stopPolling() {
        this.isPolling = false;
    }
}
