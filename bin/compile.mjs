#!/usr/bin/env node
// Offline, read-only JSON design token to CSS utility.
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { compileTheme, TokenError } from "../src/tokens.mjs";

const MAX_BYTES = 65_536;
const usage = "Usage: node bin/compile.mjs <theme.json> [--resolved]\n" +
  "Compile a local JSON token object to CSS custom properties.\n" +
  "Use --resolved to print resolved token values as JSON. No files are written.\n";
const args = process.argv.slice(2);

function fail(message, exitCode = 2) {
  process.stderr.write("Error: " + message + "\n" + usage);
  process.exitCode = exitCode;
}

if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
  process.stdout.write(usage);
} else if ((args.length !== 1 && args.length !== 2) ||
           !args[0] || args[0].startsWith("-") ||
           (args.length === 2 && args[1] !== "--resolved")) {
  fail("Provide a local JSON file and an optional --resolved flag.");
} else {
  try {
    const path = resolve(args[0]);
    let data;
    try {
      const metadata = statSync(path);
      if (!metadata.isFile() || metadata.size > MAX_BYTES) {
        throw new TokenError("Expected a regular JSON file of at most 64 KiB.");
      }
      data = readFileSync(path, "utf8");
    } catch (error) {
      if (error instanceof TokenError) throw error;
      throw new TokenError("Unable to read the local JSON input.");
    }
    let tokens;
    try { tokens = JSON.parse(data); }
    catch { throw new TokenError("Invalid JSON input."); }
    const { css, resolved } = compileTheme(tokens);
    process.stdout.write(args[1] === "--resolved" ?
      JSON.stringify(resolved, null, 2) + "\n" : css);
  } catch (error) {
    if (error instanceof TokenError) fail(error.message, 1);
    else fail("Unexpected input processing error.", 1);
  }
}
