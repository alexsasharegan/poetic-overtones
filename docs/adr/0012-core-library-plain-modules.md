# ADR-0012: The Core Library Is Plain ES Modules With Its Own XML Parser

**Status:** Active
**Date:** 2026-10-14
**Affected:** src/core/, tests/, package.json, spec/format.md (B-03, e30), spec/fixtures/check.py, AGENTS.md
**Origin:** Alex, chat 2026-10-14 ("let's proceed" on the core library)
**Review:** Implementation choices, not format rules; revisit when the stack beyond the POC is chosen (ADR-0006)
**Revert:** Supersede with an ADR that adopts a build step or an XML library

## Context

The POC is client-side JavaScript and offline-first (ADR-0006, ADR-0008). The format's reference checker is
Python. The application needs the same loader in the browser, and the tests need it in Node.

## Decision

1. The core (`src/core/`) is plain ES modules with **no dependencies and no build step**.
2. It has **its own small XML parser** for exactly what the format allows. Browsers' `DOMParser` and Node differ,
   and neither reports CDATA, comments in text or line numbers the way the format needs.
3. The loader is a **rule-for-rule port of `check.py`** with the same error codes, so the fixtures test both.
4. Positions in the model are **code points** (M-06). File access is **injected** (`readFile`), so the loader
   never touches a file system or the network itself.
5. Export is canonical (I-02). Crossing spans made by edits are written as heads and continuations
   automatically; styles are written inline.

## Consequences

* `npm test` runs every fixture through the JavaScript core and the Python checker, plus round trips.
* A DOCTYPE is now rejected by both (B-03 said there was none; fixture e30).
* Prototypes opened as `file://` pages cannot import modules in every browser, so they keep their own small loaders
  until the application is served.
