# Execution Log: Demo MVP

## 2026-10-25: From the decision round to a demo

### Context & Decisions

- Alex wants a demo around the next class (likely Tuesday 2026-10-27), shared on a community Discord as a
  GIF or video, and asked for a branch with a PR after the key tasks. The repository has no remote, so Alex chose
  "B": work on a local branch, no PR yet. Text for one is in `.wip/pr-demo-mvp.md` (untracked).
- Tasks chosen as the shortest path: UI-4 with CORE-1 and RND-1, CORE-5, the print and drag-and-drop part of
  UI-7, UI-5 (reordering), CT-5, QA-1, plus a demo document and a recorder. Marks, the lexicon, the theme editor
  and views were left out (ADR-0017, board).
- Spec first (ADR-0007): W-05, W-06, Y-13, O-05, A-06 added as PROVISIONAL before the code. W-06 first said
  "marking works from the keyboard"; that overreached (no keyboard-only selection), so it was corrected to say
  that M and P work once text is selected.
- ADR-0018 records the storage choice (local storage, one slot) that the board asked for.
- Demo poem: Sonnet 18, public domain. An agent scanned lines 1 to 4 and 13 and 14. It is an example, not a
  reading, and is flagged as such in `demo/README.md`, `demo/build.mjs` and the board (DEMO-3).
- The recorder uses Playwright because VHS records terminals and cannot drive a browser. A cursor dot is
  drawn into the page, since a page video has no pointer.
- A theme's credit is a `Credit-line:` line in its header comment, read by the app for the credit under the
  poem and in the print view. This is a convention I chose (themes/README.md).
- A span with several pieces is shown as `Up … world` in the panel (`spanText` joins them with nothing).

### Commands & Operations Executed

```bash
git checkout -b demo-mvp
npm install --save-dev playwright && npx playwright install chromium    # 99 MiB download
node tests/themes.mjs; node tests/select.mjs; node demo/build.mjs; node tests/demo.mjs
npm run test:browser          # 16 checks; failed first on my own test server and a missing blur, fixed
npm test                      # exit 0
npm run demo:record           # 34 s video; demo.mp4 0.8 MB, demo.gif 5.2 MB in .tmp/demo/
```

Bugs found by the browser tests while building: `row.elements` on a `div` (the app did not load at all);
the test server wrote headers before reading a file and did not serve `/app/`; key presses went to a focused
checkbox, which the tests now blur the way a mouse selection would.

Commits on `demo-mvp`: built-in themes and plain theme (with the spec rules); the app features; the demo and
browser tests; then these docs, the recorder and the shared test server. Three early commits missed the
`Co-Authored-By` trailer and were amended with it.

### Not verified

- **The GIF in motion.** I looked at single frames cut from the MP4 (sonnet, alliteration marking, community
  demo). I did not play the GIF, so pacing is a guess.
- **Browsers other than Chromium** for the new UI. The painter was checked in Safari and Firefox earlier (RND-0);
  the new app code was not.
- **Printing and PDF.** The test checks that the print media hides the panel; nobody has looked at a print
  preview or a PDF of the new view.
- **The scansion** of Sonnet 18 (DEMO-3). The Plain theme's bold for stress and the rhyme colours were judged by
  eye from screenshots only.
- Touch, a screen reader, a very long text, and two tabs sharing the one working-copy slot.
- The recorder on a machine without `ffmpeg` or Playwright's browser: it fails at the first missing piece.

### LLM Session Summary

- **Thread purpose:** take the app from the decision round to a demo that can be shown and recorded.
- **Key findings / Blockers resolved:** Playwright installed and ran here, so recording works. The shell safety
  check did not fail during this session.
- **Context state for next thread:** branch `demo-mvp`, 5 commits ahead of `main`. Alex
  to do DEMO-3, DEMO-4, review the PROVISIONAL rules, and add a remote so a PR can be opened. Then CT-6, the rest
  of UI-7 and DOC-1.
