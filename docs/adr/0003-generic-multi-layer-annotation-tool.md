# ADR-0003: A Generic Multi-Layer Annotation Tool

**Status:** Active (direction). The model below is a sketch; the detailed spec is still to be written and will be proposed separately.
**Date:** 2026-10-14
**Affected:** AGENTS.md, README.md, scansion.html (becomes the first preset), ROADMAP
**Origin:** Alex, chat 2026-10-14, after comparing the community scheme with our prototype
**Review:** Direction given by Alex in chat
**Revert:** Restore the Shavian-only identity in AGENTS.md; this ADR and ADR-0004 and ADR-0005 are then superseded

## Context

The Shavian scansion page does one thing for one script. The community deck showed a different shape of
tool: the same poem rendered in passes, each pass adding one dimension (stress, vowels, consonant classes).
Alex saw that this generalises: a web app for multi-dimensional poetic analysis of any Unicode text.

The project itself began with the discussion of the Lay of Nimrodel in *Mythgard's Exploring The Lord of
the Rings* (Session 385, <https://exlotr.fireside.fm/386>), and the wish for a Tengwar mode to analyse its
poetry. The README records this origin.

## Decision

- **Input** is any Unicode text. The text is never edited by annotation.
- **Tokens.** The input is tokenised once into spans with stable references. Offsets count grapheme
  clusters, not UTF-16 units (Shavian is outside the BMP; Tengwar uses combining marks).
- **Layers.** Each dimension (syllables, stress, phonemes, rhyme, anything the reader defines) is a layer
  of labels attached to tokens or to spans of another layer. A layer may name layers it needs first.
- **Walk-through.** The reader works through the text in ordered passes, such as syllables, then stress,
  then phonemes. Each pass can be done by hand, by inference (ADR-0004), or both.
- **Decorators.** A decorator maps a label (or a class of labels) to a visual effect: colour, box, underline,
  weight. Layers are toggleable. Colour schemes and effects are configurable (ADR-0005).
- **Scripts are plugins, not the identity.** Shavian is the easiest script to analyse. Latin-script English is
  harder but can use pronunciation tools. A Tengwar view is rendered through shavian2tengwar.
- `scansion.html` stays as the first working preset until the app replaces it.

## Consequences

- The project needs a spec for the annotation model before any code: tokens, spans (including
  discontinuous ones, for English split digraphs), layer dependencies, provenance, persistence, decorator
  binding.
- Cells of a Tengwar rendering can mix sounds from two syllables (V-01 in shavian2tengwar), so styling needs
  to work per glyph and per mark, not only per syllable. See `docs/synthesis/comparison.md`, section 5.
- The repo name and the web stack are open.
- The Shavian-only text markup becomes an import and export format.
