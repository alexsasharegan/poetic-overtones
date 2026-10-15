# ADR-0011: Themes Style the Analysis; Tiers Have a Role; Tier Order Is Layer Order

**Status:** Active
**Date:** 2026-10-14
**Affected:** spec/format.md (A-01, A-02, A-13, S-03 to S-07, FQ7), spec/app.md (vocabulary, section 8, Y-10, Y-11), spec/fixtures/ (01, 14, 16, 17, 20, e29, w02), spec/providers/ (C-09, roles in fixtures); refines ADR-0009
**Origin:** Alex, chat 2026-10-14
**Review:** The four decisions below are Alex's; details marked PROVISIONAL in the spec are not
**Revert:** Supersede with an ADR that styles the text directly or drops roles

## Context

ADR-0009 left the "stamping contract" open: which attributes the renderer would put on each span so CSS
could select it. Working it through showed three problems. Selecting by id ties a style sheet to one file,
so it is not a theme. Spans cross and come in pieces, so page elements cannot represent them one-to-one.
And nothing said how overlapping tiers stack (lines should sit under rhymes).

## Decision

1. **Themes style the analysis, not the text.** The renderer keeps a hidden mirror of the analysis
   (`tier` elements holding `set` elements, in order). Style blocks apply to the mirror; the renderer reads
   each set's computed style and paints it onto the set's spans. "Stamp" is no longer a term.
2. **A tier has one `role`** (`line`, `rhyme`, `stress`, or any word): what the tier is about, and how a
   theme finds it. One per tier; for a second role, make a second tier. Ids are for wiring sets to spans,
   not for themes.
3. **Tier order in the file is layer order.** It is the user's choice (dragging tiers restacks them) and is
   saved as the serialized order. A theme does not reorder tiers.
4. **Vocabulary:** "scheme" becomes **theme**; a theme's rules for one role are a **part**.

## Consequences

* Themes are portable across documents: they select by role, kind, position, key and tags.
* Crossing, nested and discontinuous spans need no special rendering contract.
* Single-value channels (text colour, weight) collide; the top layer wins and the editor warns.
* Only channels the renderer knows how to paint can be carried from the mirror to the text (Y-02, Y-03).
* Open: the mirror's exact shape, and whether members are mirrored so confirmed and inferred members can
  look different (format.md FQ7).
* Later on top, for tiers and for sets within a tier, approved by Alex (S-07). Tier rules reach their sets
  (S-08) and theme CSS is contained (S-09), also approved, after the layering prototype.
* The community scheme of ADR-0005 becomes the community theme.
