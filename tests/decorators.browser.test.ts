import { describe, it, expect, vi, beforeEach } from "vitest";
import { kitr } from "../src/index.js";
import { observe, observeAsync } from "../src/lit.js";

const makeMockComponent = () =>
  ({
    requestUpdate: vi.fn(),
    disconnectedCallback: vi.fn(),
  } as Record<string, any>);

beforeEach(() => {
  (kitr as any).instances.clear();
  (kitr as any).factories.clear();
  (kitr as any).pending.clear();
  (kitr as any).resolving.clear();
});

describe("observe (browser)", () => {
  it("returns the registered service", () => {
    const service = { value: 42 };
    kitr.provide("app.test", service);

    const proto = makeMockComponent();
    observe("app.test")(proto, "myService");

    expect(proto.myService).toBe(service);
  });

  it("subscribes if service is subscribable", () => {
    const unsub = vi.fn();
    const service = { subscribe: vi.fn(() => unsub) };
    kitr.provide("app.test", service);

    const proto = makeMockComponent();
    observe("app.test")(proto, "myService");

    proto.myService; // trigger get
    expect(service.subscribe).toHaveBeenCalledOnce();
  });

  it("unsubscribes on disconnectedCallback", () => {
    const unsub = vi.fn();
    const service = { subscribe: vi.fn(() => unsub) };
    kitr.provide("app.test", service);

    const proto = makeMockComponent();
    observe("app.test")(proto, "myService");

    proto.myService; // trigger subscription
    proto.disconnectedCallback();

    expect(unsub).toHaveBeenCalledOnce();
  });

  it("does not double-subscribe on multiple accesses", () => {
    const service = { subscribe: vi.fn(() => vi.fn()) };
    kitr.provide("app.test", service);

    const proto = makeMockComponent();
    observe("app.test")(proto, "myService");

    proto.myService;
    proto.myService;
    proto.myService;

    expect(service.subscribe).toHaveBeenCalledOnce();
  });
});

describe("observeAsync (browser)", () => {
  it("returns undefined initially then resolves", async () => {
    const service = { value: "lazy" };
    kitr.provideLazy("app.lazy", async () => service);

    const proto = makeMockComponent();
    observeAsync("app.lazy")(proto, "myService");

    expect(proto.myService).toBeUndefined();

    await new Promise((r) => setTimeout(r, 0));

    expect(proto.myService).toBe(service);
    expect(proto.requestUpdate).toHaveBeenCalled();
  });

  it("logs error on failed lazy load", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    kitr.provideLazy("app.broken", async () => {
      throw new Error("load failed");
    });

    const proto = makeMockComponent();
    observeAsync("app.broken")(proto, "myService");

    proto.myService;
    await new Promise((r) => setTimeout(r, 0));

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[kitr]"), expect.any(Error));
  });
});
