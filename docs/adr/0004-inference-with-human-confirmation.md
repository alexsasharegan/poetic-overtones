# ADR-0004: Inference With Human Confirmation

**Status:** Active
**Date:** 2026-10-14
**Affected:** AGENTS.md; supersedes ADR-0001
**Origin:** Alex, chat 2026-10-14
**Review:** Decided by Alex in chat
**Revert:** Reinstate ADR-0001 (human-marked stress, no inference)

## Context

ADR-0001 stopped the tools from guessing stress, because the first prototype guessed by vowel weight (any
full vowel is stressed) and got meter wrong. Alex now wants inference attempted where possible, in a
generic tool that works across scripts.

## Decision

- Tools may infer any layer: syllables, stress, phonemes, classes.
- Every label records who set it: **human**, or **inferred** with its source (a dictionary, a rule, a model).
- Views show inferred labels differently from confirmed ones. The reader can confirm or override any label,
  and an override is always kept.
- Analysis can run on inferred labels, and results built on them are marked as such.
- The vowel-weight rule from the first prototype stays rejected: vowel quality marks reduction, not stress.

## Consequences

- Provenance is part of the annotation model (ADR-0003).
- Inference sources need choosing per script. English function-word stress depends on context, so an
  inferred value there is a suggestion, never a final answer.
- Two readers can still mark one line differently; both are kept as their own annotation sets.
