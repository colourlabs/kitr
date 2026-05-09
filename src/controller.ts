import { kitr } from "./index.js";
import type { ReactiveController, ReactiveControllerHost } from "lit";

export class KitrController<T = any> implements ReactiveController {
  private _host: ReactiveControllerHost;
  private _name: string;
  private _unsub: (() => void) | null = null;

  constructor(host: ReactiveControllerHost, name: string) {
    this._host = host;
    this._name = name;
    host.addController(this);
  }

  get value(): T {
    return kitr.get(this._name);
  }

  get(): T {
    return kitr.get(this._name);
  }

  hostConnected() {
    const service = kitr.get(this._name);
    if (typeof (service as any).subscribe === "function") {
      this._unsub = (service as any).subscribe(() => this._host.requestUpdate());
    }
  }

  hostDisconnected() {
    this._unsub?.();
    this._unsub = null;
  }
}
