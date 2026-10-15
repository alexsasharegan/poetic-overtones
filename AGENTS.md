# AGENTS.md

> Instructions for AI agents working on this repository.

## Mandatory Workflow Skill

Load Alex's user-level `project-docs` skill before starting any task. It sets out:

- The project lifecycle: every piece of work gets `docs/projects/NNNN-title/` with `README.md`, `TASKS.md` and `LOG.md`, and an entry in `docs/ROADMAP.md`.
- Real-time, append-only logging in `LOG.md`.
- Nygard-style ADRs in `docs/adr/` for any change to the annotation model, the sound rules, the colour schemes, the layout or the toolchain.
- The untracked `.wip/` scratchpad.

---

## Project Identity

- **What:** a web app for multi-dimensional poetic analysis of any Unicode text (ADR-0003). The reader walks through the text in passes (syllables, then stress, then phonemes, and so on). Each pass is a tier of metadata on tokens. Tiers overlap freely, are shown or hidden, and are styled by schemes (colours, boxes, underlines).
- **Owner:** Alex Regan. Agents propose, Alex decides.
- **Direction:**
  - The workbench never edits the text. Tokens have stable references; every dimension is a stand-off tier over them.
  - Some scripts are easier than others. Shavian gives sounds almost for free; Latin-script English is more familiar and can use existing tools.
  - Tools may infer a tier (stress, syllables, phonemes). Every inferred label is flagged as inferred, and the reader confirms or overrides it (ADR-0004).
  - English is the baseline reference implementation (ADR-0006). Shavian and Tengwar keep shaping design decisions (grapheme-level tokens, non-ASCII text, combining marks), so that upgrading to those scripts and fonts needs no redesign.
  - Offline first, with a persistent working copy, a plain-text form as the share layer, PDF and image artifacts, and extensions for anything that needs extra software. Target: a stock macOS install (ADR-0008).
  - The proof of concept is client-side JavaScript only, with no hosted compute. The stack beyond that and the name are deferred (ADR-0006).
  - The built-in default colour scheme is the community scheme from *Phonetic Markup for Verse*, used as a first-class, credited scheme. Schemes and effects are configurable (ADR-0005).
- **Sibling repo:** [`shavian2tengwar`](https://github.com/alexsasharegan/shavian2tengwar) is the Shavian-to-Tengwar engine. Use it for any Tengwar view rather than re-implementing the mode. Its `spec/mode.md` is the authority on how Shavian maps to Tengwar.
- **Status:** the repo holds an early Shavian-only prototype. The generic app has no spec or code yet.

---

## Repository Structure

```text
.
├── scansion.html          # prototype: Shavian scansion score, one self-contained page (the first preset)
├── README.md              # what the prototype shows, its markup, its sound rules
├── sources/community/     # the community PDF: GITIGNORED until Alex decides to commit it (ADR-0005)
├── spec/                  # THE AUTHORITY on what the application is: spec/app.md
├── docs/
│   ├── adr/               #   Architecture Decision Records + index
│   ├── projects/          #   NNNN-title/ README.md, TASKS.md, LOG.md
│   ├── synthesis/         #   comparison.md: the Phase 1 comparison with the community scheme
│   └── ROADMAP.md         #   Now / Next / Done
├── syllabifier.py         # superseded prototype that inferred stress by vowel weight (see README for its known bugs)
├── design-doc.md, decisions.md, diagram.md, out.json   # notes and output from that prototype
├── AGENTS.md              # this file (CLAUDE.md imports it)
└── .gitignore
```

---

## Rules of the Road

### The spec is the authority

- `spec/app.md` defines what the application is. **When the spec and the code disagree, the code is wrong.** The spec names no language or stack.
- To change behaviour: spec first, then code, then record why in an ADR (ADR-0007).
- Statuses are `ADOPTED` (Alex decided), `PROVISIONAL` (an agent's default) and `OPEN`. Never promote one on your own judgment.
- Rule IDs look like `W-02`, `E-03`, `Y-05`. Decisions are `ADR-NNNN`.

### Annotation model

Stand-off tiers over tokens (ADR-0003; ADR-0007 renames layers to tiers). A change to tokenization, the tier schema, how tiers depend on each other, or how schemes bind to labels needs an ADR. The prototype's text markup (`*` before a stressed syllable, `.` manual split, `-` compound, `·` namer dot) is defined in `README.md`; it stays as an import and export format.

### Inference

Tools may suggest labels. Each label records who set it (inferred, with its source, or human). Views must show the difference. Never present an inferred label as confirmed (ADR-0004). The first prototype's rule (any full vowel is stressed) is known to be wrong; do not reuse it.

### Sound rules shared with shavian2tengwar

Where poetic-parser and shavian2tengwar both describe a sound (IPA for a letter, how a ligature expands, weak forms of 𐑞 𐑝 𐑯 𐑑 𐑓), they must agree. If they differ, raise it with Alex rather than picking one. Known differences are in `docs/synthesis/comparison.md`.

### Community scheme

- *Phonetic Markup for Verse* v3.0 is adopted as a built-in colour scheme (ADR-0005). The owner shared it for community adoption.
- Credit the author wherever the scheme appears. Alex will ask them how they want to be credited; until then name no one in committed files and refer to *Phonetic Markup for Verse*.
- The deck's hex values contradict its own swatches in places. Follow the rules in ADR-0005 and record any choice.
- The PDF stays gitignored in `sources/community/`. Summarise and cite it ("see *Phonetic Markup for Verse* v3.0, slide N"); do not commit it unless Alex says so.

### Copyrighted poems

Poems that aren't in the public domain (Tolkien, for example, including the deck's sample poem) are test input only: keep them in `.wip/` or `.tmp/`, never in committed files or published pages. Public-domain examples (Shakespeare) are fine.

---

## Conventions

- **Prose:** plain, short sentences. Cite ADRs as `ADR-NNNN`.
- **Commits:** one logical change per commit, message in the imperative.
- **Branches:** `main` is the release branch. Once the repo has a remote, work happens on branches and is squash-merged after Alex reviews it. Never merge a PR yourself.
- **Python** (when it returns): 3.14, formatted with `ruff format`, as in shavian2tengwar. The web app's stack is not chosen yet.

---

## Sensitive Information Policy

- Never commit absolute paths from someone's machine, tokens or credentials.
- Never commit copyrighted poems, or the PDF in `sources/community/` without Alex's say-so.
