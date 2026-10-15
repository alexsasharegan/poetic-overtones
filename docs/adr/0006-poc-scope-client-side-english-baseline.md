# ADR-0006: POC Scope: Client-Side JavaScript, English Baseline

**Status:** Active
**Date:** 2026-10-14
**Affected:** AGENTS.md, ROADMAP; refines ADR-0003
**Origin:** Alex, chat 2026-10-14
**Review:** Decided by Alex in chat
**Revert:** Supersede with an ADR that picks a stack, a host or a different baseline script

## Context

ADR-0003 sets the direction but leaves the stack, the hosting and the first script open. Alex wants to
defer the stack as long as he can. His constraints: his experience is in JavaScript and Go; he does not
want to host CPU-heavy compute himself, because of the attacks his server already gets; he would rather
the compute ran on someone else's machine, as a locked-down localhost app or a distributable binary.

## Decision

- **The proof of concept (POC) is client-side JavaScript only.** No server code and no hosted compute.
- **English is the baseline reference implementation.** It is familiar and has tools. Shavian and Tengwar
  stay in view as design constraints, so that kinks (non-ASCII text, combining marks, cells that mix
  syllables) are worked out on English first and the move to those scripts and fonts is an upgrade.
- **Order of work:** the annotation model spec, then the community scheme as data. The Tengwar view comes later.
- **Deferred:** the stack beyond the POC (a local binary, WASM, a desktop shell, a Python helper), the
  hosting, and the project name. Options are in `docs/synthesis/stack-and-name-options.md`.

## Consequences

- The annotation model and its data formats must not depend on JavaScript, so a later Go, Rust or Python
  helper can read the same files.
- Anything that needs heavy compute (large pronunciation models, for example) waits for the deferred
  decision, or runs on the user's own machine.
- No persistent shared storage in the POC; the reader's work lives in the browser and is exported as a file.
