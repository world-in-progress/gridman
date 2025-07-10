import DefaultPageContext from './default'

interface ContextClass extends DefaultPageContext {
    new (): any
    deserialize: (data: any) => DefaultPageContext
}

export default class ContextStorage {
    // Static instance holder
    private static instance: ContextStorage | null = null

    // Private constructor to prevent instantiation
    private constructor() {
        window.onbeforeunload = () => this.deleteDB()
    }

    // Static method to get the singleton instance
    public static getInstance(): ContextStorage {
        if (!ContextStorage.instance) {
            ContextStorage.instance = new ContextStorage()
        }
        return ContextStorage.instance
    }
    
    private version = 1
    private storeName = 'contexts'
    private dbName = 'context_storage'
    constructorMap: Map<string, ContextClass> = new Map()

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
}