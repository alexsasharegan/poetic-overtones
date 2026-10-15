# ADR-0005: Community Scheme as a First-Class Colour Scheme

**Status:** Active
**Date:** 2026-10-14
**Affected:** AGENTS.md, .gitignore, README (credit); supersedes ADR-0002
**Origin:** Alex, chat 2026-10-14
**Review:** Decided by Alex in chat
**Revert:** Remove the built-in scheme and restore ADR-0002

## Context

*Phonetic Markup for Verse* v3.0 (its author's credit wording is to be agreed) defines how sound features map to
visual channels: place of articulation as hue, voicing as brightness, manner as border style, vowel quality
as hue, stress as three levels, and a meter strip. ADR-0002 held it back pending the owner's agreement.
Alex's view: the owner shared it with the community so that tools would align on a common standard, which
amounts to asking for adoption. The compatibility value is high.

## Decision

- The scheme is a **built-in, first-class** colour scheme, credited to its author wherever it appears. Alex will ask the author how they want to be credited once there is something to share; until then no name is committed.
- It is one scheme among several. Schemes and effects stay configurable, and we may design our own default
  later (ADR-0003).
- The scheme is stored as data (label to style), not code, so it can be edited and extended.
- The deck's own inconsistencies are settled before encoding: where a hex label contradicts its swatch or
  the slide 1 place logic (/ŋ/, /hw/, /ɾ/, /j/, /h/, and the shared /tʃ/ and /ʃ/ values), follow the swatch
  and place logic, and record each choice. We may ask the owner to confirm.
- The PDF itself stays gitignored in `sources/community/` until Alex decides to commit it. Committed docs
  may summarise and cite it.

## Consequences

- The scheme's values are copied into project data; credit the author in the README and the scheme file.
- The deck's sample poem is copyrighted; it is not used in tests or examples that get committed.
- The Tengwar grid and the deck disagree in a few places (`docs/synthesis/comparison.md`, section 4.3).
  A scheme must say which classification it follows.
