# Demo

A marked poem and a recording of the app, for showing the project.

| File | What |
|---|---|
| `sonnet18.pxml` | Shakespeare's Sonnet 18 (1609, public domain), marked: lines, stanzas, words (hidden), rhyme scheme, stress, end rhyme; two themes. Made by `build.mjs`; `tests/demo.mjs` checks the two agree |
| `build.mjs` | Builds `sonnet18.pxml` through the `Editor`, the way a person would in the app. `npm run demo:build` |
| `record.mjs` | Records a walkthrough as `.tmp/demo/demo.mp4` and `demo.gif`. `npm run demo:record` (needs Playwright's Chromium and `ffmpeg`) |

**The scansion is an example, not a scholarly reading.** An agent marked syllables and stress for lines 1 to
4 and 13 and 14 only (line 3 starts with a stressed pair, an inversion; "temperate" ends with a secondary
stress). Check it before presenting it as analysis (board: DEMO-3).

VHS records terminals, so it cannot drive a browser app. The recorder drives the page with Playwright, draws a
cursor dot, and lets `ffmpeg` make an MP4 (small, plays inline in Discord) and a GIF (about 5 MB).

The recording is not committed (`.tmp/` is ignored). Do not put a poem that is still in copyright in this
folder (AGENTS.md): use `.wip/` for those.
