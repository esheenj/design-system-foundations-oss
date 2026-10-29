import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const command = (...args) => spawnSync(process.execPath, ["bin/compile.mjs", ...args], {
  cwd: new URL("../", import.meta.url).pathname,
  encoding: "utf8",
  timeout: 5000
});

test("compiles a synthetic JSON theme to deterministic CSS", () => {
  const x = command("examples/theme.json");
  assert.equal(x.status, 0, x.stderr);
  assert.match(x.stdout, /--color-action: #2563eb;/);
  assert.match(x.stdout, /--spacing-md: 16px;/);
  assert.equal(x.stderr, "");
});
test("returns resolved token JSON on request", () => {
  const x = command("examples/theme.json", "--resolved");
  assert.equal(x.status, 0, x.stderr);
  assert.equal(JSON.parse(x.stdout)["color.action"], "#2563eb");
});
test("help works; invalid arguments and missing files fail safely", () => {
  assert.equal(command("--help").status, 0);
  assert.equal(command().status, 2);
  const x = command("./missing-private-file.json");
  assert.equal(x.status, 1);
  assert.equal(x.stdout, "");
  assert.match(x.stderr, /Unable to read/);
});
test("invalid JSON and unsupported CSS values never print source data", () => {
  const dir = mkdtempSync(join(tmpdir(), "public-token-cli-"));
  try {
    const bad = join(dir, "invalid.json");
    writeFileSync(bad, '{"password":"not-a-token",');
    const x = command(bad);
    assert.equal(x.status, 1);
    assert.equal(x.stdout, "");
    assert.doesNotMatch(x.stderr, /not-a-token/);
    writeFileSync(bad, JSON.stringify({ color: { bad: "red; malicious" } }));
    const y = command(bad);
    assert.equal(y.status, 1);
    assert.equal(y.stdout, "");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test("oversized local files are rejected before reading the content", () => {
  const dir = mkdtempSync(join(tmpdir(), "public-token-cli-"));
  try {
    const file = join(dir, "big.json");
    writeFileSync(file, "x".repeat(65_537));
    const x = command(file);
    assert.equal(x.status, 1);
    assert.match(x.stderr, /64 KiB/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
