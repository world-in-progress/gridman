import { TilesRenderer } from '3d-tiles-renderer';

// 解决 rootUrl 中带有参数时，无法正确解析出参数的问题
// 例如有 token/key 等参数，导致子级 tile.json 文件无法 fetch 成功
export class UrlParamsPlugin {
    rootUrl: string;
    urlParams: string;
    constructor(options = {}) {
        this.rootUrl = '';
        this.urlParams = '';
    }

    init(tiles: TilesRenderer) {
        //@ts-expect-error
        const { rootUrl } = tiles;
        if (rootUrl && rootUrl.length > 0) {
            this.setRootUrl(rootUrl);
        }
    }

    private setRootUrl(rootUrl: string) {
        if (rootUrl && rootUrl.length > 0) {
            this.rootUrl = rootUrl;
            const url = new URL(rootUrl);
            this.urlParams = url.search;
        }
    }

    preprocessURL(uri) {
        if (!this.rootUrl || this.rootUrl.length == 0) {
            this.setRootUrl(uri);
        }

        if (uri != this.rootUrl && this.urlParams && this.urlParams.length > 0) {
            const url = new URL(uri);
            url.search = this.urlParams;
            return url.toString();
        }
        return uri;
    }
}
