# ADR-0002: Community Sources Stay Private

**Status:** Active
**Date:** 2026-10-14
**Affected:** .gitignore, sources/community/
**Origin:** Alex, 2026-10-14
**Review:** Requested by Alex
**Revert:** Remove the `sources/community/` line from `.gitignore`, once the owner agrees

## Context

A community member's *Phonetic Markup for Verse* (v3.0) bridges a phonemic Tengwar mode with poetic markup.
The owner has shared it publicly and Alex may use it privately, but publishing it in this repo is something
Alex wants to agree with the owner first, as a courtesy.

## Decision

- Keep community material in `sources/community/`, which is gitignored.
- Committed docs may summarise and cite it, but not reproduce it at length.

## Consequences

- A fresh clone does not have the material; agents working on the synthesis need Alex's local copy.
- Revisit when the owner agrees to publication, and credit them in the README then.
