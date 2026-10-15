# Roadmap

> Status board for poetic-parser: what is in progress, what is queued, and what is done.

## 🟢 Now (In Progress)

* **Application spec (`spec/app.md`, ADR-0007):** first draft written from Alex's scope answers; awaiting his review. Earlier: the pivot (ADR-0003 to ADR-0006) and `docs/synthesis/comparison.md`.

## 🟡 Next (Queued)

* **Review `spec/app.md`:** Alex marks up the PROVISIONAL rules and answers the OPEN questions (section 13).
* **Text form (`spec/format.md`):** first shape drafted (blocks, one marked copy of the text per tier); awaiting Alex's reaction. Then a formal grammar and conformance fixtures (spec Q9, ADR-0008).
* **Provider spec for English:** word, syllable and sound tiers, in `spec/providers/` (ADR-0007).
* **JSON fixtures** for providers, reset and editing (`spec/fixtures/`).
* **Community scheme as data:** encode the built-in scheme, settling the deck's hex inconsistencies (ADR-0005).
* **English baseline POC:** client-side JavaScript (ADR-0006).
* **Origin and credit:** add a timestamp for the Tengwar-mode remark in the README; ask the scheme's author how to be credited once there is something to share.

## ⚪ Later

* **Tengwar view:** per-glyph and per-mark styling through shavian2tengwar; test mark placement first.
* **Stack beyond the POC, hosting and name:** see `docs/synthesis/stack-and-name-options.md`.

## 🔴 Done (Completed)

* **Scansion score:** `scansion.html`, the Shavian-only prototype (first preset).
