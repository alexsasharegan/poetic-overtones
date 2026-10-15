# AGENTS.md

> Instructions for AI agents working on this repository.

## Start Here

A new session should read, in this order:

1. `docs/ROADMAP.md`: the board. Where the project stands, every queued task by epic, what blocks what.
2. The latest note in `docs/reviews/`: the decision ledger and what is waiting for Alex.
3. `docs/HISTORY.md`: how the project got here, in phases.
4. `spec/app.md` and `spec/format.md`: the authority. Then the code under `src/` and `app/`.

Run `npm test` before and after any change. Pick work from the board; do not start a task marked ⛔.

## Mandatory Workflow Skill

Load Alex's user-level `project-docs` skill before starting any task. It sets out:

- The project lifecycle: every piece of work gets `docs/projects/NNNN-title/` with `README.md`, `TASKS.md` and `LOG.md`, and an entry in `docs/ROADMAP.md`.
- Real-time, append-only logging in `LOG.md`.
- Nygard-style ADRs in `docs/adr/` for any change to the annotation model, the sound rules, the themes, the layout or the toolchain.
- The untracked `.wip/` scratchpad.

---

## Project Identity

- **What:** a web app for multi-dimensional poetic analysis of any Unicode text (ADR-0003). The reader walks through the text in passes (syllables, then stress, then phonemes, and so on). Each pass is a **tier**; a tier holds **sets**; a set lists **spans** of the text. Tiers overlap freely, are shown or hidden, are painted as **layers** in tier order, and are styled by **themes** (plain CSS over the analysis, ADR-0011).
- **Owner:** Alex Regan. Agents propose, Alex decides.
- **Direction:**
  - The workbench never edits the text. Spans have stable ids; every dimension is a stand-off tier over them.
  - Some scripts are easier than others. Shavian gives sounds almost for free; Latin-script English is more familiar and can use existing tools.
  - Tools may infer a tier (stress, syllables, phonemes). Every inferred label is flagged as inferred, and the reader confirms or overrides it (ADR-0004).
  - English is the baseline reference implementation (ADR-0006). Shavian and Tengwar keep shaping design decisions (grapheme-level tokens, non-ASCII text, combining marks), so that upgrading to those scripts and fonts needs no redesign.
  - Offline first, with a persistent working copy, a plain-text form as the share layer, PDF and image artifacts, and extensions for anything that needs extra software. Target: a stock macOS install (ADR-0008).
  - The proof of concept is client-side JavaScript only, with no hosted compute. The stack beyond that and the name are deferred (ADR-0006).
  - The community scheme from *Phonetic Markup for Verse* is a first-class, credited built-in theme (`themes/community.css`, ADR-0005). Themes are configurable.
