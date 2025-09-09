import { Color, Texture, DataTexture, RGBAFormat, UnsignedByteType, UVMapping, ClampToEdgeWrapping, LinearFilter } from 'three';

export type ColorRampParams = {
    colors: Color[];
    resolution?: number;
};

/**
 * Given an expression that should evaluate to a color ramp,
 * return a RGBA image representing that ramp expression.
 *
 * @private
 */
export function renderColorRamp(params: ColorRampParams): Texture {
    const { colors, resolution = 256 } = params;

    // 创建一个数组来存储像素数据
    const data = new Uint8Array(resolution * 4); // 每个像素有 4 个值 (R, G, B, A)

    // 计算每种颜色之间的插值
    for (let i = 0; i < resolution; i++) {
        // 确定当前像素属于哪两个颜色之间
        const colorPos = (i / (resolution - 1)) * (colors.length - 1);
        const colorIndex = Math.floor(colorPos);
        const t = colorPos - colorIndex;

        // 获取当前颜色和下一个颜色
        const currentColor = colors[colorIndex];
        const nextColor = colors[Math.min(colorIndex + 1, colors.length - 1)];

        const newColor = new Color().lerpColors(currentColor, nextColor, t);

        // 填充像素数据
        data[i * 4] = newColor.r * 255;
        data[i * 4 + 1] = newColor.g * 255;
        data[i * 4 + 2] = newColor.b * 255;
        data[i * 4 + 3] = 255;
    }

    // 创建 DataTexture
    const texture = new DataTexture(data, resolution, 1, RGBAFormat, UnsignedByteType, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearFilter);

    // 更新纹理
    texture.needsUpdate = true;

    return texture;
}
