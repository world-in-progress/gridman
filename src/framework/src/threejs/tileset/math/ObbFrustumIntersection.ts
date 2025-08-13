import { Vector3,  } from 'three';

export class ObbFrustumIntersection {
    
    static intersectsFrustum(obb, frustum) : boolean {
        
        if (! obb.intersectsFrustum( frustum ) ){
            return false;
        }

        const obbAxes = this._getOBBAxes(obb);
        const frustumEdges = this._getFrustumEdges(frustum);

        const allAxes = [...obbAxes, ...frustumEdges];

        for (const axis of allAxes) {
            const obbProjection = this._projectOBB(obb, axis);
            const frustumProjection = this._projectFrustum(frustum, axis);

            if (!this._intervalsOverlap(obbProjection, frustumProjection)) {
                return false;
            }
        }

        return true;
    }


    static _getOBBAxes(obb) {
        return [
            obb.planes[ 0 ].normal,
            obb.planes[ 2 ].normal,
            obb.planes[ 4 ].normal,
        ];
    }

    static _getFrustumEdges(frustum) {
        const edges = [];
        for (let i = 0; i < frustum.planes.length; i++) {
            for (let j = i + 1; j < frustum.planes.length; j++) {
                const edge = new Vector3().crossVectors(
                    frustum.planes[i].normal,
                    frustum.planes[j].normal
                );
                if (edge.length() > 0) {
                    edges.push(edge.normalize());
                }
            }
            edges.push(frustum.planes[i].normal);
        }
        return edges;
    }

    static _projectOBB(obb, axis) {
        
        let min = Infinity;
        let max = -Infinity;
        for (const point of obb.points) {
            const distance = point.dot(axis);
            if (min > distance) min = distance;
            if (max < distance) max = distance;
        }

        return { min, max };
    }

    static _projectFrustum(frustum, axis) {
        let min = Infinity;
        let max = -Infinity;

        for (const point of frustum.points) {
            const distance = point.dot(axis);
            if (min > distance) min = distance;
            if (max < distance) max = distance;
        }

        return { min, max };
    }

    static _intervalsOverlap(interval1, interval2) {
        return interval1.max >= interval2.min && interval2.max >= interval1.min;
    }
}