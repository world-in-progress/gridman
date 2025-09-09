import { BufferAttribute, BufferGeometry, DynamicDrawUsage, InstancedBufferAttribute, InstancedBufferGeometry } from 'three';

export class GaussianSplattingGeometry {
    static build(maxSplatCount = 1, useQuad = false) {
        const baseGeometry = new BufferGeometry();

        // Use an intanced quad or triangle. Triangle might be a bit faster because of less shader invocation but I didn't see any difference.
        // Keeping both and use triangle for now.
        // for quad, use following lines

        if (useQuad) {
            baseGeometry.setIndex([0, 1, 2, 0, 2, 3]);

            // Vertices for the instanced quad
            const positionsArray = new Float32Array(4 * 3);
            const positions = new BufferAttribute(positionsArray, 3);
            baseGeometry.setAttribute('position', positions);
            positions.setXYZ(0, -2.0, -2.0, 0.0);
            positions.setXYZ(1, -2.0, 2.0, 0.0);
            positions.setXYZ(2, 2.0, 2.0, 0.0);
            positions.setXYZ(3, 2.0, -2.0, 0.0);
            positions.needsUpdate = true;
        } else {
            baseGeometry.setIndex([0, 1, 2]);

            // Vertices for the instanced triangle
            const positionsArray = new Float32Array(3 * 3);
            const positions = new BufferAttribute(positionsArray, 3);
            baseGeometry.setAttribute('position', positions);
            positions.setXYZ(0, -3.0, -2.0, 0.0);
            positions.setXYZ(1, 3.0, -2.0, 0.0);
            positions.setXYZ(2, 0.0, 4.0, 0.0);
            positions.needsUpdate = true;
        }

        //@ts-ignore
        const geometry = new InstancedBufferGeometry().copy(baseGeometry);

        // Splat index buffer
        const splatIndexArray = new Float32Array(maxSplatCount);
        for (let i = 0; i < maxSplatCount; i++) {
            splatIndexArray[i] = i;
        }
        const splatIndex = new InstancedBufferAttribute(splatIndexArray, 1, false);
        splatIndex.setUsage(DynamicDrawUsage);
        geometry.setAttribute('splatIndex', splatIndex);

        geometry.instanceCount = 0;

        return geometry;
    }
}
