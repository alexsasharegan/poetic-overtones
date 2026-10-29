# ADR-0018: The Proof of Concept Keeps One Working Copy in Local Storage

**Status:** Active
**Date:** 2026-10-25
**Affected:** app/main.js, spec/app.md (O-05), docs/ROADMAP.md (CORE-5)
**Origin:** Agent's choice, as the board asked for ("needs a storage choice for the POC"); Alex reviews it in the PR
**Review:** Accepted by Alex's instruction to merge `demo-mvp` into `main`, 2026-10-28 (the repository had no remote, so there was no PR)
**Revert:** Remove `persist()` and `restore()` in `app/main.js`; nothing else reads the key

## Context

O-02 says the working copy is kept in persistent local storage and does not name a technology. Without
it, a reload loses all marking, which is the main risk when showing the app. The proof of concept is client-side
JavaScript with no build step (ADR-0006, ADR-0012). The documents are poems: kilobytes, not megabytes.

## Decision

1. After every change the app writes the document's text form (`save()`) and its file name to `localStorage`
   under the key `poetic-overtones:working-copy`.
2. On start the app reopens that copy; opening a file or a sample replaces it. There is one slot.
3. A failed write (private window, storage full) is reported once and the app goes on.
4. The text form is the stored form, so the working copy is a valid `.pxml` and `load()` checks it on the way
   back. Undo history is not kept across a reload.

## Consequences

* A reload keeps the work. Two tabs share one slot, and the last write wins.
* The slot holds about 5 MB in most browsers, far more than a poem needs. A library of several documents, or
  long texts (W-04), would need IndexedDB: a later decision, with the post-MVP storage design.
* Browsers can clear local storage, so Save to a file stays the way to keep work.
