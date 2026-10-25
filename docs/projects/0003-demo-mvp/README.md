# 0003: Demo MVP

**Status:** done (2026-10-25), pending Alex's review. **Owner:** Alex. **Worked on by:** Claude, unattended overnight.
**Branch:** `demo-mvp`. The repository has no remote, so there is no PR yet; `.wip/pr-demo-mvp.md` holds the text for one.

Get to something that can be shown around the next class (likely Tuesday 2026-10-27) and shared on a
community Discord as a GIF or video: a poem marked well enough to look like the pitch, marking that is practical on
real text, and a recording of it.

## Scope

* Spec first: W-05, W-06, Y-13, O-05, A-06 in `spec/app.md`, all PROVISIONAL.
* Core: `Editor.addTheme`. Theme: `themes/plain.css`, a credit line convention.
* App: snap to words, pieces, click-to-find, working copy, drag and drop, print view, add-theme menu, directed
  reorder.
* Demo: `demo/build.mjs`, `demo/sonnet18.pxml`, `demo/record.mjs`.
* Tests: `tests/themes.mjs`, `tests/select.mjs`, `tests/demo.mjs` in `npm test`; `tests/browser.mjs` as
  `npm run test:browser`.
* ADR-0018 (working copy in local storage); addendum to ADR-0016.

## Definition of Done

* `npm test` and `npm run test:browser` pass.
* The recording exists and its frames were looked at.
* What was not verified is written down (`LOG.md`).
