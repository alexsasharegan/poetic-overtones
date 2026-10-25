# ADR-0017: The MVP Has No Marks

**Status:** Active
**Date:** 2026-10-24
**Affected:** docs/ROADMAP.md (MRK-1 to MRK-4, CT-3, CT-4), spec/app.md (Q18, Y-03, R-05)
**Origin:** Alex, chat 2026-10-24 (DEC-4, option A)
**Review:** Decided by Alex in chat
**Revert:** A new ADR that brings marks into scope, and the board tasks they unblock

## Context

*Marks* are what CSS channels cannot draw: text or a badge above or below a span, a strip per line (the
community scheme's meter strip), and arcs between members of a relation (R-05). They need a design (Y-03,
"Box (later)") before anyone builds them. The options were none, text and strips only, or all of them with
arcs.

## Decision

1. The MVP has **no marks**. It has the text and box styles of Y-03 and nothing else.
2. The marks tasks (MRK-1 to MRK-4) and the community theme's meter strip, ties and grouped views (CT-3,
   CT-4) are **post-MVP**.
3. Relations are still modelled (R-01 to R-04) and styled by shared channels. Only their arcs wait (R-05).

## Consequences

* The community theme in the MVP covers consonants, vowels, diphthongs and stress, not the meter strip.
* The first prototype's arcs (`scansion.html`) stay the only arcs until marks are designed.
* The next design topic is chosen from the remaining ready tasks, not from marks.
