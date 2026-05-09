"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observe = observe;
exports.observeAsync = observeAsync;
const index_js_1 = require("./index.js");
const isSubscribable = (obj) => obj != null && typeof obj.subscribe === "function";
const requestUpdate = (ctx) => {
    if (typeof ctx.requestUpdate === "function")
        ctx.requestUpdate();
};
const patchDisconnect = (ctx, key, cleanup) => {
    if (typeof ctx.disconnectedCallback === "undefined")
        return;
    const cleanupKey = Symbol.for("kitr_cleanup");
    if (!ctx[cleanupKey]) {
        ctx[cleanupKey] = [];
        const original = ctx.disconnectedCallback;
        ctx.disconnectedCallback = function () {
            ctx[cleanupKey]?.forEach((fn) => fn());
            original?.call(this);
        };
    }
    ctx[cleanupKey].push(cleanup);
};
function observe(name) {
    return (proto, key) => {
        Object.defineProperty(proto, key, {
            get() {
                const svcKey = Symbol.for(`kitr_svc_${name}`);
                if (!this[svcKey])
                    this[svcKey] = index_js_1.kitr.get(name);
                const service = this[svcKey];
                if (typeof window === "undefined")
                    return service;
                const subKey = Symbol.for(`kitr_sub_${name}`);
                if (!this[subKey] && isSubscribable(service)) {
                    this[subKey] = service.subscribe(() => requestUpdate(this));
                    patchDisconnect(this, subKey, () => {
                        if (typeof this[subKey] === "function")
                            this[subKey]();
                    });
                }
                return service;
            },
        });
    };
}
function observeAsync(name) {
    return (proto, key) => {
        const instanceKey = Symbol.for(`kitr_inst_${name}`);
        const unsubKey = Symbol.for(`kitr_unsub_${name}`);
        const loadingKey = Symbol.for(`kitr_loading_${name}`);
        Object.defineProperty(proto, key, {
            get() {
                if (this[instanceKey])
                    return this[instanceKey];
                if (index_js_1.kitr.has(name)) {
                    this[instanceKey] = index_js_1.kitr.get(name);
                    return this[instanceKey];
                }
                if (!this[loadingKey]) {
                    this[loadingKey] = true;
                    index_js_1.kitr
                        .getAsync(name)
                        .then((service) => {
                        this[instanceKey] = service;
                        if (typeof window !== "undefined" && isSubscribable(service)) {
                            this[unsubKey] = service.subscribe(() => requestUpdate(this));
                            patchDisconnect(this, unsubKey, () => {
                                if (typeof this[unsubKey] === "function")
                                    this[unsubKey]();
                            });
                        }
                        requestUpdate(this);
                    })
                        .catch((err) => {
                        console.error(`[kitr] failed to lazy load ${name}:`, err);
                    });
                }
                return undefined;
            },
        });
    };
}
