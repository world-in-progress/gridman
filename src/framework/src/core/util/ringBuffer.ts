class RingBuffer<T> {

    private _capacity: number
    private _count: number = 0
    private _readIndex: number = 0
    private _writeIndex: number = 0
    private _buffer: Array<T | undefined>

    constructor(size: number) {

        this._capacity = size
        this._buffer = new Array<T | undefined>(size)
    }

    push(item: T): void {

        this._buffer[this._writeIndex] = item
        this._writeIndex = (this._writeIndex + 1) % this._capacity

        if (this._count < this._capacity) {
            this._count++
        } else {
            this._readIndex = (this._readIndex + 1) % this._capacity
        }
    }

    get(index: number): T | undefined {

        if (index >= this._count || index < 0) return undefined

        const bufferIndex = (this._readIndex + index) % this._capacity
        return this._buffer[bufferIndex]
    }

    toArray(): T[] {

        const result: T[] = []
        for (let i = 0; i < this._count; i++) {
            result.push(this.get(i)!)
        }

        return result
    }

    size(): number {

        return this._count
    }

    clear(): void {

        if (this._count === 0) return

        this._buffer = new Array<T | undefined>(this._capacity)
        this._writeIndex = 0
        this._readIndex = 0
        this._count = 0
    }

    pop(): T | undefined {

        if (this._count === 0) return undefined

        const lastIndex = (this._writeIndex - 1 + this._capacity) % this._capacity
        const item = this._buffer[lastIndex]

        this._buffer[lastIndex] = undefined
        this._writeIndex = lastIndex
        this._count --

        return item
    }

    peek(): T | undefined {

        if (this._count === 0) return undefined
        const lastWriteIndex = (this._writeIndex - 1 + this._capacity) % this._capacity
        return this._buffer[lastWriteIndex]
    }

    resize(newSize: number): void {

        const currentData = this.toArray()

        this._buffer = new Array<T | undefined>(newSize)
        this._capacity = newSize
        this._writeIndex = 0
        this._readIndex = 0
        this._count = 0

        currentData.slice(-newSize).forEach(item => this.push(item))
    } 

    isEmpty(): boolean {
        return this._count === 0
    }
}

export default RingBuffer
