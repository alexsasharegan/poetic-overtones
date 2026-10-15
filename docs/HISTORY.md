# History

How poetic-parser got where it is, in phases. For the task board see `docs/ROADMAP.md`; for decisions,
`docs/adr/`; for the detailed log of the foundation work, `docs/projects/0001-foundation/LOG.md`.
Dates are Alex's local time (America/Phoenix).

## 1. A Shavian scansion page (before 2026-10-14)

The project began with a podcast discussion of the Lay of Nimrodel (README, "Origin") and a wish for a
Tengwar mode that helps with poetic analysis. The sibling repo `shavian2tengwar` turns Shavian into Tengwar.

* `syllabifier.py`, `design-doc.md`, `decisions.md`, `diagram.md`, `out.json`: a first attempt that inferred
  stress from vowel weight. It was wrong in known ways (README, "Earlier prototype").
* `scansion.html`: a single page that draws a Shavian poem, marked by hand (`*` stress, `.` split, `-`
  compound, `·` namer dot), as a score with rhymes, assonance and alliteration arcs. ADR-0001 (human-marked
  stress) and ADR-0002 (community sources private) date from here.

## 2. The pivot to a generic tool (2026-10-14, evening)

Alex widened the project to a web app for multi-dimensional poetic analysis of any Unicode text.

* ADR-0003: a generic multi-tier annotation tool. ADR-0004: tools may infer, people confirm.
  ADR-0005: the community scheme *Phonetic Markup for Verse* v3.0 is a first-class built-in, credited to its
  author (wording to be agreed), with the PDF kept private. ADR-0006: the POC is client-side JavaScript with
  English as the baseline. ADR-0007: spec first; "tier" is the word. ADR-0008: offline first, a text form,
  artifacts, extensions.
* `docs/synthesis/comparison.md` compared the deck with the Tengwar grid; `stack-and-name-options.md` listed
  stacks and names.
* `spec/app.md`: the application spec.

## 3. The text form (2026-10-14, night)

* A first draft (one marked copy of the text per tier) gave way, after a mock-up stage, to **`.pxml`**:
  XML-based blocks in the manner of a Vue single-file component (`meta`, `text`, `markup`, `analysis`,
  `style`), with the input text kept apart from the marked copy.
* The model settled as **tier → set → span**: a span is a stretch of text with an id, possibly in pieces
  (head and continuations, for crossing and discontinuous spans); a set lists spans; a tier orders sets.
* Alex's invariants: no CDATA; only the five XML entities; ids unique across the file and opaque; every span
  has an id; members listed one by one; plain CSS; relative-only `src` paths.
* `spec/fixtures/`: small files that pin each rule, with `check.py` as the reference checker. ADR-0009.
* FQ1 to FQ6 settled: `.pxml` and `<pxml>`; `markup`; `disabled="true"` for saved view state; no stored
  orphans; `<style src>`; dedent `src` text. The set `key` was added for providers.

## 4. Providers, then a step back (2026-10-14, late night)

* `spec/providers/`: a provider contract (pure function over text, tiers read and a lexicon; tested by
  "reset equality"), English rules for line, stanza, word, syllable and stress, a Python reference and a
  runner. ADR-0010.
* ReadLex (MIT) and shaw-spell were examined as lexicon sources: no syllable boundaries or letter
  alignment in either.
* Alex judged lexicons premature for the MVP: syllables and stress are marked by hand. Lexicon work was
  parked as post-MVP extension work.

## 5. Themes and rendering (2026-10-14 to 15, overnight)

* "Stamping" (attributes on rendered spans) was replaced by Alex's framing: **themes style the analysis,
  not the text**. Tiers get one `role`; tier order in the file is **layer order**, later on top; "scheme"
  became **theme**, a theme's rules for a role a **part**. ADR-0011.
* `prototypes/layers/`: v1 painted with the CSS Custom Highlight API, which cannot do bold, borders or
  added characters. Alex asked for full CSS that prints, so v2 paints **text styles** (on the text cut at
  span boundaries) and **box styles** (as invisible copies of the text with inline boxes). Checked on screen
  and in PDF in Chromium, Safari and Firefox; a first box painter that measured the screen printed wrongly in
  Safari and was replaced.
* Adopted: two families of channels, size clamp 0.75 to 1.5, boxes under the letters, contained theme CSS,
  rules reaching down tier → set → member, and a mirrored `member` with `inferred` (FQ7 settled).

## 6. Code (2026-10-14 to 15, overnight)

* `src/core/`: a dependency-free XML parser, a loader ported rule for rule from `check.py`, the model, a
  canonical exporter and an `Editor` with undo and redo. ADR-0012. A DOCTYPE is now rejected (fixture e30).
* `src/render/paint.js`: the v2 painters as a module.
* `app/`: open, render, restack and toggle tiers, switch themes, add and edit tiers and sets, mark selected
  text, confirm inferred members, undo, save (`docs/ui-plan.md` steps 1 to 3).
* `themes/community.css`: the community scheme as a theme; seven colours settled where the deck's labels
  contradict its swatches (`themes/README.md`).
* Review note with a decision ledger: `docs/reviews/2026-10-15.md`. The roadmap became a board of epics.
