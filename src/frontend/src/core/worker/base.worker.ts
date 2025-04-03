import Actor from '../message/actor'
import * as func from './func.worker'

// Base Worker Types //////////////////////////////////////////////////

type FuncModule = { [ key: string ]: Function }
declare const self: WorkerGlobalScope & Record<string, any>

// Base Worker Members //////////////////////////////////////////////////

self.actor = new Actor(self, self)

for (const key in func) {

    const element = (func as FuncModule)[key]
    if (element) self[key] = element.bind(self)
}



