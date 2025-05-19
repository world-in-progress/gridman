class Store {
    store: Map<string, any>
    static _ins: Store | null
    constructor() {
        this.store = new Map()
    }
    static instance() {
        if (Store._ins == null) {
            Store._ins = new Store()
        }
        return Store._ins
    }
    set(key: string, val: any) {
        this.store.set(key, val)
    }
    get<T>(key: string): T | null {
        return this.store.get(key)
    }
    subscribe<T>(key: string, callback: (value: T) => void): () => void {
        const listeners = this.store.get('listeners') || new Map<string, Array<(value: any) => void>>()
        if (!listeners.has(key)) {
            listeners.set(key, [])
        }
        const callbacks = listeners.get(key) as Array<(value: any) => void>
        callbacks.push(callback)
        this.store.set('listeners', listeners)
        return () => {
            const newCallbacks = callbacks.filter(cb => cb !== callback)
            listeners.set(key, newCallbacks)
            if (newCallbacks.length === 0) {
                listeners.delete(key)
            }
            this.store.set('listeners', listeners)
        }
    }
}

export default Store.instance()
