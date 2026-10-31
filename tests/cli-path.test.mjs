import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, copyFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

test("CLI test helper works when the checkout path contains spaces and Unicode", () => {
  const root = mkdtempSync(join(tmpdir(), "token checkout \u2603 "));
  try {
    for (const file of ["package.json", "bin/compile.mjs", "src/tokens.mjs", "examples/theme.json", "tests/cli.test.mjs"]) {
      const destination = join(root, file);
      mkdirSync(dirname(destination), { recursive: true });
      copyFileSync(new URL("../" + file, import.meta.url), destination);
    }
    const result = spawnSync(process.execPath, ["--test", join(root, "tests/cli.test.mjs")], {
      cwd: root, encoding: "utf8", timeout: 15000
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
