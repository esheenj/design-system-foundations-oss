# Publish the Design System token playground browser MVP

**Status: public source and tested static-demo pipeline; a live GitHub Pages URL is not confirmed.** Do not advertise a guessed `github.io` address.

## Run the exact public artifact locally

```sh
npm test
node scripts/stage_pages.mjs dist/pages
python3 -m pip install -r tests/browser-requirements.txt
TOKEN_DEMO_ROOT=dist/pages python3 tests/browser_playground.py
```

The last test uses installed Chrome/Chromium with the pinned **test-only** Playwright package. No packages are required to use the browser demo itself. The stage script copies only `index.html`, the two necessary original ESM modules and `.nojekyll`; it refuses preexisting destinations, symlinked source paths and unrelated files. The GitHub `Offline checks` workflow executes Node 20/22/24 tests in isolation and real Chrome against that staged artifact.

## One-time GitHub Pages administrator action

For `esheenj/design-system-foundations-oss`, open **Settings → Pages → Build and deployment → Source → GitHub Actions**. GitHub's ordinary workflow token does not have authority to enable Pages by itself.

The `Publish CI-verified ...` workflow triggers only after a successful `Offline checks` run on a **main push**, checks that the exact commit is still the current main revision, verifies the Pages site is configured for Actions, and publishes just the reviewed static bundle via first-party GitHub Pages actions. Pull requests never publish, no long-lived admin token is introduced and no recurring paid hosting is required.

If the deployment reports Pages not enabled, enable it in GitHub Settings, then submit a subsequent tested main commit. **Do not rerun old CI and claim it represents a new source commit.**

## Acceptance before listing a live demo

Inspect the actual successful deployment job and its `page_url`. Open that HTTPS URL in a browser and verify:
- Validated brand/text/surface token compilation and alias resolution
- Fictional CSS download and reset
- Numeric contrast ratio demonstration, not WCAG certification
- No unexpected external requests or JavaScript errors.
- The deployed source corresponds to the successful CI commit.
- List only verified URLs in the public README and central OSS directory.

A successful source test does not prove Pages deployment, full accessibility, screen-reader behavior, physical-device compatibility, third-party adoption or production readiness. Roll back by reverting source and redeploying its newly CI-verified head; an authorized admin can disable Pages if needed.

R0 additional recurring infrastructure spend. Never include private source, credentials, employer work or trading/payment capability.
