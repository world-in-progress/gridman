import { Callback } from '../types'

export function isWorker(): boolean {
    return !!self && typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope
}

let id = 1;
export function uniqueId(): number {
    return id++;
}

export function bindAll(fns: string[], context: any): void {

    fns.forEach(fn => {
        if (!context[fn]) return
        context[fn] = context[fn].bind(context)
    })
}

export function asyncAll<Item, Result>(
    array: Array<Item>,
    fn: (item: Item, fnCallback: Callback<Result>) => void,
    callback: Callback<Array<Result>>
): void {
    if (!array.length) return callback(null, [])

    let remaining = array.length
    const results = new Array(array.length)
    let error: Error | null = null
    array.forEach((item, index) => {
        fn(item, (err, result) => {
            if (err) error = err
            results[index] = result
            if (--remaining === 0) callback(error, results)
        })
    })
}
