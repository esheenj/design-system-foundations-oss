import test from "node:test";
import assert from "node:assert/strict";
import { compileTheme, contrastRatio, flattenTokens, MAX_GROUP_DEPTH, TokenError } from "../src/tokens.mjs";
import { demoTokens } from "../examples/sample.mjs";

test("compiles theme, resolves aliases and produces stable CSS", () => {
  const compiled = compileTheme(demoTokens);
  assert.equal(compiled.resolved["color.action"], "#2563eb");
  assert.match(compiled.css, /--color-action: #2563eb;/);
  assert.match(compiled.css, /--spacing-md: 16px;/);
});
test("does not mutate caller token input", () => {
  const original = structuredClone(demoTokens);
  compileTheme(demoTokens);
  assert.deepEqual(demoTokens, original);
});
test("unknown reference is rejected with context", () => {
  assert.throws(() => compileTheme({ color: { action: "{color.missing}" } }), /Unknown token reference: color.missing/);
});
test("cycles are rejected", () => {
  assert.throws(() => compileTheme({ a: "{b}", b: "{a}" }), /Circular token reference/);
});
test("CSS injection and malformed input are rejected", () => {
  assert.throws(() => compileTheme({ color: { injected: "red; background: url(secret)" } }), TokenError);
  assert.throws(() => flattenTokens({ "bad token": "1px" }), TokenError);
  assert.throws(() => compileTheme({ a: null }), TokenError);
});
test("contrast matches WCAG luminance reference for black and white", () => {
  assert.equal(contrastRatio("#000000", "#ffffff"), 21);
  assert.equal(contrastRatio("#ffffff", "#ffffff"), 1);
  assert.throws(() => contrastRatio("red", "#ffffff"), /six-digit hex/);
});

test("unsupported object instances fail at their token path instead of disappearing", () => {
  class CustomGroup { constructor() { this.valid = "16px"; } }
  for (const value of [new Date(0), new Map(), new Set(), new CustomGroup(), new String("16px"), new Uint8Array([1])]) {
    assert.throws(() => compileTheme({ color: { brand: "#2563eb" }, unsupported: value }),
      error => error instanceof TokenError && /unsupported/.test(error.message));
    assert.throws(() => flattenTokens(value), TokenError);
  }
});

test("plain and null-prototype groups remain supported without mutation", () => {
  const spacing = Object.assign(Object.create(null), { md: "16px", lg: "32px" });
  const input = Object.freeze({ spacing: Object.freeze(spacing), color: { brand: "#2563eb" } });
  const result = compileTheme(input);
  assert.equal(result.resolved["spacing.md"], "16px");
  assert.match(result.css, /--spacing-lg: 32px;/);
  assert.equal(Object.getPrototypeOf(spacing), null);
  assert.equal(spacing.md, "16px");
});

test("inherited object properties cannot satisfy missing token aliases", () => {
  assert.throws(() => compileTheme({ spacing: { md: "{constructor}" } }),
    error => error instanceof TokenError && /Unknown token reference: constructor/.test(error.message));
  const explicit = compileTheme({ constructor: "16px", spacing: { md: "{constructor}" } });
  assert.equal(explicit.resolved["spacing.md"], "16px");
});

test("rejects direct circular token group reference with TokenError", () => {
  const group = {};
  group.self = group;
  assert.throws(
    () => compileTheme({ group }),
    error => error instanceof TokenError && /Circular token group reference at group\.self/.test(error.message)
  );
  assert.throws(
    () => flattenTokens(group),
    error => error instanceof TokenError && /Circular token group reference at self/.test(error.message)
  );
});

test("rejects indirect circular token group references with TokenError", () => {
  const a = {};
  const b = {};
  a.b = b;
  b.a = a;
  assert.throws(
    () => compileTheme({ a }),
    error => error instanceof TokenError && /Circular token group reference at a\.b\.a/.test(error.message)
  );

  const node1 = {};
  const node2 = {};
  const node3 = {};
  node1.next = node2;
  node2.next = node3;
  node3.next = node1;
  assert.throws(
    () => compileTheme({ chain: node1 }),
    error => error instanceof TokenError && /Circular token group reference at chain\.next\.next\.next/.test(error.message)
  );
});

test("preserves legitimate reused non-cyclic group objects across branches", () => {
  const shared = { base: "16px", large: "24px" };
  const input = {
    card: { spacing: shared },
    modal: { spacing: shared }
  };
  const { resolved, css } = compileTheme(input);
  assert.equal(resolved["card.spacing.base"], "16px");
  assert.equal(resolved["card.spacing.large"], "24px");
  assert.equal(resolved["modal.spacing.base"], "16px");
  assert.equal(resolved["modal.spacing.large"], "24px");
  assert.match(css, /--card-spacing-base: 16px;/);
  assert.match(css, /--modal-spacing-base: 16px;/);
});

test("compiles valid nested token groups up to the allowed boundary", () => {
  let current = { value: "16px" };
  for (let i = 10; i >= 1; i--) {
    current = { [`level${i}`]: current };
  }
  const result = compileTheme(current);
  const expectedKey = Array.from({ length: 10 }, (_, i) => `level${i + 1}`).join(".") + ".value";
  assert.equal(result.resolved[expectedKey], "16px");
  assert.match(result.css, new RegExp(`--${expectedKey.replaceAll(".", "-")}: 16px;`));
});

test("bounds nesting depth to MAX_GROUP_DEPTH and rejects deeper nesting", () => {
  assert.equal(MAX_GROUP_DEPTH, 10);
  let current = { value: "16px" };
  for (let i = 11; i >= 1; i--) {
    current = { [`level${i}`]: current };
  }
  assert.throws(
    () => compileTheme(current),
    error => error instanceof TokenError && new RegExp(`Maximum token group depth of ${MAX_GROUP_DEPTH} exceeded`).test(error.message)
  );
});

test("handles cyclic and shared null-prototype groups correctly", () => {
  const nullCycle = Object.create(null);
  nullCycle.self = nullCycle;
  assert.throws(
    () => compileTheme({ group: nullCycle }),
    error => error instanceof TokenError && /Circular token group reference at group\.self/.test(error.message)
  );

  const sharedNull = Object.assign(Object.create(null), { size: "8px" });
  const input = {
    box: Object.assign(Object.create(null), { pad: sharedNull }),
    panel: Object.assign(Object.create(null), { pad: sharedNull })
  };
  const { resolved, css } = compileTheme(input);
  assert.equal(resolved["box.pad.size"], "8px");
  assert.equal(resolved["panel.pad.size"], "8px");
  assert.match(css, /--box-pad-size: 8px;/);
  assert.match(css, /--panel-pad-size: 8px;/);
});
