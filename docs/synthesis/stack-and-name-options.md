# Stack and name options

> A menu, not a decision. ADR-0006 defers all of this; the POC is client-side JavaScript only.
> Written 2026-10-14. Names are not checked for collisions.

## What constrains the choice

- Alex knows JavaScript and Go, and has heard good things about Rust.
- No hosted compute on Alex's server. Compute should run on the user's machine or someone else's.
- A locked-down localhost app or a distributable binary is fine. Electron may be more than is needed.
- Dictionary-style services pull towards Python, but Python code on a public server is the worry.

## Architecture options

| Option | What it is | Fits | Costs |
|---|---|---|---|
| A. Static client-side web app | JavaScript or TypeScript, on third-party static hosting (GitHub Pages, Cloudflare Pages, Netlify). Dictionaries are static files fetched on demand. Work is saved in the browser and exported as a file | The POC. No server compute for Alex | Data size in the browser; no large models; no shared storage |
| B. Static app plus a WASM core | The analysis library written in Rust or Go, compiled to WebAssembly, still on static hosting | Speed or reuse of one core across web and local | A second toolchain. Go's WASM builds are large unless built with TinyGo |
| C. Local binary | A single Go (or Rust) program serving the app and any local services on localhost, shipped through GitHub Releases | Heavy or private services, no hosting | Users download and run a binary |
| D. Desktop shell | The same app in a system webview with Tauri (Rust) or Wails (Go), or in Electron | A double-click app | Electron bundles a whole browser; Tauri and Wails are lighter but add a toolchain |
| E. Python helper | A local sidecar for NLP, or Python in the browser through Pyodide | Existing NLP libraries | A sidecar needs installing; Pyodide is a multi-megabyte download |
| F. Hosted service | A server that does the work | Collaboration, sharing | Everything Alex wants to avoid; only with hard limits, auth and rate limiting |

**Suggested path, if it helps:** start with A, and write the analysis library with no dependency on the
page, with language-neutral file formats (JSON). Then B, C, D or E stay open without a rewrite.

## Unicode, by option

- **JavaScript** has `Intl.Segmenter` for graphemes, words and sentences in current browsers and Node. The
  POC needs no extra library for tokenisation.
- **Rust** has the `unicode-segmentation` crate (UAX #29) and the ICU4X project.
- **Go** handles UTF-8 and runes well, but its standard library does not segment grapheme clusters. People use
  a third-party package such as `uniseg`.
- **Tengwar caveat (expected, not tested):** Tengwar in the Private Use Area has no combining properties, so a
  standard grapheme segmenter should split a base from its mark. The Tengwar view must tokenise from
  shavian2tengwar's `Cell(base, marks)`, not from Unicode graphemes. English and Shavian text do not have
  this problem, which is one reason to start with English.

## English baseline: data

| Source | What it gives | Notes |
|---|---|---|
| CMU Pronouncing Dictionary | Phonemes (ARPAbet) per word, with stress digits 0, 1 and 2 | Digits give none, primary and secondary stress, which matches the community scheme's three levels and feeds ADR-0004. Stress is per word, not per context. Check the licence |
| ReadLex (Shavian) | About 111,000 words with Shavian spellings | Gets English to sounds through Shavian. Check the licence |

Neither gives which letters make which sound. That alignment is the hard part of English and has to be
hand-marked, inferred, or both (ADR-0004).

## Name options

The repo is `poetic-parser` for now. Ideas, none checked for existing projects or packages:

| Name | Why |
|---|---|
| Underlay | Layers under or over one text; in music, "underlay" is the words set under the notes |
| Strata | Layers |
| Palimpsest | One text with layers written over it (a well-worn word) |
| Scansion Studio | Plain and descriptive |
| Cadence | Poetry and rhythm (a common name) |
| Resound | Echoes, assonance, alliteration |
| Loom | Weaving layers together |
| Lay | A nod to the Lay of Nimrodel and to layers |
| poetic-parser | Keep the current name |