- **Sibling repo:** [`shavian2tengwar`](https://github.com/alexsasharegan/shavian2tengwar) is the Shavian-to-Tengwar engine. Use it for any Tengwar view rather than re-implementing the mode. Its `spec/mode.md` is the authority on how Shavian maps to Tengwar.
- **Status (2026-10-15):** the text form and app spec are written, a dependency-free core library and a first app exist, and the community theme is encoded. See `docs/ROADMAP.md`.

---

## Repository Structure

```text
.
├── spec/                    # THE AUTHORITY
│   ├── app.md               #   what the application is (rule IDs like W-02, T-05, Y-03)
│   ├── format.md            #   the .pxml text form (B-, T-, M-, A-, S-, I- rules)
│   ├── fixtures/            #   .pxml cases that pin the format; check.py is the reference checker
│   └── providers/           #   provider contract, English providers, fixtures, runner
├── src/
│   ├── core/                # model, XML parser, loader, export, Editor (ADR-0012)
│   └── render/              # the painter: themes over the analysis mirror (ADR-0011)
├── app/                     # the app (npm run serve, then /app/)
├── themes/                  # built-in themes; community.css and its README
├── tests/                   # Node tests run by npm test
├── prototypes/layers/       # the standalone layering prototype the renderer came from
├── docs/
│   ├── ROADMAP.md           #   the board: epics, tasks, dependencies
│   ├── HISTORY.md           #   how the project got here
│   ├── reviews/             #   review notes with decision ledgers
│   ├── projects/            #   NNNN-title/ README.md, TASKS.md, LOG.md (0001-foundation is done)
│   ├── adr/                 #   Architecture Decision Records + index
│   ├── synthesis/           #   background studies (deck vs Tengwar; stack and name options)
│   └── ui-plan.md           #   the order of UI work
├── scansion.html            # the first prototype: Shavian scansion score (kept for reference)
├── syllabifier.py, design-doc.md, decisions.md, diagram.md, out.json   # the earliest attempt (superseded)
├── sources/community/       # the community PDF: GITIGNORED, never committed (ADR-0005)
├── package.json             # scripts only (test, serve); no dependencies
├── README.md
├── AGENTS.md                # this file (CLAUDE.md imports it)
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

Stand-off analysis: a tier holds sets, a set lists spans, and spans are marked in the text (ADR-0003; ADR-0007 renames layers to tiers; ADR-0009). A change to the span model, the tier schema, how tiers depend on each other, or how themes find tiers (roles, the mirror) needs an ADR. The prototype's text markup (`*` before a stressed syllable, `.` manual split, `-` compound, `·` namer dot) is defined in `README.md`; it stays as an import and export format.

### File format invariants

Decided by Alex; do not relax them on your own judgment.

- **No CDATA, anywhere.** The text form is XML-based, but `<![CDATA[ ... ]]>` is not part of it and a loader rejects it. Escape with `&lt;` `&amp;` or numeric references, or keep the text in a file and reference it with a self-closing `<text src="..."/>` (fixtures `09`, `10`, `e15`).
- Markup follows the XML spec, not HTML5 leniency, and uses JSX-style self-closing tags (`<tag ... />`).
- Ids are unique across the whole file and opaque. Never derive an id from a name or the reverse. Every span has an id; a span in pieces uses `cont`, never a repeated id.
- Members are listed one by one (no ranges). Styles are plain CSS.
- The fixtures in `spec/fixtures/` are part of the spec. Run `python3 -I spec/fixtures/check.py` before and after any format change.
- Themes style the analysis (tiers by `role`, sets by position, key and tags), never the text and never by id; tier order is layer order (ADR-0011).
- The core library is `src/core/` (plain ES modules, no dependencies, ADR-0012). `npm test` runs every fixture through it and through the Python checkers, plus round trips. Keep `load.js` and `check.py` in step: same rules, same error codes.
- The app is `app/` over `src/core/` and `src/render/`; run it with `npm run serve` (port 8000, open `/app/`). The order of UI work is `docs/ui-plan.md`.
- Provider fixtures are in `spec/providers/fixtures/`. Run `python3 -I spec/providers/run.py` before and after any provider change. Never hand-edit a fixture to make it pass; fix the spec first.

### Inference

Tools may suggest labels. Each label records who set it (inferred, with its source, or human). Views must show the difference. Never present an inferred label as confirmed (ADR-0004). The first prototype's rule (any full vowel is stressed) is known to be wrong; do not reuse it.

### Sound rules shared with shavian2tengwar

Where poetic-parser and shavian2tengwar both describe a sound (IPA for a letter, how a ligature expands, weak forms of 𐑞 𐑝 𐑯 𐑑 𐑓), they must agree. If they differ, raise it with Alex rather than picking one. Known differences are in `docs/synthesis/comparison.md`.

### Community theme

- *Phonetic Markup for Verse* v3.0 is adopted as a built-in theme, `themes/community.css` (ADR-0005). How a document must be marked for it, and every colour settled where the deck contradicts itself, are in `themes/README.md`. The owner shared it for community adoption.
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
- **JavaScript:** plain ES modules, no build step, no runtime dependencies (ADR-0012). Positions in the model are code points.
- **Python** (reference checkers only): stdlib, run with `python3 -I`; 3.14 and `ruff format` as in shavian2tengwar. The stack beyond the POC is not chosen yet (DEC-8).
- **Planning:** tasks live on the board in `docs/ROADMAP.md` with stable IDs (`UI-4`, `MRK-1`). A larger piece of work also gets `docs/projects/NNNN-title/`. Write a review note in `docs/reviews/` at the end of a long session.

---

## Sensitive Information Policy

- Never commit absolute paths from someone's machine, tokens or credentials.
- Never commit copyrighted poems, or the PDF in `sources/community/` without Alex's say-so.
