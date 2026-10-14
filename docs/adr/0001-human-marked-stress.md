# ADR-0001: Human-Marked Stress

**Status:** Active
**Date:** 2026-10-14
**Affected:** scansion.html, README.md; supersedes the approach of syllabifier.py
**Origin:** Discussion with Alex, 2026-10-12
**Review:** Agreed by Alex in chat; recorded when the repo was bootstrapped
**Revert:** Not revertible by commit; the earlier prototype files are kept

## Context

The first prototype (`syllabifier.py`) tried to infer stress from Shavian vowels: any full vowel was
stressed, only schwa was not. That is wrong for English. Vowel quality marks reduction, not stress, so
function words and unstressed syllables with full vowels came out stressed, and meter could not be read
from the result. It also had bugs (𐑬 missing from the vowel lists, 𐑼 counted as a full vowel).

Alex's goal is to see meter, rhyme, assonance and alliteration, and to make his own scansion easy to
record. He already hears the stresses.

## Decision

- The reader marks stress in the text: `*` before a stressed syllable, `.` to split syllables by hand,
  `-` for compounds, `·` for the namer dot. Everything else is derived.
- The output is a score (one row per line, one cell per syllable) rather than a Mermaid graph, whose
  automatic layout cannot keep lines and syllables aligned.
- First implementation: `scansion.html`, a single self-contained page.

## Consequences

- No dictionary or stress model is needed.
- Scansion is the reader's interpretation, which is the point; two readers can mark the same line
  differently.
- The automatic-stress design in `design-doc.md` is superseded; the prototype stays for reference.
