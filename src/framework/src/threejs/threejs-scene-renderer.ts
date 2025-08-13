import { type Map as MapboxMap } from 'mapbox-gl';

import ThreejsUtils from './threejs-utils';

import { WebGLRenderer } from 'three';

import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export default class ThreejsSceneRenderer {
    private _map: MapboxMap;
    private _renderer: WebGLRenderer;
    private _labelRenderer: CSS2DRenderer;

    constructor(map: MapboxMap, gl: WebGL2RenderingContext) {
        this._map = map;

        ThreejsUtils.initRenderer({ map, gl });
        this._renderer = ThreejsUtils.getRenderer();
        this._labelRenderer = ThreejsUtils.getLabelRenderer();
    }

    getRenderer() {
        return this._renderer;
    }

    render(scene, camera) {
        this._renderer.resetState();

        // render scene
        this._renderer.render(scene, camera);

        // render label
        this._labelRenderer.render(scene, camera);
    }
}
