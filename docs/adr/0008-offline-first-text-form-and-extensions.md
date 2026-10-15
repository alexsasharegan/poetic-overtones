# ADR-0008: Offline First, a Text Form, Artifacts and Extensions

**Status:** Active
**Date:** 2026-10-14
**Affected:** spec/app.md (P-07 to P-12, sections 9 to 11), AGENTS.md, ROADMAP; refines ADR-0006
**Origin:** Alex, chat 2026-10-14
**Review:** Decided by Alex in chat
**Revert:** Supersede with an ADR that changes the principle in question

## Context

Alex wants the application to be a poetic analysis IDE. He works offline-first, wants work to persist on the
user's file system, wants documents to be shareable in an open, readable form, and wants a way to publish a
finished picture. He expects advanced processing to need extra software on the user's computer. His target is
a stock macOS install (the Tolkien Professor, for one, uses a Mac).

## Decision

- **Offline first** (P-07). **Persistent working copy** on the user's file system (P-08), technology open;
  a local database is an example.
- Because the working copy is not the text form, the application has an **export engine and an import
  engine** (O-04).
- **The text form** is a plain-text, human-readable, importable serialisation, the share layer (P-09, F-02,
  F-05). Its grammar is not decided; it gets its own spec, `spec/format.md`.
- **Artifacts** are immutable shares, PDF and images (P-10, A-01 to A-05).
- **Baseline plus extensions** (P-11, X-01 to X-08). The baseline needs nothing added. Extensions add providers
  and may need extra software, such as a language runtime. Opening a document never runs one.
- **macOS first** (P-12). Nothing in the spec depends on it.

## Consequences

- `F-02` replaces the earlier provisional rule that files are JSON.
- A browser-only POC (ADR-0006) may not reach the user's file system directly. It can keep the working copy
  in browser storage and use the text form for save and open. What each browser supports on a stock Mac
  (Safari, for one) needs checking before this is relied on.
- A stock Mac may not ship a ready-to-use Python 3, so anything that needs Python is an extension the user
  installs. That includes shavian2tengwar (Python 3.14). Keeping Tengwar in the baseline would need a port to
  the baseline's language; its corpus could verify that. This needs checking.
- The text form must handle overlapping tiers, which plain inline markup does not (spec Q9).
