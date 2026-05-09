import { kitr } from "./index.js";
import { Subscribable } from "./types.js";

const isSubscribable = (obj: any): obj is Subscribable => obj != null && typeof obj.subscribe === "function";

const requestUpdate = (ctx: any) => {
  if (typeof ctx.requestUpdate === "function") ctx.requestUpdate();
};

const patchDisconnect = (ctx: any, key: symbol, cleanup: () => void) => {
  if (typeof ctx.disconnectedCallback === "undefined") return;
  const cleanupKey = Symbol.for("kitr_cleanup");
  if (!ctx[cleanupKey]) {
    ctx[cleanupKey] = [];
    const original = ctx.disconnectedCallback;
    ctx.disconnectedCallback = function () {
      ctx[cleanupKey]?.forEach((fn: () => void) => fn());
      original?.call(this);
    };
  }
  ctx[cleanupKey].push(cleanup);
};

export function observe(name: string) {
  return (proto: any, key: string) => {
    Object.defineProperty(proto, key, {
      get() {
        const svcKey = Symbol.for(`kitr_svc_${name}`);
        if (!this[svcKey]) this[svcKey] = kitr.get(name);
        const service = this[svcKey];

        if (typeof window === "undefined") return service;

        const subKey = Symbol.for(`kitr_sub_${name}`);
        if (!this[subKey] && isSubscribable(service)) {
          this[subKey] = service.subscribe(() => requestUpdate(this));
          patchDisconnect(this, subKey, () => {
            if (typeof this[subKey] === "function") this[subKey]();
          });
        }

        return service;
      },
    });
  };
}

export function observeAsync(name: string) {
  return (proto: any, key: string) => {
    const instanceKey = Symbol.for(`kitr_inst_${name}`);
    const unsubKey = Symbol.for(`kitr_unsub_${name}`);
    const loadingKey = Symbol.for(`kitr_loading_${name}`);

    Object.defineProperty(proto, key, {
      get() {
        if (this[instanceKey]) return this[instanceKey];

        if (kitr.has(name)) {
          this[instanceKey] = kitr.get(name);
          return this[instanceKey];
        }

        if (!this[loadingKey]) {
          this[loadingKey] = true;
          kitr
            .getAsync(name)
            .then((service) => {
              this[instanceKey] = service;

              if (typeof window !== "undefined" && isSubscribable(service)) {
                this[unsubKey] = service.subscribe(() => requestUpdate(this));
                patchDisconnect(this, unsubKey, () => {
                  if (typeof this[unsubKey] === "function") this[unsubKey]();
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