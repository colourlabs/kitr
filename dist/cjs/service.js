"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KitrService = void 0;
class KitrService {
    constructor() {
        this._subscribers = new Set();
        this._pendingNotify = false;
        this._disposed = false;
    }
    subscribe(callback) {
        if (this._disposed) {
            console.warn("[kitr] attempted to subscribe to a disposed service");
            return () => { };
        }
        this._subscribers.add(callback);
        return () => this._subscribers.delete(callback);
    }
    /**
     * schedules a notification for the next microtask.
     * multiple calls in the same execution cycle will only result in one notification.
     */
    notify() {
        if (this._pendingNotify || this._disposed)
            return;
        this._pendingNotify = true;
        queueMicrotask(() => {
            this._subscribers.forEach((cb) => cb());
            this._pendingNotify = false;
        });
    }
    /**
     * runs the updater then schedules a batched notification.
     * subscribers will be called in the next microtask, not synchronously.
     */
    updateState(updater) {
        try {
            updater();
        }
        finally {
            this.notify();
        }
    }
    dispose() {
        this._disposed = true;
        this._subscribers.clear();
    }
}
exports.KitrService = KitrService;
