export type Cancelable = {
    cancel: () => void
}

export type TaskType = 'message'

export type Callback<T> = (error?: Error | null, result?: T | null) => void

export type Transferable = ArrayBuffer | MessagePort | ImageBitmap

export type Class<T> = new (...args: any[]) => T

export type Klass = Class<any> & {
    _classRegistryKey: string
    serialize?: (input: any, transferables?: Set<Transferable>) => SerializedObject
    deserialize?: (serialized: unknown) => unknown
}

export type SerializedObject = {
    [_: string]: Serialized
}

export type Serialized = unknown | null | undefined | boolean | number | string | Date | RegExp | ArrayBuffer | ArrayBufferView | ImageData | Array<Serialized> | SerializedObject

export type WorkerSelf = WorkerGlobalScope & Record<string, any>

export function workerContext(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    (self as WorkerSelf)[propertyKey] = descriptor.value.bind(self)
    return descriptor
}
    


