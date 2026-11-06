// Deterministic, offline comparison of two already-validated synthetic token maps.
import { compileTheme } from "./tokens.mjs";

export function compareThemes(beforeTokens, afterTokens) {
  const before = compileTheme(beforeTokens).resolved;
  const after = compileTheme(afterTokens).resolved;
  const paths = [...new Set([...Object.keys(before), ...Object.keys(after)])].sort();
  const changes = [];
  const summary = { added: 0, changed: 0, removed: 0, unchanged: 0 };
  for (const path of paths) {
    const hasBefore = Object.hasOwn(before, path);
    const hasAfter = Object.hasOwn(after, path);
    const kind = !hasBefore ? "added" : !hasAfter ? "removed" :
      before[path] === after[path] ? "unchanged" : "changed";
    summary[kind]++;
    if (kind !== "unchanged") {
      changes.push({
        token: path,
        kind,
        before: hasBefore ? before[path] : null,
        after: hasAfter ? after[path] : null
      });
    }
  }
  return { summary, changes };
}
