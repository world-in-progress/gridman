export function createDB(dbName: string, storedObjectName: string, keyName: string) {

    const request = indexedDB.open(dbName, 1)

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {

        const db = (event.target as IDBRequest).result
        if (!db.objectStoreNames.contains(storedObjectName)) {
            db.createObjectStore(storedObjectName, { keyPath: keyName })
        }
    }

    request.onsuccess = () => {
        console.log(`IndexedDB ${dbName} has been created.`)
    }

    request.onerror = () => {
        console.error(`Failed to create indexedDB ${dbName}`)
    }
}

export function deleteDB(dbName: string): void {

    const request = indexedDB.deleteDatabase(dbName)

    request.onsuccess = () => {
        console.log(`IndexedDB ${dbName} deleted.`)
    }

    request.onerror = () => {
        console.error(`Failed to delete indexedDB ${dbName}`)
    }
}

export function addData(store: IDBObjectStore, data: any): Promise<any> {

    return new Promise((resolve, reject) => {
        const request = store.add(data)

        request.onsuccess = () => {
            resolve(null)
        }

        request.onerror = (e) => {
            reject((e.target as any).error)
        }
    })
}

export function deleteData(store: IDBObjectStore, id: number | string) {

    const request = store.delete(id)

    request.onsuccess = () => {}
    request.onerror = (e) => console.error((e.target as any).error)
}

export function updateData(store: IDBObjectStore, data: any) {

    const request = store.put(data)

    request.onsuccess = () => {}
    request.onerror = (e) => console.error((e.target as any).error)
}

export function getData(store: IDBObjectStore, id: string | number): Promise<any> {
    
    return new Promise((resolve, reject) => {
        const request = store.get(id)

        request.onsuccess = () => {
            resolve(request.result || null)
        }

        request.onerror = () => {
            reject(new Error(`Failed to get data for id: ${id}`))
        }
    })
}

export type DbAction = {
    data: any
    storeName: string
    type: 'C' | 'R' | 'U' | 'D'
}

export interface DbStoreDict {
    [tableName: string]: IDBObjectStore
}

export function createDbManager() {

    let db: IDBDatabase | undefined
    
    async function handleActions(actions: DbAction[]): Promise<any[]> {
        const storeDict: DbStoreDict = {}
        const transaction = db!.transaction(actions.map(a => a.storeName), 'readwrite')

        const results: any[] = new Array(actions.length).fill(null)

        actions.forEach((action, index) => {
            if (!storeDict[action.storeName]) {
                storeDict[action.storeName] = transaction.objectStore(action.storeName)
            }
            const store = storeDict[action.storeName]

            try {
                switch (action.type) {
                    case 'C':
                        store.add(action.data)
                        break
                    case 'U':
                        store.put(action.data)
                        break
                    case 'D':
                        store.delete(action.data!.id)
                        break
                    case 'R': {
                        const request = store.get(action.data!.id)
                        request.onsuccess = (event) => {
                            results[index] = (event.target as IDBRequest).result
                        }
                        request.onerror = () => {
                            results[index] = null
                        }
                        break
                    }
                }
            } catch (error) {
                console.error(`Action failed: ${action.type}`, error)
            }
        })

        return new Promise<any[]>((resolve, reject) => {
            transaction.oncomplete = () => resolve(results)
            transaction.onerror = () => reject(new Error('Transaction failed'))
        })
    }

    function openDB(dbName: string): Promise<IDBDatabase> {

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1)

            request.onsuccess = (event: Event) => {
                db = (event.target as IDBRequest).result
                resolve(db!)
            }

            request.onerror = () => {
                reject(new Error(`Failed to open indexedDB: ${dbName}`))
            }
        })
    }

    return async (dbName: string, actions: DbAction[]): Promise<any[]> => {

        if (!db) {
            db = await openDB(dbName)
        }

        return handleActions(actions)
    }
}
