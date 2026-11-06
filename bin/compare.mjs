#!/usr/bin/env node
// Read-only comparison: two local synthetic JSON themes, no writes or network.
import { lstatSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { compareThemes } from "../src/compare.mjs";
import { TokenError } from "../src/tokens.mjs";

const LIMIT = 65_536;
const usage = "Usage: node bin/compare.mjs <before.json> <after.json>\n" +
  "Compare two local design-token themes; report added, changed and removed resolved tokens.\n";

function load(path) {
  const absolute = resolve(path);
  let source;
  try {
    const stats = lstatSync(absolute);
    if (!stats.isFile() || stats.isSymbolicLink() || stats.size > LIMIT)
      throw new TokenError("Expected a regular JSON file of at most 64 KiB.");
    source = readFileSync(absolute, "utf8");
  } catch (error) {
    if (error instanceof TokenError) throw error;
    throw new TokenError("Unable to read a local JSON input.");
  }
  try { return JSON.parse(source); }
  catch { throw new TokenError("Invalid JSON input."); }
}

const args = process.argv.slice(2);
if (args.length === 1 && ["--help", "-h"].includes(args[0])) {
  process.stdout.write(usage);
} else if (args.length !== 2 || args.some(x => !x || x.startsWith("-"))) {
  process.stderr.write("Error: Provide two local JSON theme files.\n" + usage);
  process.exitCode = 2;
} else {
  try {
    process.stdout.write(JSON.stringify(compareThemes(load(args[0]), load(args[1])), null, 2) + "\n");
  } catch (error) {
    process.stderr.write("Error: " + (error instanceof TokenError ?
      error.message : "Unexpected input processing error.") + "\n");
    process.exitCode = 1;
  }
}
