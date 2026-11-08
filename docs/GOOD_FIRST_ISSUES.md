# Contribute to Design System token playground

Choose one small, observable improvement, using fabricated examples and original source only. Verify existing issues before creating a duplicate.

1. **Defensive model regression:** add a case for malformed/coerced or boundary input to the relevant `tests/*.test.mjs`, then prove the caller's original state/tokens are unchanged after rejection.
2. **Browser keyboard/zoom behavior:** extend `tests/browser_playground.py` with an actual focus, label or narrow-viewport case. Describe the browser version and exactly what accessibility claims remain untested.
3. **Public Pages artifact review:** add a targeted failing case to `tests/pages-stage.test.mjs` for unexpected source or a symlink and demonstrate that staging refuses the output without overwriting user files.

Run `npm test` and `npm run demo`. For browser modifications, build a fresh staging directory and run the pinned test-only real Chrome checks. A PR must include a concise reproduction, expected and actual outcome, a regression and limits of verification. [CONTRIBUTING.md](../CONTRIBUTING.md) applies.

Only fictional data; never customer/employer source, private AI material, credentials, analytics endpoints, unlicensed assets or live trading logic. No unsupported site, security or WCAG claims.
