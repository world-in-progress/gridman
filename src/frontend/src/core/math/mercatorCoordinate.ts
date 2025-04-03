export class MercatorCoordinate {

    static mercatorXfromLon(lon: number): number {
        
        return (180.0 + lon) / 360.0
    }
    
    static mercatorYfromLat(lat: number): number {

        return (180.0 - (180.0 / Math.PI * Math.log(Math.tan(Math.PI / 4.0 + lat * Math.PI / 360.0)))) / 360.0
    }

    static fromLonLat(lonLat: [number, number]): [number, number] {

        const x = MercatorCoordinate.mercatorXfromLon(lonLat[0])
        const y = MercatorCoordinate.mercatorYfromLat(lonLat[1])

        return [ x, y ]
    }

    static toNDC(coords: [number, number]): [number, number] {

        return [
            coords[0] * 2.0 - 1.0,
            1.0 - coords[1] * 2.0
        ]
    }

    static lonFromMercatorX(x: number): number {

        return x * 360.0 - 180.0
    }

    static latFromMercatorY(y: number): number {

        const y2 = 180.0 - y * 360.0
        return 360.0 / Math.PI * Math.atan(Math.exp(y2 * Math.PI / 180.0)) - 90.0
    }

    static fromXY(xy: [number, number]): [number, number] {

        const [ x, y ] = xy
        const lon = MercatorCoordinate.lonFromMercatorX(x)
        const lat = MercatorCoordinate.latFromMercatorY(y)
        return [ lon, lat ]
    }

    static fromNDC(xy: [number, number]): [number, number] {

        let [ x, y ] = xy
        x = (x + 1.) / 2.
        y = (1. - y) / 2.
        return MercatorCoordinate.fromXY([ x, y ])
    }
}
