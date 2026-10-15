# ADR-0013: The Project Is Named poetic-overtones

**Status:** Active
**Date:** 2026-10-15
**Affected:** README.md, AGENTS.md, package.json, app/index.html, docs (current-facing ones)
**Origin:** Alex, chat 2026-10-15
**Review:** Decided by Alex
**Revert:** Supersede with an ADR that picks another name

## Context

The repository was `poetic-parser`, a name from the first prototype. The project is now a layered annotation tool
for the sound of verse: tiers painted over one untouched text. `docs/synthesis/stack-and-name-options.md` listed
candidates; none was checked for collisions.

## Decision

The project and repository are **poetic-overtones**; its display name is **Poetic Overtones**. Overtones are the
layers inside a single sound, as tiers are the layers over a single text.

## Consequences

* Current-facing files use the new name. Dated records (the comparison study, the foundation log, earlier ADRs)
  keep the old one, as history.
* The working folder on Alex's machine is renamed to match; the file extension `.pxml` ("poetic XML") stays.
* Not yet checked for collisions with existing projects, packages or domains (do this before publishing).
