import { ISceneNode } from '../scene/iscene'

interface ContextClass {
    new (): any
    deserialize: (data: any) => ContextClass
}

export default class ContextStorage {
    private version = 1
    private storeName = 'contexts'
    private dbName = 'context_storage'
    private constructorMap: Map<string, ContextClass> = new Map()

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

    async saveContext(id: string, contextData: any): Promise<void> {
        const db = await this.openDB()
        const transaction = db.transaction([this.storeName], 'readwrite')
        const store = transaction.objectStore(this.storeName)

        store.put({ id, data: contextData, timestamp: Date.now() })
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
                    resolve(request.result.data)
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

    async freeze(node: ISceneNode): Promise<void> {
        try {
            this.constructorMap.set(node.id, node.pageContext.constructor as ContextClass)
            await this.saveContext(node.id, node.pageContext.serialize())
            node.pageContext = null // mark as serialized
        } catch (error) {
            console.error('Error freezing context:', error)
        }
    }

    async melt(node: ISceneNode): Promise<void> {
        try {
            const contextData = await this.loadContext(node.id)
            if (contextData) {
                const ContextClass = this.constructorMap.get(node.id)
                if (ContextClass && ContextClass.deserialize) {
                    node.pageContext = ContextClass.deserialize(contextData)
                } else {
                    throw new Error(`No context class found for node: ${node.id}`)
                }
            }
        } catch (error) {
            console.error('Error melting context:', error)
        }
    }

    async delete(node: ISceneNode): Promise<void> {
        try {
            node.pageContext = undefined // mark as deleted
            await this.deleteContext(node.id)
            this.constructorMap.delete(node.id)
        } catch (error) {
            console.error('Error deleting context:', error)
        }
    }
}