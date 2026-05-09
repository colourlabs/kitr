"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KitrController = void 0;
const index_js_1 = require("./index.js");
class KitrController {
    constructor(host, name) {
        this._unsub = null;
        this._host = host;
        this._name = name;
        host.addController(this);
    }
    get value() {
        return index_js_1.kitr.get(this._name);
    }
    get() {
        return index_js_1.kitr.get(this._name);
    }
    hostConnected() {
        const service = index_js_1.kitr.get(this._name);
        if (typeof service.subscribe === "function") {
            this._unsub = service.subscribe(() => this._host.requestUpdate());
        }
    }
    hostDisconnected() {
        this._unsub?.();
        this._unsub = null;
    }
}
exports.KitrController = KitrController;
