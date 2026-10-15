# ADR-0007: Spec First, and "Tier" as the Working Name

**Status:** Active
**Date:** 2026-10-14
**Affected:** AGENTS.md, spec/app.md, ROADMAP; refines ADR-0003
**Origin:** Alex, chat 2026-10-14
**Review:** Decided by Alex in chat; the vocabulary is provisional (spec Q2)
**Revert:** Supersede with an ADR that drops the spec-first rule or renames the term

## Context

ADR-0003 chose a generic multi-tier annotation tool and ADR-0006 deferred the stack. Alex wants spec-driven
design, with the spec above any language or stack, as in shavian2tengwar. He also clarified the scope:

- the core is a tokenizer with WYSIWYG markup decoration and no built-in analysis;
- every dimension is user-defined and overlaps freely, with no default hierarchy;
- segmentations, labels and relations are all in scope, relations included from the start;
- standard tiers are ordinary tiers filled by a provider, can always be edited, and are restored by a reset
  that replaces the whole tier;
- the input text is editable in an input editor, and the workbench is a function of that input;
- styles come from a scheme, through an open registry of channels, with collision warnings.

## Decision

- `spec/app.md` is the authority on what the application is. Spec first, then code, then record why in an ADR.
  Statuses are ADOPTED, PROVISIONAL and OPEN; an agent never promotes one on its own judgment.
- The spec names no programming language, framework or file API. Conformance is tested with JSON fixtures.
- The working name for a dimension, as the spec uses it, is **tier**, from linguistic annotation tools
  (Praat, ELAN). ADR-0003 and ADR-0004 say "layer"; read it as "tier".
- A tier has a kind: segmentation, label or relation.

## Consequences

- Standard providers (English first) are specified separately, after the core spec, in `spec/providers/`.
- The community scheme becomes data in the scheme format the spec defines (ADR-0005).
- If Alex prefers another word, a search-and-replace across `spec/`, `AGENTS.md` and `docs/` changes it.

Refined by ADR-0009: a tier holds sets of spans, the kinds are label and relation, and text-form fixtures are `.pxml` files.
