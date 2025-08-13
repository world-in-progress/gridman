import { Box3, BufferAttribute, BufferGeometry, Camera, Group, Mesh } from 'three';
import { GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { GaussianCloud, loadSpz } from "@spz-loader/core";
import { GaussianSplattingScene } from './GaussianSplattingScene';

const EXT_NAME = 'KHR_spz_gaussian_splats_compression';

const ATTRIBUTES = {
    POSITION: 'position',
    COLOR_0: 'color',
    _SCALE: 'scale',
    _ROTATION: 'rotation',
    _OPACITY: 'opacity',
};

const WEBGL_COMPONENT_TYPES = {
    5120: Int8Array,
    5121: Uint8Array,
    5122: Int16Array,
    5123: Uint16Array,
    5125: Uint32Array,
    5126: Float32Array,
};

export class GLTFGaussianSplattingSpzExtension implements GLTFLoaderPlugin {
    name: string;
    parser: GLTFParser;
    camera: Camera;

    constructor(parser: GLTFParser, camera?: Camera) {
        this.parser = parser;
        this.camera = camera;
        this.name = EXT_NAME;
    }

    loadMesh(meshIndex: number): Promise<Group | Mesh> | null {
        const parser = this.parser;
        const camera = this.camera;
        // skip if the extension is not present
        const extensionsUsed = parser.json.extensionsUsed;
        if (!extensionsUsed || !extensionsUsed.includes(EXT_NAME)) {
            return;
        }

        // load the remote schema definition if present
        const json = parser.json;

        const meshDef = json.meshes[meshIndex];
        const primitives = meshDef.primitives;

        const pending = [];

        pending.push(this.loadGeometries(primitives));

        return Promise.all(pending).then(function (results) {
            const geometries = results[results.length - 1];

            const pending = [];

            function loadGaussianSplattingMesh(geometry, primitive) {
                const splatMesh = new GaussianSplattingScene();
                splatMesh.geometry = geometry;
                return splatMesh;
            }

            for (let i = 0, il = geometries.length; i < il; i++) {
                const geometry = geometries[i];
                pending.push(loadGaussianSplattingMesh(geometry, i));
            }

            return Promise.all(pending).then((splatMeshes) => {
                const group = new Group();
                for (let i = 0, il = splatMeshes.length; i < il; i++) {
                    const splatMesh = splatMeshes[i];

                    group.add(splatMesh);
                }
                parser.associations.set(group, { meshes: meshIndex });
                return group;
            });
        });
    }

    /**
     * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
     *
     * Creates BufferGeometries from primitives.
     */
    loadGeometries(primitives: Array<any>): Promise<Array<BufferGeometry>> {
        const parser = this.parser;

        const pending = [];

        for (let i = 0, il = primitives.length; i < il; i++) {
            const primitive = primitives[i];

            let geometryPromise;

            if ( primitive.extensions && primitive.extensions[ this.name ] ) {

                geometryPromise = this.decodePrimitive( primitive, parser );

            } else {
                geometryPromise = new Promise(resolve => {  
                    return new BufferGeometry();
                });
            }

            pending.push(geometryPromise);
        }

        return Promise.all(pending);
    }



	decodePrimitive( primitive, parser ): Promise<BufferGeometry> {
        
		const bufferViewIndex = primitive.extensions[ this.name ].bufferView;
        
		return parser.getDependency( 'bufferView', bufferViewIndex ).then( function ( bufferView ) {

			return new Promise( function ( resolve, reject ) {

                try {

                    loadSpz( bufferView).then( function ( gsCloud ) {

                        const geometry = new BufferGeometry();
                        geometry.setAttribute('position', new BufferAttribute(gsCloud.positions, 3, false));
                        geometry.setAttribute('color', new BufferAttribute(gsCloud.colors, 3, false));
                        geometry.setAttribute('opacity', new BufferAttribute(gsCloud.alphas, 1, false));
                        geometry.setAttribute('scale', new BufferAttribute(gsCloud.scales, 3, false));
                        geometry.setAttribute('rotation', new BufferAttribute(gsCloud.rotations, 4, false));

                        resolve( geometry );
                    });

                } catch (error) {

                    reject();

                }
            });

		} );
    }


}
