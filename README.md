# Design System Foundations

**Explore more open-source tools:** [Browse the live Esheen Labs AI and developer playgrounds](https://esheenj.github.io/compound-intelligence-starter/) for agent trust, prompt evaluation, dataset quality, UX patterns, design systems and engineering utilities. Each featured project links to its public source and interactive demo. Additional browser tools may live within an existing repository; demo-page totals should not be mistaken for separate GitHub repositories. All examples use fictional data and have documented limitations.

**Who this is for:** Design tokens, live theme preview and a practical path from colour choices to reusable CSS.

**[Open the GitHub-deployed interactive design-token playground](https://esheenj.github.io/design-system-foundations-oss/)** — [GitHub Pages deployment](https://github.com/esheenj/design-system-foundations-oss/actions/runs/42483171101) succeeded on **9 November 2026**. The seven-project collection separately passed a bounded independent public HTTPS Chrome check on 11 November 2026 ([acceptance evidence](https://github.com/esheenj/compound-intelligence-starter/actions/runs/43064815195)); physical-device and assistive-technology acceptance are not claimed.

[![Tests](https://github.com/esheenj/design-system-foundations-oss/actions/workflows/test.yml/badge.svg)](https://github.com/esheenj/design-system-foundations-oss/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20%2B-339933?logo=node.js&logoColor=white)](package.json)

**An offline-first design-token compiler and contrast demonstration from [Esheen Labs](https://github.com/esheenj).** A small, dependency-free JavaScript reference implementation for people building consistent, accessible-minded user interfaces.

> **Project status:** educational open-source reference, not a full design-system product, accessibility audit, or certification.

## Interactive token playground

The original `index.html` now lets you change fictional brand/text/surface colors and spacing, inspect CSS emitted by the **real** `compileTheme` library, see alias propagation and a numeric contrast ratio, and download the compiled CSS locally. No app install, account, telemetry, remote API or injected HTML is used.

```sh
npm test
npm run demo
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000` on the same machine. To inspect the exact public artifact, run `node scripts/stage_pages.mjs dist/pages`; GitHub Actions checks its allowlisted files and the staged interactive UI in real Chrome. **A passing local test does not establish a live GitHub Pages site**: follow [enablement and HTTPS acceptance](docs/PAGES_RELEASE.md) before sharing a hosted URL.

Find a small [developer contribution task](docs/GOOD_FIRST_ISSUES.md) or follow the [contribution guide](CONTRIBUTING.md). Contrast alone is not WCAG compliance or accessibility certification.

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
| `MAX_GROUP_DEPTH` | Maximum nesting depth threshold (`10`) for token groups. |

**Supported compiled values:** six-digit hex colors, nonnegative integers, and nonnegative numeric values with `px`, `rem`, `em`, or `%` units. Other CSS values are intentionally outside the current allowlist.

Token groups must be plain objects or objects with a null prototype. Unsupported object instances (such as Date, Map, Set, typed arrays or custom classes) throw `TokenError` with the group path rather than disappearing from output. Aliases resolve only explicitly supplied token paths; inherited object properties are never token definitions.

Token groups are bounded to a maximum nesting depth of 10 (`MAX_GROUP_DEPTH`). Cyclic object structures along an active traversal path are rejected with `TokenError` rather than recursing indefinitely. Legitimate reused (non-cyclic) group objects across different branches remain supported.

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

## Test portability and CI

The CLI test helper passes a file URL directly as its working directory, preserving platform-specific paths and decoding spaces/Unicode correctly. A regression runs the CLI suite from a copied checkout with spaces and Unicode in its path.

Linux CI uses a disposable GitHub-hosted runner. After trusted setup, tests run as the unprivileged runner user with a clean environment, no new privileges, zero effective capabilities and a separate network namespace. The job verifies these properties before running the source. There are no private runners, production mounts, persisted checkout credentials or deployment steps. This is a bounded test arrangement, not a claim of universal sandbox security. Windows execution remains separately unverified until a Windows run is recorded.

## Compare two themes (MVP iteration)

When updating a UI theme, see **which resolved tokens actually change**, including aliases that change indirectly. This offline tool uses the same validation rules as the compiler, without installing packages, accessing a service or writing output files:

```sh
node bin/compare.mjs examples/theme.json examples/theme-next.json
```

The deterministic JSON report identifies **added, changed, removed, and unchanged** tokens. The fictional example changes the brand color, its action alias and medium spacing, and adds a large spacing token. An invalid alias, malformed file or unsupported CSS value fails explicitly rather than producing a partial report. Local file inputs are limited to regular JSON files at most 64 KiB.

Programmatic use is also supported:

```js
import { compareThemes } from "./src/compare.mjs";
const delta = compareThemes({ color: { brand: "#2563eb" } }, { color: { brand: "#15803d" } });
console.log(delta.summary.changed); // 1
```

See [MVP tracking](https://github.com/esheenj/design-system-foundations-oss/issues/14) for continuing keyboard/browser, documentation and distribution verification. A value comparison does not verify visual accessibility or WCAG compliance.

## Additional offline Control Audit Playground

The original [Control Audit Playground](https://esheenj.github.io/design-system-foundations-oss/audit.html) demonstrates **three metadata-only heuristics** on invented controls: missing accessible names, example low text contrast and small touch targets. It uses `src/audit-controls.mjs` and the existing `contrastRatio` utility, a static ES-module browser adapter and immutable findings. It does **not** inspect a real DOM, verify assistive technology or certify WCAG conformance.

Run `node --test tests/audit-controls.test.mjs` (invalid-input and numerical examples) or full `npm test`; exact staged browser and Pages deployment are separate evidence gates. No third-party runtime code, accounts, uploads or telemetry. It is one additional hosted tool in this repo, not a new independent repository.
