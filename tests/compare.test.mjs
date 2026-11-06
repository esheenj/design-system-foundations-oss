import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compareThemes } from "../src/compare.mjs";
import { TokenError } from "../src/tokens.mjs";

const command = (...args) => spawnSync(process.execPath, ["bin/compare.mjs", ...args], {
  cwd: new URL("../", import.meta.url),
  encoding: "utf8",
  timeout: 5000
});

test("reports resolved alias changes and added tokens in deterministic order", () => {
  const result = command("examples/theme.json", "examples/theme-next.json");
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.deepEqual(report.summary, { added: 1, changed: 3, removed: 0, unchanged: 3 });
  assert.deepEqual(report.changes.map(x => [x.token, x.kind]), [
    ["color.action", "changed"],
    ["color.brand", "changed"],
    ["spacing.lg", "added"],
    ["spacing.md", "changed"]
  ]);
  assert.equal(report.changes[0].before, "#2563eb");
  assert.equal(report.changes[0].after, "#15803d");
  assert.equal(result.stderr, "");
});

test("same theme produces no changes and explicit unchanged count", () => {
  const report = JSON.parse(command("examples/theme.json", "examples/theme.json").stdout);
  assert.deepEqual(report.summary, { added: 0, changed: 0, removed: 0, unchanged: 6 });
  assert.deepEqual(report.changes, []);
});

test("detects removal and does not mutate source input", () => {
  const left = { color: { brand: "#2563eb" }, spacing: { sm: "8px" } };
  const right = { color: { brand: "#2563eb" } };
  const original = structuredClone(left);
  const report = compareThemes(left, right);
  assert.deepEqual(report.summary, { added: 0, changed: 0, removed: 1, unchanged: 1 });
  assert.deepEqual(report.changes, [{ token: "spacing.sm", kind: "removed",
                                      before: "8px", after: null }]);
  assert.deepEqual(left, original);
});

test("invalid aliases and CSS values cannot be compared", () => {
  assert.throws(() => compareThemes({ color: { brand: "{missing}" } },
                                    { color: { brand: "#ffffff" } }), TokenError);
  assert.throws(() => compareThemes({ color: { brand: "#ffffff" } },
                                    { color: { brand: "red; background:url(x)" } }), TokenError);
});

test("help, invalid arguments, invalid JSON and missing files fail safely", () => {
  assert.equal(command("--help").status, 0);
  assert.equal(command().status, 2);
  assert.equal(command("examples/theme.json").status, 2);
  assert.equal(command("--unsafe", "examples/theme.json").status, 2);
  const missing = command("examples/theme.json", "./not-here.json");
  assert.equal(missing.status, 1);
  assert.equal(missing.stdout, "");
  const dir = mkdtempSync(join(tmpdir(), "public-theme-compare-"));
  try {
    const file = join(dir, "invalid.json");
    writeFileSync(file, '{"sensitive-token":"not-printed",');
    const result = command("examples/theme.json", file);
    assert.equal(result.status, 1);
    assert.equal(result.stdout, "");
    assert.doesNotMatch(result.stderr, /not-printed/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("oversized and linked inputs are rejected without printing local contents", () => {
  const dir = mkdtempSync(join(tmpdir(), "public-theme-compare-"));
  try {
    const file = join(dir, "big.json");
    const link = join(dir, "alias.json");
    writeFileSync(file, "x".repeat(65_537));
    symlinkSync(file, link);
    for (const path of [file, link]) {
      const result = command("examples/theme.json", path);
      assert.equal(result.status, 1);
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /64 KiB/);
    }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
