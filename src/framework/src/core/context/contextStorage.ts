import { Serialized } from '../types'
import { serialize, deserialize } from '../util/transfer'

export default class ContextStorage {
    private version = 1
    private storeName = 'contexts'
    private dbName = 'context_storage'

    constructor() {
        window.onbeforeunload = () => this.deleteDB()
    }

    async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version)

            request.onerror = () => reject(request.error)
            request.onsuccess = () => resolve(request.result)

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id' })
                }
            }
        })
    }

    deleteDB(): void {
        const request = indexedDB.deleteDatabase(this.dbName)
        request.onerror = () => console.error('Failed to delete database:', request.error)
        request.onsuccess = () => console.log('Database deleted successfully')
    }

    private serializeContext(context: any): Serialized {
        return serialize(context)
    }

    private deserializeContext(data: any): unknown {
        return deserialize(data)
    }

    async saveContext(id: string, context: any): Promise<void> {
        const db = await this.openDB()
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)

        // Convert class instance to plain object
        const plainObject = this.serializeContext(context)

        store.put({ id, data: plainObject, timestamp: Date.now() })
        db.close()
    }

    async loadContext(id: string): Promise<any | null> {
        const db = await this.openDB()
        const transaction = db.transaction([this.storeName], 'readonly')
        const store = transaction.objectStore(this.storeName)

        return new Promise((resolve, reject) => {
            const request = store.get(id)
            request.onerror = () => {
                db.close()
                reject(request.error)
            }
            request.onsuccess = () => {
                if (request.result) {
                    const deserialized = this.deserializeContext(request.result.data)
                    resolve(deserialized)
                } else {
                    resolve(null)
                }
                db.close()
            }
        })
    }

    async deleteContext(id: string): Promise<boolean> {
        const db = await this.openDB()
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)

        return new Promise((resolve, reject) => {
            const request = store.delete(id)
            request.onerror = () => {
                db.close()
                reject(request.error)
            }
            request.onsuccess = () => {
                db.close()
                resolve(true)
            }
        })
    }
}