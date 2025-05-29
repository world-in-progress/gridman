import { CheckingSwitch } from "./context"

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
}

export default Store.instance()

Store.instance().set('checkingSwitch', new CheckingSwitch())
