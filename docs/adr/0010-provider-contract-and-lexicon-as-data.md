# ADR-0010: Providers Are Pure Functions Over Lexicon Data, Tested by Reset Equality

**Status:** Active
**Date:** 2026-10-14
**Affected:** spec/providers/, spec/app.md (E-02, E-07, F-04), AGENTS.md
**Origin:** Alex, chat 2026-10-14 ("let's do it" on the English provider spec)
**Review:** All provider rules are PROVISIONAL until Alex marks them
**Revert:** Supersede with an ADR that changes the contract or the lexicon format

## Context

Standard tiers (lines, stanzas, words, syllables, stress) are filled by providers (app.md E-02). We need a contract that
a user or an extension can meet too, a way to test it in any language, and a decision about where word data comes from,
given that the candidate dictionaries have different licences (ReadLex MIT, CMUdict BSD 2-clause, Wiktionary-derived data CC BY-SA).

## Decision

1. A provider is a **pure function** of the text, the tiers it reads and a lexicon. It owns sets named by `key`.
2. The **lexicon is data** in a small tab-separated format that carries syllable letters, IPA and stress. The spec and fixtures never depend on a particular dictionary.
3. **Conformance is reset equality**: a fixture is an ordinary document with provider tiers already filled in plus an `<x-lexicon>` block; an implementation recomputes each keyed set and must match by member positions. Ids and names are opaque.
4. **Don't guess**: missing data produces visible gap sets (`unknown`, `check`, `unmarked`), never a silent invented answer.
5. English providers are specified in `spec/providers/english.md`, the contract in `spec/providers/contract.md`. A sound tier is deferred until a grapheme-aligned lexicon exists.

## Consequences

* Tests are small, hand-written and licence-free. Packaging a real lexicon is separate offline work (a builder that adds syllable alignment to CMUdict).
* Share-alike data (Wiktionary-derived) would carry its licence into whatever it is merged into, so it stays a separate, optional data file. ReadLex and CMUdict are permissive.
* A hand-edited tier can feed a later provider (`x-as`), so people's corrections are respected.
* The provider id form is still open (format.md FQ8).

## Addendum (2026-10-24)

Alex adopted every rule marked PROVISIONAL in the spec files (`docs/reviews/2026-10-24.md`, part 3). The
statements about PROVISIONAL rules above describe the state when this ADR was written.
