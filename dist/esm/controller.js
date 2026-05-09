import { kitr } from "./index.js";
export class KitrController {
    constructor(host, name) {
        this._unsub = null;
        this._host = host;
        this._name = name;
        host.addController(this);
    }
    get value() {
        return kitr.get(this._name);
    }
    get() {
        return kitr.get(this._name);
    }
    hostConnected() {
        const service = kitr.get(this._name);
        if (typeof service.subscribe === "function") {
            this._unsub = service.subscribe(() => this._host.requestUpdate());
        }
    }
    hostDisconnected() {
        this._unsub?.();
        this._unsub = null;
    }
}
