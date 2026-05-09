import { fixture, expect } from "@open-wc/testing";
import { LitElement, html } from "lit";
import { KitrController } from "../src/controller.js";
import { kitr } from "../src/index.js";

class CounterElement extends LitElement {
  counter = new KitrController(this, "app.counter");

  render() {
    return html`<span>${this.counter.value?.value}</span>`;
  }
}

customElements.define("plain-counter", CounterElement);

//@ts-ignore
beforeEach(() => {
  (kitr as any).instances.clear();
  (kitr as any).factories.clear();
  (kitr as any).pending.clear();
  (kitr as any).resolving.clear();
});

//@ts-ignore
afterEach(() => {
  document.body.innerHTML = "";
});

//@ts-ignore
it("KitrController binds to service", async () => {
  kitr.provide("app.counter", { value: 42, subscribe: () => () => {} });

  const el = await fixture<CounterElement>(html`<plain-counter></plain-counter>`);
  await el.updateComplete;

  expect(el.shadowRoot!.querySelector("span")!.textContent).to.equal("42");
});

//@ts-ignore
it("KitrController subscribes and triggers re-render on change", async () => {
  let notify: () => void;
  const service = {
    value: 1,
    subscribe: (cb: () => void) => {
      notify = cb;
      return () => {};
    },
  };

  kitr.provide("app.counter", service);

  const el = await fixture<CounterElement>(html`<plain-counter></plain-counter>`);
  await el.updateComplete;

  expect(el.shadowRoot!.querySelector("span")!.textContent).to.equal("1");

  // simulate service state change
  service.value = 2;
  notify!();
  await el.updateComplete;

  expect(el.shadowRoot!.querySelector("span")!.textContent).to.equal("2");
});

//@ts-ignore
it("KitrController unsubscribes on disconnect", async () => {
  let unsubCalled = 0;
  kitr.provide("app.counter", {
    value: 1,
    subscribe: () => () => { unsubCalled++; },
  });

  const el = await fixture<CounterElement>(html`<plain-counter></plain-counter>`);
  el.remove();

  expect(unsubCalled).to.equal(1);
});