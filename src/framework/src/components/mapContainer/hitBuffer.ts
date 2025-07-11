export default class HitBuffer {
    private _hitBuffer: Uint8Array
    private _hitCount: number = 0

    constructor(size: number) {
        this._hitBuffer = new Uint8Array(size)
    }

    get all(): number[] {
        const all: number[] = new Array(this._hitCount)
        let index = 0
        for (let i = 0; i < this._hitBuffer.length; i++) {
            if (this._hitBuffer[i] !== 0) {
                all[index++] = i
            }
        }
        return all
    }

    set all(indicies: number[]) {
        this._hitBuffer.fill(0)
        this._hitCount = indicies.length
        for (const index of indicies) {
            this._hitBuffer[index] = 1
        }
    }

    isHit(index: number): boolean {
        return this._hitBuffer[index] != 0
    }

    add(index: number): void {
        if (!this.isHit(index)) {
            this._hitBuffer[index] = 1
            this._hitCount++
        }
    }

    remove(storageId: number): void {
        if (this.isHit(storageId)) {
            this._hitBuffer[storageId] = 0
            this._hitCount--
        }
    }

    clear(): number[] {
        const all = this.all
        this._hitBuffer.fill(0)
        this._hitCount = 0
        return all
    }
}