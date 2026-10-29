# poetic-overtones

**Poetic Overtones** (formerly poetic-parser). A web app for seeing the sound of a poem in many dimensions at once: syllables, stress, rhyme,
assonance, alliteration, feet, and anything else a reader wants to mark. It works on any Unicode text.
English is the baseline; Shavian and Tengwar shape the design. Marks live in **tiers** that overlap
freely, and **themes** (plain CSS) decide how they look. The community scheme from *Phonetic Markup for
Verse* by Eric Kingsepp (Éadric Scúsmiþ) is a built-in theme.

## Status (2026-10-28)

| Part | State |
|---|---|
| Text form `.pxml` (`spec/format.md`) | Specified; 53 fixtures; every rule adopted |
| Application spec (`spec/app.md`) | Adopted, apart from the open questions in section 13 and five newer rules (W-05, W-06, Y-13, O-05, A-06) that wait for review |
| Core library (`src/core/`) | Loads, edits with undo, adds standard tiers and themes, saves; no runtime dependencies |
| Renderer (`src/render/`) | Themes painted as text styles and box styles; prints; snap-to-words helper |
| App (`app/`) | Open (button or drag and drop), mark text (snap to words, several pieces as one span), click painted text to find its mark, edit tiers and sets, standard tiers for lines, stanzas and words with reset, add and switch themes, keep a working copy in the browser, print or save as PDF, save |
| Themes (`themes/`) | Community (credited; its colours await the author's confirmation) and Plain |
| Providers (`spec/providers/`, `src/providers/`) | Lines, stanzas and words in JavaScript. Syllables and stress are marked by hand; lexicon-based providers come after the MVP |
| Demo (`demo/`) | Sonnet 18 (public domain), marked; a script that records the app as an MP4 and a GIF |
| Not yet | Marks (text above or below a span, a meter strip, arcs; ADR-0017), Shavian and Tengwar views, hosting |

**Start here:** `docs/ROADMAP.md` (the board), then the latest note in `docs/reviews/`, then
`docs/HISTORY.md`. Agents: `AGENTS.md`.

## Try it

You need Node and Python 3. The app has no install step; it needs a local server because browsers will not
load modules from `file://` pages everywhere (ADR-0012).

```sh
npm run serve     # then open http://localhost:8000/app/ and pick "Sonnet 18 (full demo)" in the Sample menu
npm test          # fixtures through the JS core and the Python checkers, round trips, editing, themes, demo
```

Marking: select a set in the panel, select text in the poem, press **M**. Press **P** to keep a selection as one
piece of a span, then select the next piece and press **M**. Tick "snap to words" to widen selections to whole
words. Click painted text to see which set it is in.

Browser tests and the demo recording need Playwright and `ffmpeg`:

```sh
npm install && npx playwright install chromium
npm run test:browser    # 16 checks in Chromium
npm run demo:record     # writes .tmp/demo/demo.mp4 and demo.gif
```

## Repository map

| Path | What it is |
|---|---|
| `spec/app.md` | What the application is. The authority: when spec and code disagree, the code is wrong |
| `spec/format.md`, `spec/fixtures/` | The `.pxml` text form and the fixtures that pin it; `check.py` is the reference checker |
| `spec/providers/` | Provider contract and English providers, with fixtures and a runner |
| `src/core/` | Model, XML parser, loader, export, `Editor` (ADR-0012) |
| `src/providers/` | Line, stanza and word providers in JavaScript |
| `src/render/` | The painter: themes over the analysis mirror (ADR-0011); selection helpers |
| `app/` | The app; `docs/ui-plan.md` orders its steps |
| `themes/` | Built-in themes; `community.css`, `plain.css` and how documents must be marked for them |
| `demo/` | The Sonnet 18 demo document, its build script and the recorder |
| `prototypes/layers/` | The layering prototype the renderer came from (standalone page) |
| `tests/` | Node tests run by `npm test`; browser tests run by `npm run test:browser` |
| `docs/ROADMAP.md` | The board: epics, tasks, dependencies |
| `docs/HISTORY.md`, `docs/projects/` | How the project got here; per-project logs |
| `docs/adr/` | Decision records |
| `docs/reviews/` | Review notes with decision ledgers |
| `docs/synthesis/` | Background studies (the deck against Tengwar; stack and name options) |
| `scansion.html` and the files listed under "Earlier prototype" | The first Shavian prototypes, kept for reference |
| `sources/community/` | The community PDF; gitignored, never committed |

## Licence

The code and documents are under the [MIT licence](LICENSE). Two things are not covered by it:

* The **community theme** (`themes/community.css`) encodes the scheme *Phonetic Markup for Verse* by Eric
  Kingsepp (Éadric Scúsmiþ), which is theirs. The CSS is included with credit; its licence terms are not yet agreed
  with the author (board: CT-6, `spec/app.md` Q7).
* The **poems** in the demos are in the public domain (Sonnet 18; *Twinkle, Twinkle, Little Star*). Poems that are
  not stay out of the repository (`AGENTS.md`).

## Origin

This project began with the discussion of the Lay of Nimrodel in
[*Mythgard's Exploring The Lord of the Rings*](https://exlotr.fireside.fm/), Dr. Corey Olsen's podcast from
Signum University's Mythgard Institute, in
[Session 385, "Poetry Time! Nimrodel: Session 1"](https://exlotr.fireside.fm/386) (20 September 2026). The
wish for a Tengwar mode that helps with the poetic analysis of that poem sparked this project, shavian2tengwar,
and the community work on phonetic markup for verse that the colour scheme here comes from.

<!-- TODO(Alex): add a timestamp for the Tengwar-mode remark. The episode page has no description, so the
     remark is not verified from the page. Check before the README goes public. -->

## The first prototype: a Shavian scansion page

Everything below describes `scansion.html`, the page the project started from. It is kept as a reference
and as the first "preset" the app should eventually cover.

### Scansion score

`scansion.html` is a single page with no build step. Open it in a browser, paste a Shavian poem marked
with your own scansion, and it draws the poem as a score:

- one row per line and one cell per syllable, stressed syllables shaded, with `×` and `/` under each
- syllable and beat counts per line, and end-rhyme letters (A, B, ...)
- stressed vowels coloured when the same vowel recurs under stress (assonance)
- arcs between stressed syllables that start with the same consonant (alliteration), reaching within a
  line, to the next line, or across the stanza
- optional dashed arcs from consonants in unstressed syllables to a later stressed syllable that starts
  with them (echoes)
- click a sound to show only that sound; hover a syllable for its onset, vowel and coda

What you paste is kept in that browser's local storage, so it is still there next time. It is not sent
anywhere.

#### Markup

| Mark | Meaning | Example |
|---|---|---|
| `*` | the next syllable is stressed; works mid-word | `𐑩𐑐*𐑪𐑯` |
| `.` | split syllables by hand where the automatic split is wrong | `𐑤𐑳𐑝.𐑤𐑦` |
| `-` | joins a compound; it stays one word | `*·𐑧𐑤𐑝𐑩𐑯-*𐑥𐑱𐑛` |
| `·` | namer dot; shown, not sounded | `*·𐑥𐑱` |

A blank line separates stanzas. Punctuation and apostrophes are shown but not sounded.

#### How it hears the text

- Syllables are split around each vowel letter; consonants between vowels go to the next syllable when
  they form an English onset (𐑕𐑑, 𐑐𐑮, ...), otherwise one goes to the next syllable and the rest stay.
- Ligatures carry a hidden consonant: 𐑸 𐑹 𐑺 𐑽 𐑻 𐑼 are a vowel plus /r/, and 𐑿 is /j/ plus 𐑵. The
  vowel part is what counts for assonance, so 𐑺 rhymes and assonates with 𐑧𐑮.
- The one-letter words 𐑞 𐑝 𐑯 𐑑 𐑓 are sounded as their weak forms (/ðə/, /əv/, /ənd/, /tə/, /fər/), or
  their strong forms when marked `*`.
- An /st/ or /sp/ opening alliterates with plain /s/.

### Earlier prototype

`syllabifier.py`, `design-doc.md`, `decisions.md`, `diagram.md` and `out.json` are the first attempt,
which tried to infer stress automatically. Known bugs there: 𐑬 is missing from the vowel lists, 𐑼 counts
as a full (stressed) vowel, and every syllable with a full vowel is marked stressed.
