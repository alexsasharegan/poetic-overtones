# ADR-0009: Text Form: Tiers Hold Sets of Spans, in XML-Based Blocks

**Status:** Active
**Date:** 2026-10-14
**Affected:** spec/format.md, spec/app.md (sections 1, 4, 5, 7, 8), spec/fixtures/, AGENTS.md; refines ADR-0007 and ADR-0008
**Origin:** Alex, chat 2026-10-14
**Review:** The decisions listed as Alex's are final; the rest are PROVISIONAL in `spec/format.md`
**Revert:** Supersede with an ADR that picks another syntax or another model

## Context

ADR-0008 asked for a plain-text form as the share layer. The first draft (tilde-fenced blocks with one marked
copy of the text per tier) was replaced after a mock-up round using *Twinkle, Twinkle, Little Star*. Alex
wanted bare markup in the text, and the meaning in a separate mapping layer; the file shape of a Vue
single-file component; standard XML parsing; and plain CSS. Writing fixtures for the hard cases (crossing
spans, discontinuous spans, enjambment, providers, relations, Unicode) tested the model before the grammar was
written.

## Decision

Alex's decisions:

- The text form is **XML-based** (XML 1.0, not HTML5), with JSX-style self-closing tags. The extension is
  `.pxml`. Blocks are siblings, as in a Vue component.
- **No CDATA anywhere.** It is a format invariant (AGENTS.md).
- The marked-up text has bare `<span>`s. Meaning is in a separate analysis block.
- Terms: a **tier** (dimension) holds **sets**; a set lists **spans**. This replaces "one tier is one relation"
  and the earlier kinds segmentation, label and relation.
- **Ids are unique across the whole file and opaque**; names are free text. The format derives nothing from a
  name. The earlier "channel" and slug rules are dropped.
- Every span has an id. A span in several pieces is a head plus continuations (`cont`), not a repeated id.
- Members are listed one by one: no ranges.
- Styles are **plain CSS**. There is no styling language of our own. Sets keep a position that styles can see.
- Text and markup are sliced and dedented. File references use `<text src="..."/>`, relative paths only.
- Fixtures are part of the spec.

The agent's defaults (PROVISIONAL): the attribute names and values (`kind`, `directed`, `provider`, `reads`,
`confirmed`, `tags`, `cont`), the order rule for undirected and directed sets, the stamping contract for CSS,
and the warnings.

## Consequences

- `spec/app.md` sections 1, 4, 5, 7 and 8 describe tiers and sets, not tokens and label sets. Segmentation as a
  separate kind is gone: "Lines" is a label tier with one set.
- Schemes are CSS. The community scheme becomes a style sheet that selects on tags (ADR-0005).
- A conforming loader passes `python3 -I spec/fixtures/check.py`'s cases. A JavaScript loader must count
  code points, not UTF-16 units (fixture 11).
- ADR-0007 said conformance would use JSON fixtures; the text-form fixtures are `.pxml` files.
- Open: where the view and active scheme live, how orphans are written, and the exact stamping contract
  (`spec/format.md` section 8).

## Addendum (2026-10-14, later)

Alex settled the questions the first draft left open:

- `.pxml`, the root `<pxml>` and the block name `markup` are final.
- The view is saved as `disabled="true"` on tiers and on style blocks; the active scheme is the style block
  that is not disabled.
- `<style src="..."/>` exists, under the same rule as `<text src>`.
- Text read from a file is sliced and dedented like an inline block, so the markup can always match it. This
  gives up a shared indent on a text whose every line is indented.
- Orphans are not stored. Spans belong to no tier; a reset replaces what the sets of a provider tier list;
  providers reuse spans with the same pieces; spans that no set lists are dropped on export.

## Addendum (2026-10-24)

Alex adopted every rule marked PROVISIONAL in the spec files (`docs/reviews/2026-10-24.md`, part 3). The
statements about PROVISIONAL rules above describe the state when this ADR was written.
