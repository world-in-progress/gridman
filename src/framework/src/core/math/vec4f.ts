export class Vec4f {

    data: [number, number, number, number]
     
    constructor(x: number, y: number, z: number, w: number) {

        this.data = [ 0, 0, 0, 0 ]

        if (x === undefined && y === undefined && z === undefined && w === undefined) this.data.fill(0.0)
        else if (x !== undefined && y === undefined && z === undefined && w === undefined) this.data.fill(x)
        else if (x !== undefined && y !== undefined && z === undefined && w === undefined) { this.data[0] = x; this.data[1] = this.data[2] = this.data[3] = y; }
        else if (x !== undefined && y !== undefined && z !== undefined && w === undefined) { this.data[0] = x; this.data[1] =  y; this.data[2] = this.data[3] = z; }
        else {
            this.data[0] = x
            this.data[1] = y
            this.data[2] = z
            this.data[3] = w
        }
    }

    get x(): number {

        return this.data[0]
    }

    get y(): number {

        return this.data[1]
    }

    get z(): number {

        return this.data[2]
    }

    get w(): number {

        return this.data[3]
    }

    get xy(): [ number, number ] {

        return [ this.data[0], this.data[1] ]
    }

    get yz(): [ number, number ] {

        return [ this.data[1], this.data[2] ]
    }

    get zw(): [ number, number ] {

        return [ this.data[2], this.data[3] ]
    }

    get xyz(): [ number, number, number ] {

        return [ this.data[0], this.data[1], this.data[2] ]
    }

    get yzw(): [ number, number, number ] {

        return [ this.data[1], this.data[2], this.data[3] ]
    }

    get xyzw(): [ number, number, number, number ] {

        return this.data
    }

    set x(x: number) {

        this.data[0] = x
    }

    set y(y: number) {

        this.data[1] = y
    }

    set z(z: number) {

        this.data[2] = z
    }

    set w(w: number) {

        this.data[3] = w
    }

    set xy(xy: [number, number]) {

        this.data[0] = xy[0]
        this.data[1] = xy[1]
    }

    set yz(yz: [number, number]) {

        this.data[1] = yz[0]
        this.data[2] = yz[1]
    }

    set zw(zw: [number, number]) {

        this.data[2] = zw[0]
        this.data[3] = zw[1]
    }

    set xyz(xyz: [number, number, number]) {

        this.data[0] = xyz[0]
        this.data[1] = xyz[1]
        this.data[2] = xyz[2]
    }

    set yzw(yzw: [number, number, number]) {

        this.data[1] = yzw[0]
        this.data[2] = yzw[1]
        this.data[3] = yzw[2]
    }

    set xyzw(xyzw: [number, number, number, number]) {

        this.data[0] = xyzw[0]
        this.data[1] = xyzw[1]
        this.data[2] = xyzw[2]
        this.data[3] = xyzw[3]
    }
}

export function vec4f(x: number, y: number, z: number, w: number) {

    return new Vec4f(x, y, z, w)
}
