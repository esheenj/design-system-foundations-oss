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
