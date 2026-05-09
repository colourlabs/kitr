import { KitrServices } from "./types";
export declare class KitrRegistry {
    private instances;
    private factories;
    private pending;
    private resolving;
    /**
     * provide a service for the DI to inject later
     *
     * @param name id of the service, eg: app.auth
     * @param instance service class
     */
    provide(name: string, instance: any): void;
    /**
     * provides a lazyloaded service
     *
     * @param name id of the service
     * @param factory factory that loads the service
     */
    provideLazy(name: string, factory: () => Promise<any>): void;
    /**
     * get service to inject
     *
     * @param name id for the service, eg: app.auth
     * @returns service class
     */
    get<K extends keyof KitrServices>(name: K): KitrServices[K];
    get<T = any>(name: string): T;
    getAsync<K extends keyof KitrServices>(name: K): Promise<KitrServices[K]>;
    getAsync<T = any>(name: string): Promise<T>;
    private _resolve;
    has(name: string): boolean;
}
export declare const kitr: KitrRegistry;
