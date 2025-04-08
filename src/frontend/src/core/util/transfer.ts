import registry from './register'
import { Klass, Serialized, SerializedObject, Transferable } from '../types'

function isArrayBuffer(val: any): boolean {

    return val instanceof ArrayBuffer
}

function isImageBitmap(val: any): boolean {

    return val instanceof ImageBitmap
}

export function serialize(input: unknown, transferables?: Set<Transferable>): Serialized {
    
    if (
        input === null ||
        input === undefined ||
        typeof input === 'boolean' ||
        typeof input === 'number' ||
        typeof input === 'string' ||
        input instanceof Boolean ||
        input instanceof Number ||
        input instanceof String ||
        input instanceof Date ||
        input instanceof RegExp
    ) return input

    if (isArrayBuffer(input) || isImageBitmap(input)) {
        transferables?.add(input as Transferable)
        return input
    }

    if (ArrayBuffer.isView(input)) {
        const view = input as ArrayBufferView
        transferables?.add(view.buffer as Transferable)
        return view
    }

    if (input instanceof ImageData) {
        transferables?.add(input.data.buffer as Transferable)
        return input
    }

    if (Array.isArray(input)) {
        const serialized: Array<Serialized> = input.map(item => serialize(item, transferables))
        return serialized
    }

    if (input instanceof Set) {
        const properties: { [ key: number | string ]: Serialized } = { '$name': 'Set' }
        Array.from(input.values()).forEach((value, index) => properties[index + 1] = serialize(value, transferables))
        return properties
    }

    if (typeof input === 'object') {
        const klass = input.constructor as Klass
        const name = klass._classRegistryKey
        if (!registry[name]) {
            throw new Error(`Cannot serialize object of unregistered class ${name}`)
        }

        const properties: SerializedObject = klass.serialize ? klass.serialize(input, transferables) : {}

        if (!klass.serialize) {
            for (const key in input) {
                if (!Object.prototype.hasOwnProperty.call(input, key)) continue
                if (registry[name].omit.indexOf(key) >= 0) continue
                const property = (input as any)[key]
                properties[key] = serialize(property, transferables)
            }
            if (input instanceof Error) {
                properties['message'] = input.message
            }
        }

        if (properties['$name']) throw new Error('$name property is reserved for worker serialization logic.')
        if (name !== 'Object') properties['$name'] = name

        return properties
    }

    throw new Error(`Cannot serialize object of type ${typeof input}`);
}

export function deserialize(input: Serialized): unknown {

    if (
        input === null ||
        input === undefined ||
        typeof input === 'boolean' ||
        typeof input === 'number' ||
        typeof input === 'string' ||
        input instanceof Boolean ||
        input instanceof Number ||
        input instanceof String ||
        input instanceof Date ||
        input instanceof RegExp ||
        input instanceof ImageData ||
        isArrayBuffer(input) ||
        isImageBitmap(input) ||
        ArrayBuffer.isView(input)
    ) return input

    if (Array.isArray(input)) {
        return input.map(deserialize)
    }

    if (typeof input === 'object') {
        const name = (input as any).$name || 'Object'

        if (name === 'Set') {
            const set = new Set()
            for (const key of Object.keys(input)) {
                if (key === '$name') continue

                const value = (input as SerializedObject)[key]
                set.add(deserialize(value))
            }

            return set
        }

        const { klass } = registry[name]
        if (!klass) throw new Error(`Cannot deserialize unregistered class ${name}`)

        if (klass.deserialize) {
            return klass.deserialize(input)
        }

        const result: {
            [ key: string ]: any
        } = Object.create(klass.prototype)

        for (const key of Object.keys(input)) {
            if (key === '$name') continue

            const value = (input as SerializedObject)[key]
            result[key] = deserialize(value)
        }

        return result
    }
}