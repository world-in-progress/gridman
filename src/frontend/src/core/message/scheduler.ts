import { bindAll } from '../util/utils'
import ThrottledInvoker from './throttledInvoker'
import type { Cancelable, TaskType } from '../types'

export type TaskMetadata = {
    type: TaskType
}

export type Task = {
    id: number
    fn: Function
    metadata: TaskMetadata
}

class Scheduler {

    nextId = 0
    taskQueue: number[] = []
    tasks: { [ key: number ]: Task } = {}

    invoker: ThrottledInvoker

    constructor() {

        bindAll(['process'], this)
        this.invoker = new ThrottledInvoker(this.process)
    }

    add(fn: Function, metadata: TaskMetadata): Cancelable {

        const id = this.nextId++
        
        this.tasks[id] = { id, fn, metadata }
        this.taskQueue.push(id)
        this.invoker.trigger()
        return {
            cancel: () => {
                delete this.tasks[id]
            }
        }
    }

    process() {

        this.taskQueue = this.taskQueue.filter(id => !!this.tasks[id])

        if (!this.taskQueue.length) return
        
        const id = this.pick()
        if (id === null) return

        const task = this.tasks[id]
        delete this.tasks[id]

        if (this.taskQueue.length) {
            this.invoker.trigger()
        }
        if (!task) return

        task.fn()
    }

    pick(): null | number {
        
        const id = this.taskQueue[0]
        this.taskQueue.splice(0, 1)
        return id
    }

    remove() {

        this.invoker.remove()
    }
}

export default Scheduler
