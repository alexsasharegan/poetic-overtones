# AGENTS.md

> Instructions for AI agents working on this repository.

## Mandatory Workflow Skill

Load Alex's user-level `project-docs` skill before starting any task. It sets out:

- The project lifecycle: every piece of work gets `docs/projects/NNNN-title/` with `README.md`, `TASKS.md` and `LOG.md`, and an entry in `docs/ROADMAP.md`.
- Real-time, append-only logging in `LOG.md`.
- Nygard-style ADRs in `docs/adr/` for any change to the markup, the sound rules, the layout or the toolchain.
- The untracked `.wip/` scratchpad.

---

## Project Identity

- **What:** tools for seeing the sound of a poem (meter, rhyme, assonance, alliteration). Poems are written in Shavian, so every letter is a sound and English spelling never gets in the way.
- **Owner:** Alex Regan. Agents propose, Alex decides.
- **Direction:** the reader marks the stresses; the tools never guess them (ADR-0001). The tools derive syllables, sounds and repetitions from that markup and visualise them.
- **Sibling repo:** [`shavian2tengwar`](https://github.com/alexsasharegan/shavian2tengwar) is the Shavian-to-Tengwar engine. Use it for any Tengwar output rather than re-implementing the mode. Its `spec/mode.md` is the authority on how Shavian maps to Tengwar.

---

## Repository Structure

```text
.
├── scansion.html          # the scansion score: one self-contained page, open it in a browser
├── README.md              # what the score shows, the markup, the sound rules
├── sources/community/     # community reference material: GITIGNORED, private (ADR-0002)
├── docs/
│   ├── adr/               #   Architecture Decision Records + index
│   ├── projects/          #   NNNN-title/ README.md, TASKS.md, LOG.md
│   └── ROADMAP.md         #   Now / Next / Done
├── syllabifier.py         # superseded prototype that inferred stress (see README for its known bugs)
├── design-doc.md, decisions.md, diagram.md, out.json   # notes and output from that prototype
├── AGENTS.md              # this file (CLAUDE.md imports it)
└── .gitignore
```

---

## Rules of the Road

### Markup

The scansion markup is defined in `README.md`: `*` before a stressed syllable (also mid-word), `.` manual syllable split, `-` compound, `·` namer dot. A change to the markup or to how the page hears the text (syllable splitting, ligatures, word signs, what alliterates) needs an ADR.

### Sound rules shared with shavian2tengwar

Where poetic-parser and shavian2tengwar both describe a sound (IPA for a letter, how a ligature expands, weak forms of 𐑞 𐑝 𐑯 𐑑 𐑓), they must agree. If they differ, raise it with Alex rather than picking one.

### Community sources

- `sources/community/` is gitignored. Alex has permission to use the material privately. Publishing it in this repo needs the owner's agreement, so never commit it, quote it at length in committed docs, or publish it in an artifact.
- Committed docs may summarise and cite it ("see *Phonetic Markup for Verse* v3.0, section N").

### Copyrighted poems

Poems that aren't in the public domain (Tolkien, for example) are test input only: keep them in `.wip/` or `.tmp/`, never in committed files or published pages. Public-domain examples (Shakespeare) are fine.

---

## Conventions

- **Prose:** plain, short sentences. Cite ADRs as `ADR-NNNN`.
- **Commits:** one logical change per commit, message in the imperative.
- **Branches:** `main` is the release branch. Once the repo has a remote, work happens on branches and is squash-merged after Alex reviews it. Never merge a PR yourself.
- **Python** (when it returns): 3.14, formatted with `ruff format`, as in shavian2tengwar.

---

## Sensitive Information Policy

- Never commit absolute paths from someone's machine, tokens or credentials.
- Never commit `sources/community/` or copyrighted poems.
