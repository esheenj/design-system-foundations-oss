# AGENTS.md — Contributor instructions for coding agents

This is a **public, standalone, educational design-token utility**. It is not a production application, compliance certification, or gateway to any private Esheen Labs systems.

## Goal

Improve reliability and comprehensibility of the offline token compiler while keeping its small, auditable API.

## Source map

| File | Meaning |
| --- | --- |
| `src/tokens.mjs` | Token validation, nested-token flattening, alias resolution, CSS output and numeric contrast ratio |
| `examples/sample.mjs` | Synthetic demonstration token inputs |
| `examples/demo.mjs` | Local sample run |
| `tests/tokens.test.mjs` | Node built-in tests for resolution, validation and contrast |
| `README.md` | Public API and limitations |
| `CONTRIBUTING.md` | Human contributor workflow |

## Required local checks

```bash
npm test
npm run demo
```

Use Node.js 20+. There is no required install step or runtime third-party dependency.

## Rules for changes

1. Preserve offline operation and deterministic outputs unless a reviewed requirement explicitly changes that scope.
2. Expand tests for every new accepted CSS token format or alias behavior.
3. Treat untrusted token values defensively; do not weaken validation to allow arbitrary CSS injection.
4. Respect the current limits: six-digit hex colors, numeric values in the documented units, and nested objects with valid names.
5. Do not claim that a contrast ratio alone proves WCAG conformance or that this package is a complete design system.
6. Use synthetic examples only; do not copy private implementation, data, credentials, or private repo history into this public project.
7. Do not add paid services, telemetry, network dependencies, or unsafe CI permissions as incidental changes.
8. Prefer focused pull requests with a clear problem statement, test evidence, and limitations.

## Useful prompts for AI contributors

- Add an explicit regression test for a current validation edge case and explain the expected behavior.
- Clarify an error message without changing supported input syntax.
- Improve a beginner example while keeping it runnable offline.
- Review existing tests against the public README and identify inaccurate claims.

Review AI-generated changes before submitting them. A tool or model's claim that a check passed is not evidence until the check is actually run.
