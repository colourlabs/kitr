import type { ReactiveController, ReactiveControllerHost } from "lit";
export declare class KitrController<T = any> implements ReactiveController {
    private _host;
    private _name;
    private _unsub;
    constructor(host: ReactiveControllerHost, name: string);
    get value(): T;
    get(): T;
    hostConnected(): void;
    hostDisconnected(): void;
}
