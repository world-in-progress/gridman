import { Vec4f } from '../math/vec4f'

export default class BoundingBox2D extends Vec4f {

    constructor(xMin: number, yMin: number, xMax: number, yMax: number) {

        super(xMin, yMin, xMax, yMax)
        this.x = xMin !== undefined ? xMin : Infinity
        this.y = yMin !== undefined ? yMin : Infinity
        this.z = xMax !== undefined ? xMax : -Infinity
        this.w = yMax !== undefined ? yMax : -Infinity
    }

    static create(xMin: number, yMin: number, xMax: number, yMax: number): BoundingBox2D {

        return new BoundingBox2D(xMin, yMin, xMax, yMax)
    }

    get boundary(): [number, number, number, number] {

        return this.xyzw
    }

    update(x: number, y: number): void {
        
        this.data[0] = x < this.data[0] ? x : this.data[0]
        this.data[1] = y < this.data[1] ? y : this.data[1]
        this.data[2] = x > this.data[2] ? x : this.data[2]
        this.data[3] = y > this.data[3] ? y : this.data[3]
    }

    updateByBox(box: BoundingBox2D) {

        this.update(box.x, box.y)
        this.update(box.z, box.w)
    }

    overlap(bBox: BoundingBox2D) {

        if (this.data[0] > bBox.data[2] || this.data[2] < bBox.data[0]) return false
        if (this.data[1] > bBox.data[3] || this.data[3] < bBox.data[1]) return false

        return true
    }

    within(x: number, y: number): boolean {

        if (x < this.data[0] || y < this.data[1] || x > this.data[2] || y > this.data[3]) return false
        return true
    }

    get center(): [number, number] {

        return [
            (this.data[0] + this.data[2]) / 2,
            (this.data[1] + this.data[3]) / 2,
        ]
    }

    get size(): [number, number] {
        
        return [
            this.data[2] - this.data[0],
            this.data[3] - this.data[1],
        ]
    }

    get xMin(): number {
        return this.data[0]
    }

    get yMin(): number {
        return this.data[1]
    }

    get xMax(): number {
        return this.data[2]
    }

    get yMax(): number {
        return this.data[3]
    }

    reset(xMin: number, yMin: number, xMax: number, yMax: number) {
        
        this.data[0] = xMin !== undefined ? xMin : Infinity
        this.data[1] = yMin !== undefined ? yMin : Infinity
        this.data[2] = xMax !== undefined ? xMax : -Infinity
        this.data[3] = yMax !== undefined ? yMax : -Infinity
    }

    release() {

        this.data = [0, 0, 0, 0]
        return null
    }

    
}

export function boundingBox2D(xMin: number, yMin: number, xMax: number, yMax: number) {

    return BoundingBox2D.create(xMin, yMin, xMax, yMax)
}
