# ADR-0016: Browser Tests May Use Playwright as a Dev-Only Dependency

**Status:** Active
**Date:** 2026-10-24
**Affected:** package.json, tests/, AGENTS.md; refines ADR-0012
**Origin:** Alex, chat 2026-10-24 (DEC-7, "agreed" to the recommendation)
**Review:** Decided by Alex in chat. Nothing is installed yet; QA-1 does that
**Revert:** Remove the dev dependency and its tests; the runtime is unaffected

## Context

ADR-0012 says the core has no dependencies and no build step. The painter and the app are checked only by ad
hoc headless-browser scripts that are not part of `npm test`. They need a real browser.

## Decision

1. Browser tests may use **Playwright**, listed under `devDependencies` only.
2. The runtime stays as ADR-0012 sets it out: `src/core/`, `src/render/`, `src/providers/` and `app/` have no
   dependencies and no build step.
3. How the browser tests join `npm test` (one script or a separate one) is settled in QA-1.

## Consequences

* `package.json` gains `devDependencies` when QA-1 is done. Until then it is unchanged.
* AGENTS.md says "no runtime dependencies" instead of "no dependencies".
* Anyone running the tests needs the browser that Playwright installs.
