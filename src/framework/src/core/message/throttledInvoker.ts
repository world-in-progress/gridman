class ThrottledInvoker {

    private _triggered = false
    private _callback: Function
    private _channel: MessageChannel | undefined

    constructor(callback: Function) {

        this._callback = callback
        if (typeof MessageChannel !== 'undefined') {
            this._channel = new MessageChannel()
            this._channel.port2.onmessage = () => this._process()
        }
    }

    private _process() {
        
        this._triggered = false
        this._callback()
    }

    trigger() {

        if (!this._triggered) {
            this._triggered = true

            if (this._channel) this._channel.port1.postMessage(true)
            else setTimeout(() => this._process(), 0)
        }
    }

    remove() {

        this._channel = undefined
        this._callback = () => {}
    }
}

export default ThrottledInvoker
