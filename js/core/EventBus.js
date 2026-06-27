export class EventBus {
    constructor() {
        this._listeners = {};
    }

    on(event, callback) {
        if (!this._listeners[event]) this._listeners[event] = new Set();
        this._listeners[event].add(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        this._listeners[event]?.delete(callback);
    }

    emit(event, payload) {
        this._listeners[event]?.forEach(fn => fn(payload));
    }
}
