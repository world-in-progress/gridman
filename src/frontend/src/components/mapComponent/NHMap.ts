import mapboxgl from 'mapbox-gl'
import { mat4, vec3 } from 'gl-matrix'

// You'll need to define these function types or import them from the appropriate module
declare function encodeFloatToDouble(value: number): [number, number]

export default class NHMap extends mapboxgl.Map {
  private mercatorCenter: mapboxgl.MercatorCoordinate
  private centerHigh: [number, number]
  private centerLow: [number, number]
  private WORLD_SIZE: number
  private worldCamera: undefined // Replace 'any' with the appropriate type if known
  private vpMatrix: number[]
  private relativeEyeMatrix: Float32Array

  constructor(options: mapboxgl.MapOptions) {
    // Init mapbox map
    super(options)
    const cameraPosition = this.transform._computeCameraPosition()
    // Attributes
    this.mercatorCenter = new mapboxgl.MercatorCoordinate(
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2]
    )
    this.centerHigh = [0.0, 0.0]
    this.centerLow = [0.0, 0.0]

    this.WORLD_SIZE = 1024000 // TILE_SIZE * 2000
    this.worldCamera = undefined
    this.vpMatrix = []
    this.relativeEyeMatrix = new Float32Array(16)
  }

  update(): void {
    const cameraPosition = this.transform._computeCameraPosition()
    this.mercatorCenter = new mapboxgl.MercatorCoordinate(
      cameraPosition[0],
      cameraPosition[1],
      cameraPosition[2]
    )

    const mercatorCenterX = encodeFloatToDouble(this.mercatorCenter.x)
    const mercatorCenterY = encodeFloatToDouble(this.mercatorCenter.y)

    this.centerLow[0] = mercatorCenterX[1]
    this.centerLow[1] = mercatorCenterY[1]
    this.centerHigh[0] = mercatorCenterX[0]
    this.centerHigh[1] = mercatorCenterY[0]

    const identityMatrix = mat4.identity(new Float32Array(16))
    const translatedMatrix = mat4.translate(
      new Float32Array(16),
      identityMatrix,
      vec3.set(new Float32Array(3), this.centerHigh[0], this.centerHigh[1], 0.0)
    )

    this.relativeEyeMatrix = mat4.multiply(
      new Float32Array(16),
      this.transform.mercatorMatrix,
      translatedMatrix
    ) as Float32Array
  }
}
