import { TilesRenderer } from '3d-tiles-renderer';

// 将缓存大小设置为无限大，避免缓存过小无法加载调度
export class TilesCachePlugin {
    constructor(options = {}) {}

    init(tiles: TilesRenderer) {
        //@ts-expect-error
        tiles.lruCache.maxBytesSize = Infinity;
        tiles.lruCache.minSize = 0;
        tiles.lruCache.maxSize = Infinity;
    }
}
