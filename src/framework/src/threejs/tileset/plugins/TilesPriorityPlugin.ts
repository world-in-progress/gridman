
import { TilesRenderer } from '3d-tiles-renderer';

// 该插件用于调整下载队列、解析队列、处理节点队列的优先级，以便更好地利用浏览器资源。

// 默认实现的情况下是使用广度优先算法，这样会遍历同一层级的所有节点，然后再遍历下一层级。
// 但是这样会造成某些层级的节点被长时间阻塞，尤其是倾斜角较大的情况下，会等远处的节点下载完才开始近处高层级的节点的下载。
// 此处我修改为当层级差距大于1时，优先下载较低层级的节点，以便更好地利用浏览器资源。
// 同时，我增加了距离摄像机的距离作为优先级，这样可以优先下载距离摄像机更近的节点，以便提高渲染效率。
// 至于 __inFrustum 的判断，对需要大范围操作的情况下，可能会产生空白，因此我降低了优先级。

let depthLevel = 1;

// priority queue sort function that takes two tiles to compare. Returning 1 means
// "tile a" is loaded first.
const priorityCallback = ( a, b ) => {
	if ( Math.abs( a.__depthFromRenderedParent - b.__depthFromRenderedParent ) > depthLevel) {

		// load shallower tiles first using "depth from rendered parent" to help
		// even out depth disparities caused by non-content parent tiles
		return a.__depthFromRenderedParent > b.__depthFromRenderedParent ? - 1 : 1;

	} else if ( a.__error !== b.__error ) {

		// load the tile with the higher error
		return a.__error > b.__error ? 1 : - 1;

	} else if ( a.__distanceFromCamera !== b.__distanceFromCamera ) {

		// and finally visible tiles which have equal error (ex: if geometricError === 0)
		// should prioritize based on distance.
		return a.__distanceFromCamera > b.__distanceFromCamera ? - 1 : 1;

	} else if ( a.__inFrustum !== b.__inFrustum ) {

		// load tiles that are in the frustum at the current depth
		return a.__inFrustum ? 1 : - 1;

	} else if ( a.__used !== b.__used ) {

		// load tiles that have been used
		return a.__used ? 1 : - 1;

	} else if ( a.__depthFromRenderedParent !== b.__depthFromRenderedParent ) {

		// load shallower tiles first using "depth from rendered parent" to help
		// even out depth disparities caused by non-content parent tiles
		return a.__depthFromRenderedParent > b.__depthFromRenderedParent ? - 1 : 1;

	}  

	return 0;

};

export class TilesPriorityPlugin {
	constructor(options = {depthLevel: 1}) {
		this.depthLevel = options.depthLevel;
	}

	set depthLevel(value) { depthLevel = value; }


	init(tiles: TilesRenderer) {
		tiles.downloadQueue.priorityCallback = priorityCallback;
		tiles.parseQueue.priorityCallback = priorityCallback;
		tiles.processNodeQueue.priorityCallback = priorityCallback;
	}
}


