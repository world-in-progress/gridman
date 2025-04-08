import { createDbManager, DbAction } from '../database/db'
import { GridNodeRecord } from '../grid/NHGrid'
import Actor from '../message/actor'
import { Callback } from '../types'

// Constants //////////////////////////////////////////////////
const NODE_STORE = 'GridNode'
const DATABASE_NAME = 'GridDB'
const DB_MANAGER = createDbManager()

// Base Worker Types //////////////////////////////////////////////////

declare const self: WorkerGlobalScope & Record<string, any>

// Base Worker Members //////////////////////////////////////////////////

self.actor = new Actor(self, globalThis)

self.checkIfReady = (_: unknown, callback: Callback<any>) => {
    callback()
}

// IndexedDB process handlers //////////////////////////////////////////////////

// Common indexedDB processing
self.dbProcess = async (actions: DbAction[], callback: Callback<any>) => {

    await DB_MANAGER(DATABASE_NAME, actions)
    callback(null, actions.map(action => action.data))
}

// Create new grids in indexedDB
self.createGrids = async (uuIds: Array<string>, callback: Callback<any>) => {

    const dbActions = uuIds.map(uuId => {
        return {
            type: 'U',
            storeName: NODE_STORE,
            data: new GridNodeRecord(uuId)
        } as DbAction
    })
    await DB_MANAGER(DATABASE_NAME, dbActions)
    callback()
}
