import { describe, it, expect, beforeEach, vi } from "vitest";
import { kitr } from "../src/index.js";
import { observe, observeAsync } from "../src/lit.js";

if (typeof window !== "undefined") {
  throw new Error("SSR tests must run in node environment");
}

beforeEach(() => {
  (kitr as any).instances.clear();
  (kitr as any).factories.clear();
  (kitr as any).pending.clear();
  (kitr as any).resolving.clear(); 
});

describe("observe (SSR)", () => {
  it("returns service without throwing", () => {
    const service = { value: 42 };
    kitr.provide("app.test", service);

    const proto = {} as any;
    observe("app.test")(proto, "myService");

    expect(() => proto.myService).not.toThrow();
    expect(proto.myService).toBe(service);
  });

  it("does not attempt to subscribe", () => {
    const subscribe = vi.fn();
    kitr.provide("app.test", { subscribe });

    const proto = {} as any;
    observe("app.test")(proto, "myService");
    proto.myService;

    expect(subscribe).not.toHaveBeenCalled();
  });
});

describe("observeAsync (SSR)", () => {
  it("returns undefined safely without throwing", () => {
    kitr.provideLazy("app.lazy", async () => ({ value: "lazy" }));

    const proto = {} as any;
    observeAsync("app.lazy")(proto, "myService");

    expect(() => proto.myService).not.toThrow();
    expect(proto.myService).toBeUndefined();
  });

  it("resolves correctly after pre-population", async () => {
    const service = { value: "preloaded" };
    kitr.provideLazy("app.lazy", async () => service);

    await kitr.getAsync("app.lazy");

    const proto = {} as any;
    observeAsync("app.lazy")(proto, "myService");

    expect(proto.myService).toBe(service);
  });
});
