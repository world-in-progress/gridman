/**
 * 生成随机十六进制颜色
 * @returns 格式为 #RRGGBB 的随机颜色
 */
export function generateRandomHexColor(): string {
    return `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
}

/**
 * 生成随机RGB颜色数组
 * @param alpha 透明度，默认为0.5
 * @param minBrightness 最小亮度，默认为0.3
 * @param brightnessRange 亮度范围，默认为0.7
 * @returns [r, g, b, alpha] 格式的颜色数组，每个值范围在0-1之间
 */
export function generateRandomRgbColor(alpha: number = 0.5, minBrightness: number = 0.3, brightnessRange: number = 0.7): number[] {
    const r = Math.random() * brightnessRange + minBrightness; // 0.3-1.0
    const g = Math.random() * brightnessRange + minBrightness; // 0.3-1.0
    const b = Math.random() * brightnessRange + minBrightness; // 0.3-1.0
    return [r, g, b, alpha];
} 