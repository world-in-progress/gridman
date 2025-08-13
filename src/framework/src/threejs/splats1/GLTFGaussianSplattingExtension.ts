import { Box3, BufferGeometry, Camera, Group, Mesh, Sphere, Vector3 } from 'three';
import { GLTFLoaderPlugin, GLTFParser } from 'three/examples/jsm/loaders/GLTFLoader.js';

import { GaussianSplattingScene } from './GaussianSplattingScene';

const EXT_NAME = 'KHR_gaussian_splatting';

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

export class GLTFGaussianSplattingExtension implements GLTFLoaderPlugin {
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

                return new Promise(resolve => {
                    resolve(splatMesh);
                });
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

            let geometryPromise = this.addPrimitiveAttributes(new BufferGeometry(), primitive, parser);

            pending.push(geometryPromise);
        }

        return Promise.all(pending);
    }

    /**
     * @param {BufferGeometry} geometry
     * @param {GLTF.Primitive} primitiveDef
     * @param {GLTFParser} parser
     * @return {Promise<BufferGeometry>}
     */
    addPrimitiveAttributes(geometry: BufferGeometry, primitiveDef, parser) {
        const attributes = primitiveDef.attributes;

        const pending = [];

        function assignAttributeAccessor(accessorIndex, attributeName) {
            return parser.getDependency('accessor', accessorIndex).then(function (accessor) {
                geometry.setAttribute(attributeName, accessor);
            });
        }

        for (const gltfAttributeName in attributes) {
            const threeAttributeName = ATTRIBUTES[gltfAttributeName] || gltfAttributeName.toLowerCase();

            // Skip attributes already provided by e.g. Draco extension.
            if (threeAttributeName in geometry.attributes) continue;

            pending.push(assignAttributeAccessor(attributes[gltfAttributeName], threeAttributeName));
        }

        if (primitiveDef.indices !== undefined && !geometry.index) {
            const accessor = parser.getDependency('accessor', primitiveDef.indices).then(function (accessor) {
                geometry.setIndex(accessor);
            });

            pending.push(accessor);
        }

        computeBounds(geometry, primitiveDef, parser);

        return Promise.all(pending).then(function () {
            return geometry;
        });
    }
}

/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 */
function computeBounds(geometry, primitiveDef, parser) {
    const attributes = primitiveDef.attributes;

    const box = new Box3();

    if (attributes.POSITION !== undefined) {
        const accessor = parser.json.accessors[attributes.POSITION];

        const min = accessor.min;
        const max = accessor.max;

        // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

        if (min !== undefined && max !== undefined) {
            box.set(new Vector3(min[0], min[1], min[2]), new Vector3(max[0], max[1], max[2]));

            if (accessor.normalized) {
                const boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
                box.min.multiplyScalar(boxScale);
                box.max.multiplyScalar(boxScale);
            }
        } else {
            console.warn('THREE.GLTFLoader: Missing min/max properties for accessor POSITION.');

            return;
        }
    } else {
        return;
    }

    const targets = primitiveDef.targets;

    if (targets !== undefined) {
        const maxDisplacement = new Vector3();
        const vector = new Vector3();

        for (let i = 0, il = targets.length; i < il; i++) {
            const target = targets[i];

            if (target.POSITION !== undefined) {
                const accessor = parser.json.accessors[target.POSITION];
                const min = accessor.min;
                const max = accessor.max;

                // glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

                if (min !== undefined && max !== undefined) {
                    // we need to get max of absolute components because target weight is [-1,1]
                    vector.setX(Math.max(Math.abs(min[0]), Math.abs(max[0])));
                    vector.setY(Math.max(Math.abs(min[1]), Math.abs(max[1])));
                    vector.setZ(Math.max(Math.abs(min[2]), Math.abs(max[2])));

                    if (accessor.normalized) {
                        const boxScale = getNormalizedComponentScale(WEBGL_COMPONENT_TYPES[accessor.componentType]);
                        vector.multiplyScalar(boxScale);
                    }

                    // Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
                    // to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
                    // are used to implement key-frame animations and as such only two are active at a time - this results in very large
                    // boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
                    maxDisplacement.max(vector);
                } else {
                    console.warn('THREE.GLTFLoader: Missing min/max properties for accessor POSITION.');
                }
            }
        }

        // As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.
        box.expandByVector(maxDisplacement);
    }

    geometry.boundingBox = box;

    const sphere = new Sphere();

    box.getCenter(sphere.center);
    sphere.radius = box.min.distanceTo(box.max) / 2;

    geometry.boundingSphere = sphere;
}

function getNormalizedComponentScale(constructor) {
    // Reference:
    // https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data

    switch (constructor) {
        case Int8Array:
            return 1 / 127;

        case Uint8Array:
            return 1 / 255;

        case Int16Array:
            return 1 / 32767;

        case Uint16Array:
            return 1 / 65535;

        default:
            throw new Error('THREE.GLTFLoader: Unsupported normalized accessor component type.');
    }
}
