export default class VibrantColorGenerator {

    private _generatedColors: Set<string>
    private _step: number
    private _saturation: number
    private _lightness: number
    private _hue: number
  
    constructor() {

      this._generatedColors = new Set<string>()
      this._step = 37
      this._saturation = 80
      this._lightness = 50
      this._hue = 0

    }
  
    private _hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {

      s /= 100
      l /= 100
  
      const c = (1 - Math.abs(2 * l - 1)) * s
      const x = c * (1 - Math.abs((h / 60) % 2 - 1))
      const m = l - c / 2
  
      let r = 0, g = 0, b = 0
      if (h >= 0 && h < 60) {
        r = c; g = x; b = 0
      } else if (h >= 60 && h < 120) {
        r = x; g = c; b = 0
      } else if (h >= 120 && h < 180) {
        r = 0; g = c; b = x
      } else if (h >= 180 && h < 240) {
        r = 0; g = x; b = c
      } else if (h >= 240 && h < 300) {
        r = x; g = 0; b = c
      } else {
        r = c; g = 0; b = x
      }
  
      return {
        r: r + m,
        g: g + m,
        b: b + m
      }
    }
  
    public nextColor(): [number, number, number] {
      do {
        this._hue = (this._hue + this._step) % 360
        const { r, g, b } = this._hslToRgb(this._hue, this._saturation, this._lightness)
        const rgb: [number, number, number] = [
          Math.round(r * 255),
          Math.round(g * 255),
          Math.round(b * 255)
        ]
  
        const colorKey = `${rgb[0]},${rgb[1]},${rgb[2]}`
        if (!this._generatedColors.has(colorKey)) {
          this._generatedColors.add(colorKey)
          return rgb
        }
      } while (this._generatedColors.size < 10000)
  
      throw new Error("Cannot generate more unique colors.")
    }
  }
  