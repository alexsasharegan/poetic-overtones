# Roadmap

> Status board for poetic-parser: what is in progress, what is queued, and what is done.

## 🟢 Now (In Progress)

* **Text form (`spec/format.md`, ADR-0009):** rewritten around 47 fixtures (`spec/fixtures/`, checker `check.py`); `spec/app.md` reconciled to tiers, sets and spans. Questions FQ1 to FQ6 settled; awaiting Alex's review of the PROVISIONAL rules and FQ7 to FQ9.

## 🟡 Next (Queued)

* **Review `spec/app.md` and `spec/format.md`:** Alex marks up the PROVISIONAL rules and answers the OPEN questions.
* **Fixtures** for providers, reset, editing and round trips (`spec/fixtures/`; the text form already has 47).
* **Community scheme as data:** encode the built-in scheme as a CSS style sheet over tags, settling the deck's hex inconsistencies (ADR-0005).
* **English baseline POC:** client-side JavaScript (ADR-0006).
* **Origin and credit:** add a timestamp for the Tengwar-mode remark in the README; ask the scheme's author how to be credited once there is something to share.

## ⚪ Later

* **Lexicon-based providers (extension territory, not MVP):** the English word, syllable and stress providers are specified (`spec/providers/`, ADR-0010) and stay parked. Still to do when wanted: a lexicon builder (ReadLex is MIT, syllabify its IPA; letter alignment unsolved), and an English sound tier. The MVP needs no lexicon: syllables and stress are marked by hand (ADR-0004), and line, stanza and word need no dictionary.

* **Tengwar view:** per-glyph and per-mark styling through shavian2tengwar; test mark placement first.
* **Stack beyond the POC, hosting and name:** see `docs/synthesis/stack-and-name-options.md`.

## 🔴 Done (Completed)

* **Scansion score:** `scansion.html`, the Shavian-only prototype (first preset).
