# ADR-0015: Ids Are Unique in the Document, Not Never Reused

**Status:** Active
**Date:** 2026-10-24
**Affected:** spec/app.md (S-04, Q17), spec/format.md (B-10), src/core/edit.js, src/core/README.md, tests/editor.mjs
**Origin:** Alex, chat 2026-10-24 (DEC-3, "agreed" to the recommendation)
**Review:** Decided by Alex in chat
**Revert:** A new ADR that records retired ids in the file

## Context

S-04 said ids are unique and "never reused". The editor never reuses an id within a session. A deleted id is
not in the saved file, so a later session could hand it out again. Keeping the promise would mean saving a
list of retired ids that nothing else uses.

## Decision

1. Ids are **unique in the document** (spans, tiers and sets together). That is all the format requires
   (B-10).
2. An application may reuse the id of something that no longer exists in the file. Nothing outside a file
   refers to its ids.
3. The editor still does not reuse an id within one session, so undo and redo restore exactly what was there.

## Consequences

* S-04 is rewritten; Q17 is closed.
* No file format change and no code change. Comments and tests say "within a session".
* A tool that wants stable ids across sessions (for example, to diff two saves) must not rely on them.
