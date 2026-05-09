# kitr

kitr is a lightweight dependency injection registry, with support for [Lit](https://lit.dev/) web components

```ts
import { kitr } from "kitr";

// kitr is registered as a singleton by defualt
kitr.provide("app.auth", new AuthService());

const auth = kitr.get("app.auth");
```

## registry

### `provide(name, instance)`

registers an already-instantiated service.

```ts
import { kitr } from "kitr";

kitr.provide("app.counter", new CounterService());
```

### `provideLazy(name, factory)`

registers a service via an async factory. the factory is only called on the first `getAsync` call, subsequent calls return the cached instance.

```ts
kitr.provideLazy("app.db", () => import("./db").then((m) => new m.DbService()));
```

### `get(name)`

retrieves a registered service synchronously.

```ts
const counter = kitr.get("app.counter");
```

### `getAsync(name)`

resolves a service asynchronously, invoking its factory if needed.

```ts
const db = await kitr.getAsync("app.db");
```

### `has(name)`

returns `true` if a service is already registered as an instance.

```ts
if (kitr.has("app.db")) {
  const db = kitr.get("app.db");
}
```

---

## type safety

extend `KitrServices` to get typed `get` and `getAsync` calls:

```ts
// types.ts
import type { CounterService } from "./counter.service";
import type { DbService } from "./db.service";

declare module "kitr" {
  interface KitrServices {
    "app.counter": CounterService;
    "app.db": DbService;
  }
}
```

now `kitr.get('app.counter')` returns `CounterService` without a type assertion.

---

## lit integration

import from `kitr/lit` to use the reactive decorators.

### `@observe(name)`

bninds a registered service to a component property. when the service calls `notify()`, the component re-renders automatically. subscribes once and cleans up on disconnect.

```ts
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { observe } from "kitr/lit";

@customElement("my-counter")
class Counter extends LitElement {
  @observe("app.counter")
  declare counter: CounterService;

  render() {
    return html`<span>${this.counter.value}</span>`;
  }
}
```

### `@observeAsync(name)`

like `@observe`, but for lazily registered services. returns `undefined` until the service resolves, then triggers a re-render.

```ts
@customElement("my-db-view")
class DbView extends LitElement {
  @observeAsync("app.db")
  declare db: DbService | undefined;

  render() {
    if (!this.db) return html`<span>Loading...</span>`;
    return html`<span>${this.db.status}</span>`;
  }
}
```

both decorators are SSR-safe, subscription and update logic is skipped in non-browser environments.

### `KitrController` (plain JS)

for projects without TypeScript decorators, import from `kitr/controller`. a reactive controller that hooks into the component lifecycle automatically.

```js
import { LitElement, html } from "lit";
import { KitrController } from "kitr/controller";

class MyCounter extends LitElement {
  counter = new KitrController(this, "app.counter");

  render() {
    return html`${this.counter.value?.value}`;
  }
}

customElements.define("my-counter", MyCounter);
```

the controller subscribes when the component connects and unsubscribes when it disconnects, no manual cleanup needed.

---

## Writing Services

extend `KitrService` to get batched notifications and automatic subscriber management.

```ts
import { KitrService } from "kitr";

export class CounterService extends KitrService {
  private _value = 0;

  get value() {
    return this._value;
  }

  increment() {
    this.updateState(() => {
      this._value++;
    });
  }

  decrement() {
    this.updateState(() => {
      this._value--;
    });
  }
}
```

`updateState` runs your updater and schedules a batched notification in the next microtask, multiple state changes in the same execution cycle result in a single re-render.

### `KitrService` API

| method            | description                                              |
| ----------------- | -------------------------------------------------------- |
| `subscribe(cb)`   | registers a subscriber. returns an unsubscribe function. |
| `notify()`        | schedules a batched notification (next microtask).       |
| `updateState(fn)` | runs `fn` then calls `notify()`.                         |
| `dispose()`       | clears all subscribers.                                  |

---

## SSR

For server-side rendering, pre-resolve lazy services before rendering. Since `observeAsync` checks the instance cache synchronously, pre-resolved services are returned immediately without async overhead:

```ts
// server entry point
await kitr.getAsync("app.db");
await kitr.getAsync("app.auth");

// components rendered here will receive services synchronously
const html = renderToString(template);
```

---

## registering at app startup

```ts
// main.ts
import { kitr } from "kitr";
import { CounterService } from "./counter.service";

kitr.provide("app.counter", new CounterService());

// lazy - only loaded when first requested
kitr.provideLazy("app.db", () => import("./db.service").then((m) => new m.DbService()));
```

---

## isolated Instances for Testing

the exported `kitr` is a singleton for convenience. for testing, create isolated instances:

```ts
import { KitrRegistry } from "kitr";

const registry = new KitrRegistry();
registry.provide("app.counter", new MockCounterService());
```

clean up between tests:

```ts
beforeEach(() => {
  (kitr as any).instances.clear();
  (kitr as any).factories.clear();
  (kitr as any).pending.clear();
  (kitr as any).resolving.clear();
});
```

---
