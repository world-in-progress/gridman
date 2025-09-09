import { TilesRenderer } from '3d-tiles-renderer';
import { Matrix4 } from 'three';
import { ObbFrustumIntersection } from './math/ObbFrustumIntersection';

const viewErrorTarget = {
    inView: false,
    error: Infinity,
};

// 为了实现某些特点的优化，无法使用 plugin 的方式，需要修改源码，所以这里扩展修改了 TilesRenderer 类。
// 这样修改可能会导致将来版本升级的时候不可用，是个不太好的方案，后续有时间再考虑优化。
// 优化点：
// 1. 优化动态屏幕空间错误计算，对于水平视角，使用了类似于反折射的效果，
//    距离越远的折射距离越大，误差越小，所需要的 tile 的 depth 也会减小，提升加载速度。
//    对于垂直视角基本保持不变。进一步可以开放更多参数。
//    此处有参考部分 Cesium，但感觉效果不好，使用自定义的算法效果更好。
// 2. 尝试使用更精确的 ObbFrustumIntersection 算法，目前使用的是粗略的判断，
//    可能存在误差。但优化效果和意义不大，可以舍弃这部分代码。
export class TilesRendererEx extends TilesRenderer {
    // Optimization option. For street-level horizon views, use lower resolution tiles far from the camera. This reduces the amount of data loaded and improves tileset loading time with a slight drop in visual quality in the distance.
    dynamicScreenSpaceError: boolean = true;

	// Private Functions
	preprocessTileSet( json, url, parent = null ) {

		// const version = json.asset.version;
		// const [ major, minor ] = version.split( '.' ).map( v => parseInt( v ) );
		// console.assert(
		// 	major <= 1,
		// 	'TilesRenderer: asset.version is expected to be a 1.x or a compatible version.',
		// );

		// if ( major === 1 && minor > 0 ) {

		// 	console.warn( 'TilesRenderer: tiles versions at 1.1 or higher have limited support. Some new extensions and features may not be supported.' );

		// }

		// remove the last file path path-segment from the URL including the trailing slash
		let basePath = url.replace( /\/[^/]*$/, '' );
		basePath = new URL( basePath, window.location.href ).toString();
		this.preprocessNode( json.root, basePath, parent );

	}

    calculateTileViewError(tile, target) {
        const cached = tile.cached;
        // @ts-ignore
        const cameras = this.cameras;
        // @ts-ignore
        const cameraInfo = this.cameraInfo;
        const boundingVolume = cached.boundingVolume;

        let inView = false;
        let inViewError = -Infinity;
        let inViewDistance = Infinity;
        let maxError = -Infinity;
        let minDistance = Infinity;

        for (let i = 0, l = cameras.length; i < l; i++) {
            // calculate the camera error
            const info = cameraInfo[i];
            let error;
            let distance;
            if (info.isOrthographic) {
                const pixelSize = info.pixelSize;
                error = tile.geometricError / pixelSize;
                distance = Infinity;
            } else {
                const sseDenominator = info.sseDenominator;
                distance = boundingVolume.distanceToPoint(info.position);
                error = tile.geometricError / (distance * sseDenominator);

                if (this.dynamicScreenSpaceError) {
                    const distanceToCamera = this._calculateDynamicScreenSpaceDistance(tile, info, distance);
                    error = tile.geometricError / (distanceToCamera * sseDenominator);
                }
            }

            // Track which camera frustums this tile is in so we can use it
            // to ignore the error calculations for cameras that can't see it
            const frustum = cameraInfo[i].frustum;
            if (this._intersectsFrustum(frustum, boundingVolume)) {
                inView = true;
                inViewError = Math.max(inViewError, error);
                inViewDistance = Math.min(inViewDistance, distance);
            }

            maxError = Math.max(maxError, error);
            minDistance = Math.min(minDistance, distance);
        }

        // check the plugin visibility
        // @ts-ignore
        this.invokeAllPlugins((plugin) => {
            if (plugin !== this && plugin.calculateTileViewError) {
                plugin.calculateTileViewError(tile, viewErrorTarget);
                if (viewErrorTarget.inView) {
                    inView = true;
                    inViewError = Math.max(inViewError, viewErrorTarget.error);
                }

                maxError = Math.max(maxError, viewErrorTarget.error);
            }
        });

        // If the tiles are out of view then use the global distance and error calculated
        if (inView) {
            target.inView = true;
            target.error = inViewError;
            target.distanceFromCamera = inViewDistance;
        } else {
            target.inView = false;
            target.error = maxError;
            target.distanceFromCamera = minDistance;
        }
    }

    private _calculateDynamicScreenSpaceDistance(tile, cameraInfo, distanceToCamera) {
        const tileTransfromInverted = new Matrix4().copy(tile.cached.transform).invert();

        const direction = cameraInfo.frustum.planes[5].normal.clone();
        const position = cameraInfo.position.clone();

        position.applyMatrix4(tileTransfromInverted);
        direction.transformDirection(tileTransfromInverted);

        // 计算相机距离屏幕中心的距离，要求 pitch 角与地面有交点
        // 等比三角形，方向微量的长度为 1， direction.z / 1 = position.z / cameraDistance
        const height = position.z;
        const cameraDistance = position.z / Math.abs(direction.z);

        // 计算折射距离，超出的部分折射距离与 pitch 角的余弦值成反比
        if (distanceToCamera > cameraDistance) {
            const cospitch = height / cameraDistance;
            const delta = distanceToCamera - cameraDistance;
            const newDelta = delta / cospitch;
            const newDistance = cameraDistance + newDelta;
            return newDistance;
        } else {
            return distanceToCamera;
        }
    }

    private _intersectsFrustum(frustum, boundingVolume): boolean {
        const obb = boundingVolume.obb || boundingVolume.regionObb;
        const sphere = boundingVolume.sphere;
        if (sphere && !frustum.intersectsSphere(sphere)) {
            return false;
        }

        if (obb) {
            if (!ObbFrustumIntersection.intersectsFrustum(obb, frustum)) {
                return false;
            }
        }

        // if we don't have a sphere or obb then just say we did intersect
        return Boolean(sphere || obb);
    }
}
