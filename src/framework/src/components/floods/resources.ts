import { TerrainData, WaterData } from './renderer';

export default class FloodsResources {
    constructor() {}

    fetchTerrainData(): Promise<TerrainData> {
        // TODO: fetch terrain resource data from server
        return new Promise<TerrainData>((resolve) => {
            const terrainData = {
                terrainMap: './floods/Resources/DEM1.png',
                
                terrainMapSize: [5031, 2753] as [number, number],
                terrainHeightMin: -11.35142,
                terrainHeightMax: 847.2994,
            };

            return resolve(terrainData);
        });
    }

    fetchWaterData(): Promise<WaterData> {
        // TODO: fetch water resource data from server
        return new Promise<WaterData>((resolve) => {
            const waterData = {
                durationTime: 5000,
                waterHuvMaps: [
                    './floods/Resources/huv/huv_0.png',
                    './floods/Resources/huv/huv_1.png',
                    // './floods/Resources/huv/huv_2.png',
                    // './floods/Resources/huv/huv_3.png',
                    // './floods/Resources/huv/huv_4.png',
                    // './floods/Resources/huv/huv_5.png',
                    // './floods/Resources/huv/huv_6.png',
                    // './floods/Resources/huv/huv_7.png',
                    // './floods/Resources/huv/huv_8.png',
                ],
                waterHuvMapsSize: [5031, 2753] as [number, number],
                waterHeightMin: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
                waterHeightMax: [12.16459846496582, 12.405220985412598, 12.055933952331543, 12.255563735961914, 13.065625190734863, 17.13294219970703, 19.82972526550293, 20.09884262084961, 20.108835220336914],
                velocityUMin: [-0.31911158561706543, -1.1285579204559326, -1.5455865859985352, -0.2689962387084961, -2.248750925064087, -4.991427421569824, -5.0, -5.0, -5.0],
                velocityUMax: [3.726897954940796, 0.5173403024673462, 0.2561565041542053, 0.21410520374774933, 5.000000476837158, 5.0, 5.0],
                velocityVMin: [-1.3336925506591797, -0.432312548160553, -1.4641011953353882, -0.6702648997306824, -4.999998092651367, -4.999999523162842, -4.999998092651367, -4.999999523162842, -5.0],
                velocityVMax: [3.334287405014038, 0.5072693228721619, 1.1337794065475464, 0.2184210866689682, 4.147226810455322, 4.65350341796875, 4.999999523162842, 5.0, 5.0],
            };

            return resolve(waterData);
        });
    }
}
