import Actor from './actor'
import WorkerPool from '../worker/workerPool'
import { uniqueId, asyncAll } from '../util/utils'
import type { Class, Callback } from '../types'

class Dispatcher {

    ready = false
    id = uniqueId()
    currentActor = 0
    activeActorCount = 0
    actors: Array<Actor> = []
    workerPool = WorkerPool.instance

    static Actor: Class<Actor>

    constructor(parent: any, actorMaxNum?: number) {

        if (actorMaxNum) {
            WorkerPool.workerCount = actorMaxNum
        } else {
            const hardwareConcurrency = typeof window !== 'undefined' ? (window.navigator.hardwareConcurrency || 2) : 2
            WorkerPool.workerCount = Math.min(hardwareConcurrency, 2)
        }

        this.workerPool.acquire(this.id).forEach((worker, index) => {

            if (index === WorkerPool.workerCount - 1) {
                const actor = new Actor(worker, parent)
                actor.name = `IndexedDB Worker`
                this.actors.push(actor)
            } else {
                const actor = new Actor(worker, parent)
                actor.name = `Worker ${index}`
                this.actors.push(actor)
            }
        })
        this.broadcast('checkIfReady', null, () => { this.ready = true })
    }

    broadcast(type: string, data: unknown, cb?: Callback<unknown>) {

        cb = cb || function (){}
        asyncAll(this.actors, (actor, done) => {
            actor.send(type, data, done)
        }, cb)
    }

    get actor(): Actor {

        this.currentActor = (this.currentActor + 1) % (this.actors.length - 1)
        return this.actors[this.currentActor]
    }

    get dbActor(): Actor {

        return this.actors[this.actors.length - 1]
    }

    remove() {
        this.actors.forEach(actor => actor.remove())
        this.actors = []
        this.workerPool.release(this.id)
    }
}

export default Dispatcher
