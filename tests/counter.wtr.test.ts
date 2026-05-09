import { fixture, expect } from "@open-wc/testing";
import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { observe } from "../src/lit.js";
import { kitr } from "../src/index.js";

@customElement("my-counter")
class Counter extends LitElement {
  //@ts-ignore
  @observe("app.counter")
  counter: any;

  render() {
    return html`<span>${this.counter?.value}</span>`;
  }
}

//@ts-ignore
beforeEach(() => {
  (kitr as any).instances.clear();
  (kitr as any).factories.clear();
  (kitr as any).pending.clear();
  (kitr as any).resolving.clear();
});

//@ts-ignore
afterEach(() => {
  // clean up any elements added to the DOM
  document.body.innerHTML = "";
});

//@ts-ignore
it("observe decorator binds to service", async () => {
  kitr.provide("app.counter", { value: 99, subscribe: () => () => {} });

  const el = await fixture<Counter>(html`<my-counter></my-counter>`);
  await el.updateComplete;

  expect(el.shadowRoot!.querySelector("span")!.textContent).to.equal("99");
});
