import { CustomLayerInterface } from "mapbox-gl";

export default class TerrainByProxyTile implements CustomLayerInterface  {
    constructor(id: string, tileUrl: string, name: string);
}