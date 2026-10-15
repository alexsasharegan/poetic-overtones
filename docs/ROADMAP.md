# Roadmap

> Status board for poetic-parser: what is in progress, what is queued, and what is done.

## 🟢 Now (In Progress)

* **Core library (`src/core/`, ADR-0012):** loader, model and canonical export in plain ES modules; passes all 53 fixtures and 23 round trips. Editing operations with undo and redo are in `edit.js` (`tests/editor.mjs`).
* **App (`app/`, `docs/ui-plan.md`):** steps 1 and 2 done: open, render with `src/render/paint.js`, restack and toggle tiers, switch themes, add tiers and sets, mark selected text, undo, save. Step 3 (tier and set details, one-click confirm) done too. Next: step 4, selection helpers.

## 🟡 Next (Queued)

* **Community theme, follow-ups:** `themes/community.css` encodes the deck (consonant borders and colours, vowel and diphthong highlights, stress). Still to do: confirm the settled colours and credit wording with the author; meter strip, ties and grouped views (need marks and views).
* **Review the remaining PROVISIONAL rules** in `spec/app.md` and `spec/format.md`; FQ8 and FQ9 stay open and do not block the MVP.
* **Origin and credit:** add a timestamp for the Tengwar-mode remark in the README; ask the scheme's author how to be credited once there is something to share.

## ⚪ Later

* **Lexicon-based providers (extension territory, not MVP):** the English word, syllable and stress providers are specified (`spec/providers/`, ADR-0010) and stay parked. Still to do when wanted: a lexicon builder (ReadLex is MIT, syllabify its IPA; letter alignment unsolved), and an English sound tier. The MVP needs no lexicon: syllables and stress are marked by hand (ADR-0004), and line, stanza and word need no dictionary.

* **Tengwar view:** per-glyph and per-mark styling through shavian2tengwar; test mark placement first.
* **Stack beyond the POC, hosting and name:** see `docs/synthesis/stack-and-name-options.md`.

## 🔴 Done (Completed)

* **Text form and rendering decisions:** `spec/format.md` with 53 fixtures; themes style the analysis, roles, layer order, the member mirror and the two families of channels (ADR-0009, ADR-0011). FQ1 to FQ7 settled.

* **Layering prototype:** `prototypes/layers/index.html` paints a theme from the analysis mirror onto the text, one layer per tier in file order (ADR-0011). v1 used CSS highlights; v2 uses two plain-CSS painters (text styles and box styles).

* **Scansion score:** `scansion.html`, the Shavian-only prototype (first preset).
