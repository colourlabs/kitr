export class KitrRegistry {
    constructor() {
        this.instances = new Map();
        this.factories = new Map();
        this.pending = new Map();
        this.resolving = new Set();
    }
    /**
     * provide a service for the DI to inject later
     *
     * @param name id of the service, eg: app.auth
     * @param instance service class
     */
    provide(name, instance) {
        if (this.instances.has(name)) {
            console.warn(`[kitr] service "${name}" was already registered and has been overwritten`);
        }
        this.instances.set(name, instance);
    }
    /**
     * provides a lazyloaded service
     *
     * @param name id of the service
     * @param factory factory that loads the service
     */
    provideLazy(name, factory) {
        if (this.factories.has(name)) {
            console.warn(`[kitr] service "${name}" was already registered and has been overwritten`);
        }
        this.factories.set(name, factory);
    }
    get(name) {
        const instance = this.instances.get(name);
        if (!this.instances.has(name))
            throw new Error(`[kitr] service "${name}" is not registered`);
        return instance;
    }
    getAsync(name) {
        return this._resolve(name);
    }
    async _resolve(name) {
        if (this.resolving.has(name)) {
            throw new Error(`[kitr] circular dependency detected: ${[...this.resolving, name].join(" → ")}`);
        }
        if (this.instances.has(name))
            return this.instances.get(name);
        if (this.pending.has(name))
            return this.pending.get(name);
        const factory = this.factories.get(name);
        if (!factory)
            throw new Error(`[kitr] service "${name}" is not registered`);
        this.resolving.add(name);
        const p = factory()
            .then((module) => {
            const Constructor = module.default || module;
            const instance = typeof Constructor === "function" ? new Constructor() : Constructor;
            this.instances.set(name, instance);
            this.pending.delete(name);
            this.resolving.delete(name);
            return instance;
        })
            .catch((err) => {
            this.pending.delete(name);
            this.resolving.delete(name);
            throw err;
        });
        this.pending.set(name, p);
        return p;
    }
    has(name) {
        return this.instances.has(name);
    }
}
export const kitr = new KitrRegistry();
