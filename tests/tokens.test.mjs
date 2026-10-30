import test from "node:test";
import assert from "node:assert/strict";
import { compileTheme, contrastRatio, flattenTokens, TokenError } from "../src/tokens.mjs";
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

