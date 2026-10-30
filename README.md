# Design System Foundations

[![Tests](https://github.com/esheenj/design-system-foundations-oss/actions/workflows/test.yml/badge.svg)](https://github.com/esheenj/design-system-foundations-oss/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](package.json)

**An offline-first design-token compiler and contrast demonstration from [Esheen Labs](https://github.com/esheenj).** A small, dependency-free JavaScript reference implementation for people building consistent, accessible-minded user interfaces.

> **Project status:** educational open-source reference, not a full design-system product, accessibility audit, or certification.

## What it does

- **Token compilation:** flatten nested token objects into deterministic, CSS custom-property output.
- **Aliases:** resolve references such as `{color.brand}`, with explicit errors for missing references and cycles.
- **Input checks:** reject invalid token names and unsupported CSS values rather than silently emitting arbitrary declarations.
- **Contrast demonstration:** calculate a WCAG-style luminance-based contrast ratio for two six-digit hex colors.
- **Offline and dependency-free:** run on Node.js 20+ without network services or third-party runtime dependencies.
- **Reproducible tests:** use Node's built-in test runner and a checked-in sample theme.

## Try it in two commands

Requires **Node.js 20+**.

```bash
npm test
npm run demo
```

The demo prints resolved tokens, a sample text/surface contrast ratio, and generated CSS.

## Use it from the command line

Compile a **local synthetic JSON theme** directly to CSS custom properties; no install, network connection, API key or output file is required.

```bash
node bin/compile.mjs examples/theme.json
node bin/compile.mjs examples/theme.json --resolved
node bin/compile.mjs --help
```

The first command prints CSS. The second prints resolved tokens as JSON. The tool reads only the explicitly named regular file, up to **64 KiB**, and writes no files. It rejects malformed JSON and unsupported token values.

## Use it in code

```js
import { compileTheme, contrastRatio } from "./src/tokens.mjs";

const tokens = {
  color: {
    brand: "#2563eb",
    action: "{color.brand}",
    text: "#111827",
    surface: "#ffffff"
  },
  spacing: { md: "16px" }
};

const { resolved, css } = compileTheme(tokens);
console.log(resolved["color.action"]); // "#2563eb"
console.log(css); // :root { --color-action: #2563eb; ... }
console.log(contrastRatio("#111827", "#ffffff"));
```

The source lives in [`src/tokens.mjs`](src/tokens.mjs), the complete runnable example in [`examples/demo.mjs`](examples/demo.mjs), and the tests in [`tests/tokens.test.mjs`](tests/tokens.test.mjs).

## API at a glance

| Export | Purpose |
| --- | --- |
| `flattenTokens(input)` | Convert supported nested token objects into dot-separated paths. |
| `compileTheme(tokens)` | Return `{ resolved, css }` with resolved aliases and stable CSS custom properties. |
| `contrastRatio(foreground, background)` | Return a rounded numeric contrast ratio for two `#RRGGBB` colors. |
| `TokenError` | Explicit error type for unsupported or invalid input. |

**Supported compiled values:** six-digit hex colors, nonnegative integers, and nonnegative numeric values with `px`, `rem`, `em`, or `%` units. Other CSS values are intentionally outside the current allowlist.

Token groups must be plain objects or objects with a null prototype. Unsupported object instances (such as Date, Map, Set, typed arrays or custom classes) throw `TokenError` with the group path rather than disappearing from output. Aliases resolve only explicitly supplied token paths; inherited object properties are never token definitions.

## For developers and AI coding agents

- **Start here:** read this README, run `npm test`, then explore `src/tokens.mjs`.
- **Keep changes bounded:** add tests for new aliases, value types, or validation behavior.
- **No implicit network calls:** the core module is intentionally deterministic and offline.
- **Open a focused pull request:** explain the user problem, show the expected output, and document any new input formats.
- **Contribution guidelines:** see [CONTRIBUTING.md](CONTRIBUTING.md) and the [AI agent instructions](AGENTS.md).

## Scope, accessibility and security

Contrast calculation is a **demonstration of a numeric color comparison**; it does not prove WCAG conformance. A complete accessibility review also requires contextual evaluation of text sizes, UI states, components, interactions, semantics, and browser behavior.

The compiler checks a deliberately small set of token values. This does **not** make it a general-purpose CSS sanitizer or a secure substitute for review of untrusted data.

### Public-release provenance

This repository is an original, intentionally isolated open-source release assembled from an explicitly reviewed source allowlist into fresh Git history. It contains synthetic examples. It does not publish the history, credentials, planning files, or source of the private incubator.

## Contributing

Issues, reproducible bug reports, docs improvements, and small tested pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md). Please do not include secrets, proprietary assets, customer data, or vulnerabilities with exploit details in public issues.

Maintained as an [Esheen Labs](https://github.com/esheenj) open-source project. Licensed under [MIT](LICENSE).

## Related public tools

- [Mobile-first Flow Kit](https://github.com/esheenj/mobile-first-flow-kit-oss): offline journey model and responsive validation/focus demo.
- [Data Table Interactions](https://github.com/esheenj/data-table-interactions-oss): bounded filtering, stable sorting and pagination over synthetic rows.

AI-assisted contributors can inspect [project-manifest.json](project-manifest.json) for entrypoints, commands and scope. It is descriptive metadata, not execution authority.

