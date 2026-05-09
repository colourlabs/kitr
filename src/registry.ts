import { KitrServices } from "./types";

export class KitrRegistry {
  private instances = new Map<string, any>();
  private factories = new Map<string, () => Promise<any>>();
  private pending = new Map<string, Promise<any>>();
  private resolving = new Set<string>();

  /**
   * provide a service for the DI to inject later
   *
   * @param name id of the service, eg: app.auth
   * @param instance service class
   */
  provide(name: string, instance: any): void {
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
  provideLazy(name: string, factory: () => Promise<any>) {
    if (this.factories.has(name)) {
      console.warn(`[kitr] service "${name}" was already registered and has been overwritten`);
    }
    this.factories.set(name, factory);
  }

  /**
   * get service to inject
   *
   * @param name id for the service, eg: app.auth
   * @returns service class
   */
  get<K extends keyof KitrServices>(name: K): KitrServices[K];
  get<T = any>(name: string): T;
  get(name: string): any {
    const instance = this.instances.get(name);
    if (!this.instances.has(name)) throw new Error(`[kitr] service "${name}" is not registered`);
    return instance;
  }

  getAsync<K extends keyof KitrServices>(name: K): Promise<KitrServices[K]>;
  getAsync<T = any>(name: string): Promise<T>;
  getAsync(name: string): Promise<any> {
    return this._resolve(name);
  }

  private async _resolve(name: string): Promise<any> {
    if (this.resolving.has(name)) {
      throw new Error(`[kitr] circular dependency detected: ${[...this.resolving, name].join(" → ")}`);
    }

    if (this.instances.has(name)) return this.instances.get(name);
    if (this.pending.has(name)) return this.pending.get(name);

    const factory = this.factories.get(name);
    if (!factory) throw new Error(`[kitr] service "${name}" is not registered`);

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

  has(name: string): boolean {
    return this.instances.has(name);
  }
}

export const kitr = new KitrRegistry();
