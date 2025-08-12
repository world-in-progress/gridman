import { Map, CustomLayerInterface } from "mapbox-gl";

export default class TerrainByProxyTile implements CustomLayerInterface {
	constructor(id: string, tileUrl: string, bbox: number[], elevationRange?: [number, number], defaultParams?: object)

	readonly id: string;
	readonly type: 'custom';
	readonly renderingMode?: '2d' | '3d';

	onAdd(map: Map, gl: WebGLRenderingContext): void;
	render(gl: WebGLRenderingContext, matrix: number[]): void;
	onRemove?(map: Map): void;
	getParams(): {
		exaggeration: number;
		opacity: number;
		palette: number;
		reversePalette: boolean;
		lightPos: [number, number, number];
	};
	updateParams(updateSet: Partial<{
		exaggeration: number;
		opacity: number;
		lightPos: [number, number, number];
		palette: number;
		reversePalette: boolean;
		[key: string]: any;
	}>): void;
}