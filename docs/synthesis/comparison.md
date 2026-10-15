# Community markup vs poetic-parser: Phase 1 comparison

> Read-only analysis. Nothing in the code has changed. Alex decides; this document proposes.
> Written 2026-10-14, **revised the same day** after Alex clarified the purpose: the deck matters less as a
> visual to copy than as a spec of which sound features get which visual channel, and how well that fits
> the Tengwar that shavian2tengwar produces. Sections 3 to 5 are new; the decisions (section 9) are redone.
> Phase 2 (decisions) and Phase 3 (integration) have not started.
>
> **Update, later 2026-10-14:** Alex pivoted the project to a generic multi-layer annotation tool and
> settled two decisions. D17 (permission) is cleared: the owner shared the scheme for community adoption
> (ADR-0005). The conflict with ADR-0001 is resolved: inference is wanted, flagged and human-confirmed
> (ADR-0004). The sections below still compare the two notations and the Tengwar fit.

## 0. What was compared

- **Ours:** `README.md`, `AGENTS.md`, ADR-0001 and ADR-0002, `scansion.html` (parser, sound tables, links, rendering), the superseded prototype notes; and from shavian2tengwar `AGENTS.md`, `spec/mode.md`, `docs/philosophy.md`, `docs/language-guide.md` (the Tengwar grid), `spec/encodings/alcarin.md` and the public API.
- **Theirs:** *Phonetic Markup for Verse* v3.0, a 13-slide Keynote export. Cited as "PMV, slide N" with the printed numbers (the deck prints "10" twice: sibilants, then fricatives). The deck is private (ADR-0002). This document summarises it and quotes none of its sample poem.

Things to know:

1. **The deck never mentions Tengwar or Shavian.** It marks English-spelled verse. But its layout of consonants (section 4) is close to the Tengwar grid. I take that as a strong fit; that the author designed it that way is my inference, not something the deck says.
2. **The deck is a design spec, not a data format.** It gives colours, border styles and legends, with no text syntax and no rules for how sounds or stress are decided.
3. **Only this one file is in `sources/community/`.** If other assets exist, I haven't seen them.
4. **The deck's sample is a Tolkien poem.** Fine for private reading; never in committed files or published pages (`AGENTS.md`).

## 1. The reframe

Read as a notation for English text, the deck and our page are rivals. Read as a **feature-coding spec**, they are not. The deck answers a question we have not yet answered: *given a sound, which visual channel carries which phonetic feature?*

- place of articulation is **hue**
- voicing is **brightness**
- manner is **border style and weight**
- vowel quality is **hue family**, length or tenseness is **lightness**
- a diphthong is **two colours** (nucleus, then glide)
- stress is **three levels**, and a line has a **meter strip**

Tengwar is already a featural script. Series (place) and grade (manner and voicing) are written into the letter shapes, and vowel families into the tehtar. So the deck's feature-to-channel logic can attach to s2t's glyph cells almost directly, which the deck's English-spelling carrier never allowed. That is the use of the deck, and what sections 3 to 5 work through.

## 2. Summary

**Aligned.** Both treat poetry as sound, not spelling. Both rely on a human stress judgement. Both draw a per-line strip of stress against syllables. Both group sounds for rhyme, assonance and alliteration. Their consonant taxonomy is close to the Tengwar grid.

**Different.**

1. **Carrier.** The deck overlays marks on English spelling and needs a hand-made letter-to-sound alignment. We take Shavian; a letter is a sound. s2t's cells give a third carrier, Tengwar, where the features are already in the shapes.
2. **Layering.** The deck is built in passes: stress and the meter strip stay on every slide, and the sound dimensions are shown one at a time (vowels on slide 6; labials, dentals, plosives, sibilants, fricatives on slides 7 to 10) before the full overlay on slide 11. Ours also has toggles, but they cover other dimensions (section 3.1).
3. **Stress scale.** Deck: primary, secondary, unstressed, plus tie and break flags. Ours: stressed or not.
4. **Class model.** The deck groups by place, manner and a **sibilant** overlay. The Tengwar grid has four series and six grades, with /s z/ outside the grid. They agree on most sounds and differ on a few (section 4.3).
5. **Phonetic detail.** The deck is more phonetic than phonemic (second /aɪ/, tap /ɾ/, no schwa, r-vowels as units). Shavian cannot express some of that.

**Decisions for Alex:** seventeen, in section 9, each with a proposal.

## 3. The deck as an abstract spec

| Feature | Deck channel | What it needs from the text | Tengwar counterpart in s2t |
|---|---|---|---|
| Consonant place | hue (red labial, yellow dental, green alveolar, blue postalveolar, purple velar) | the consonant | the **series** of the base (`{parma}` is labial, `{tinco}` dental, ...) |
| Consonant voicing | same hue at about 50% brightness when voiced | the consonant | the **grade** parity (grades 2, 4 voiced) |
| Consonant manner | border: heavy rough for plosives, dashed for affricates, dotted for fricatives and sibilants, heavy round-cornered for nasals, thin for approximants | the consonant | the **grade** (stem and loop shape) and `[bar-above]` for a nasal before a stop (N-01) |
| Vowel quality | hue family: front blue, central green, back warm | the vowel | the **tehta** (`[dot-above]` is the i-family, `[right-curl]` o, `[left-curl]` u, ...) |
| Vowel length or tenseness | lighter for lax, darker for tense (I-pairs such as /ɪ/ and /iː/) | the vowel | **carrier**: a long vowel sits on `{aara}` (V-03), a short one is a mark (V-01) |
| Diphthong | fill is the start vowel, drop shadow is the glide | the diphthong | one cell: **base** is the glide (`{anna}` or `{vala}`), **mark** is the nucleus (D-01 to D-05) |
| Stress | bold, bold italic | a human mark | none; needs a channel (D8) |
| Meter | strip of bars; pink break; tie | stress, plus a declared pattern for breaks | none; sits outside the word |
| Groups | filtered views by place, manner or sibilant | the consonant | none; a view over cells |

Two points follow.

- **Tengwar already writes manner and voicing.** If we also drew the deck's border styles on a Tengwar letter, we would repeat information the shape carries. On Tengwar the useful channel is **colour** (series, vowel family); border style would add little. I recommend borrowing the deck's *assignment of features to channels*, not its box styles.
- **The diphthong rule is free.** The deck colours a diphthong as nucleus plus glide. s2t writes one as a glide base with a nucleus mark. Styling base and mark separately gives the deck's result with no special case.

### 3.1 It is layered, not a kitchen sink

The sample slides show one poem rendered several times, each pass adding or isolating one dimension:

| Pass | Slide | Shows |
|---|---|---|
| Base | every slide | stress (bold) and the meter strip |
| Vowels | 6 | vowel fills, so rhymes and related vowels show |
| Consonant classes | 7 to 10 | one class at a time: labials, dentals, plosives, sibilants, fricatives |
| Everything | 11 | all dimensions together, for comparison |

The deck does not call these layers, but that is how it is used. It maps well onto a page with toggleable dimensions. Ours already has some toggles (alliteration arcs, echoes, vowel colour, IPA) and a single-sound filter. What differs is the dimension set: ours has no consonant-class layers and no stress levels beyond one.

## 4. Crosswalk to the Tengwar grid

Grid and glyph names are from s2t (`docs/language-guide.md`, `spec/mode.md` §3 and §5). Deck placement is from PMV slides 1 and 2.

### 4.1 Consonants

| Shavian | s2t glyph | Tengwar series, grade | Deck place, manner |
|---|---|---|---|
| 𐑑 𐑛 | `{tinco}` `{ando}` | I (dental), 1 and 2 | dental plosive |
| 𐑔 𐑞 | `{thuule}` `{anto}` | I, 3 and 4 | dental fricative |
| 𐑯 | `{nuumen}` | I, 5 | dental nasal |
| 𐑐 𐑚 | `{parma}` `{umbar}` | II (labial), 1 and 2 | labial plosive |
| 𐑓 𐑝 | `{formen}` `{ampa}` | II, 3 and 4 | labial fricative |
| 𐑥 | `{malta}` | II, 5 | labial nasal |
| 𐑢 | `{vala}` | II, 6 | labial approximant |
| 𐑗 𐑡 | `{calma}` `{anga}` | III (palatal), 1 and 2 | postalveolar affricate |
| 𐑖 𐑠 | `{harma}` `{anca}` | III, 3 and 4 | postalveolar fricative |
| 𐑘 | `{anna}` | III, 6 | postalveolar approximant |
| 𐑒 𐑜 | `{quesse}` `{ungwe}` | IV (velar), 1 and 2 | velar plosive |
| 𐑙 | `{nwalme}` | IV, 5 | velar nasal |
| 𐑣𐑢 | `{hwesta}` | IV, 3 | **labial** approximant |
| 𐑕 𐑟 | `{silme}` `{esse}` | outside the grid | **alveolar** fricative |
| 𐑣 | `{hyarmen}` | outside the grid | velar row, noted "glottal, not velar" |
| 𐑤 | `{lambe}` | outside the grid | dental approximant |
| 𐑮 | `{roomen}` | outside the grid | tap, between dental and alveolar |

Across the labial, dental, palatal and velar columns, the deck's rows and columns line up with the grid's series and grades. Notably, the deck calls /t d/ **dental**, not alveolar, as Tolkien's first series does. Its alveolar row holds only /s z/, which are the sounds Tengwar writes outside the grid. The deck's postalveolar row is series III. That is why I read the layout as Tengwar-shaped.

### 4.2 Vowels

The tehta is a vowel *family*; the deck's hue is a vowel *quality*. Compare the groupings.

| Tehta (s2t) | Vowels it writes | Deck's hue grouping |
|---|---|---|
| `[dot-above]` | ɪ, iː (long on `{aara}`) | blue and light blue, one hue |
| `[left-curl]` | ʊ, uː | red and pale red, one hue |
| `[acute]` | ɛ, and eɪ (on `{anna}`) | blue-violet pair, but with /ɛ/ and "/e, eɪ/" |
| `[right-curl]` | ɒ, ɔː, oʊ (on `{vala}`), ɔɪ (on `{anna}`) | /ɔː/ and /o/ are an orange and tan pair; **/ɒ/ is magenta, grouped with /ɑː/** |
| `[triple-dot-above]` | æ, ɑː, aɪ, aʊ | **/æ/ is purple, /ɑː/ is pink, grouped with /ɒ/** |
| `[grave]` | ʌ, and ɜː (as ʌ plus r) | green pair: /ɜː/ and /ʌ/ |
| `[breve]` | ə | no category |

Most pairs agree. The one real difference is the low vowels: Tengwar gives /æ/ and /ɑː/ one mark (V-13, V-22), while the deck pairs /ɑː/ with /ɒ/.

### 4.3 Where the two systems disagree

1. **Sibilants.** The deck draws one **sibilant** class: /s z/ with /ʃ ʒ tʃ dʒ/. In Tengwar that class does not exist as a unit. /s z/ are `{silme}` and `{esse}`, outside the grid, and the rest are series III, with the affricates in grades 1 and 2. A sibilant view therefore spans the grid and the extras, and a Tengwar-native view would not show it.
2. **/hw/.** Series IV, grade 3 (`{hwesta}`) on the grid. Labial on the deck.
3. **/h/.** Outside the grid on the Tengwar side. The deck puts it in the velar row with a note.
4. **Low vowels.** As above.
5. **/l/ and /r/.** Outside the grid. The deck treats /l/ as dental and /r/ as a tap.

*I am not certain which of these you meant by Tolkien's sibilant groupings.* Item 1 is my guess. If you meant how Tolkien orders `{silme}`/`{esse}` against series III, or how English modes place /ʃ ʒ/, please say, because that sets which class model D4 should offer.

## 5. Attaching a spec to s2t's cells

s2t's IR is `Cell(base, marks)`, named in Tecendil literals. `render(text, fmt="literal")` and `translate_word(word)` expose it, and a style table can be keyed by **glyph name**, which is font-independent.

**Channels on one cell.** A cluster has four things to style: the base, the vowel mark(s), `[bar-above]` (nasal) and `[bar-below]` (gemination, G-01). Consonant features go to the base, vowel features to the marks, a nasal bar gets the nasal style. `{aara}` and `{telco}` are carriers for a vowel, so they take the vowel's style.

**The syllable and the cell do not line up.** V-01 puts a short vowel on the *next* consonant. Take *polite* from the spec's worked examples:

| | `{parma}` | `{lambe}[breve]` | `{anna}[triple-dot-above]` | `{tinco}` |
|---|---|---|---|---|
| Sounds | /p/ | /l/ and the /ə/ before it | /aɪ/ | /t/ |
| Syllable | 1 (onset) | base: 2 (onset); mark: **1** (nucleus) | 2 (nucleus) | 2 (coda) |

The breve belongs to syllable 1 and sits on the base of syllable 2. So a Tengwar cell can mix two syllables, and syllable-level styling would colour it wrongly. **Styling has to work per base and per mark.** This also matches the handoff's rule to render per word and map back to syllables.

**Consequences.**

- Style the **nucleus mark** (or `{aara}`, or the glide base of a diphthong) for stress, because P-03 means every syllable has a written nucleus. The deck's bold and italic cannot apply to a mark.
- A style layer must never change the glyph string (P-02). Styling is a separate layer over unchanged text.
- **Risk, not tested:** styling a combining mark separately from its base may break its placement in some browsers and fonts. This must be tested before the design relies on it. s2t has a font gate tool (`tools/font_gate.py`, ADR-0011) that may be extended for it.
- Whether Alcarin and FreeMono have bold and italic is unchecked. If they do not, weight cannot carry the three stress levels.

## 6. Philosophy, notation, data model, outputs

| Question | PMV | poetic-parser | shavian2tengwar |
|---|---|---|---|
| Phonemic or orthographic? | Phonetic categories over English spelling | Phonemic; Shavian in, spelling never used | Phonemic, rhotic RP baseline |
| What is a vowel? | 14 monophthongs, 4 diphthongs, no schwa | Each vowel letter is a nucleus; ligatures carry a hidden /r/ or /j/ | Every vowel written, schwa included (P-03); ligatures expand |
| Stress | Three levels; deck silent on who decides | Binary, `*` by the reader (ADR-0001) | Not modelled |
| Dialect | Several: /ɐɪ/ vs /aɪ/, tap /ɾ/, /o/ with an RP/GA note | One baseline | Same baseline |
| Aim | Show the sound pattern, every sound visible | Same, from the reader's scansion | Faithful Tengwar |

**Notation (ours).** `*` stressed, `.` manual split, `-` compound, `·` namer dot, blank line a stanza. Output: one cell per syllable, `×` or `/`, counts, end-rhyme letters, recurring stressed vowels coloured (up to six), alliteration arcs, echo arcs, a sound filter, a syllable table.

**Data model (ours).** Poem, stanza, line, word, syllable. A syllable has `letters`, `onset[]`, `nucleus`, vowel `key`, `coda[]`, `ipa`, `stressed`. Links are derived.

**Data model (deck, implied).** Letter spans with a phoneme and class, a per-syllable stress level, and a tie flag. No syllables, lines, rhyme or links.

**What integration would add.** `stress` as 0, 1 or 2; a `tie` relation; an optional per-line pattern if "break" is kept; and, for each sound, place, manner, voicing and Tengwar series and grade, so that class views and a Tengwar style table can be computed.

**Outputs.** The deck is static slides. We make an interactive page, with a meter strip of `×` and `/`. A Tengwar row would be a new output, rendered per word.

## 7. Sound inventory

The readings are the ones each source gives. "Ours" means `scansion.html`.

| Shavian | s2t | Ours | PMV |
|---|---|---|---|
| 𐑦 𐑧 𐑨 𐑪 𐑫 𐑳 | ɪ ɛ æ ɒ ʊ ʌ | same | same |
| 𐑰 𐑭 𐑷 𐑵 | iː ɑː ɔː uː | same | same |
| 𐑩 | ə | ə | no category |
| 𐑱 | eɪ | eɪ | one category with /e/ |
| 𐑴 | oʊ | oʊ | /o/, noted as RP əʊ or GA oʊ |
| 𐑲 | aɪ | aɪ | two: /aɪ/ and /ɐɪ/ (slides 2, 4) |
| 𐑬 𐑶 | aʊ ɔɪ | same | same |
| 𐑻 | ɜːr, written 𐑳𐑮 | ɜː plus hidden r, own key | /ɜː, əː/, no r |
| 𐑺 | ɛr, written 𐑧𐑮 | ɛ plus hidden r, key 𐑧 | /ɛə, ɛɚ/, own colour |
| 𐑸 𐑹 𐑽 𐑼 | vowel plus 𐑮 | vowel plus hidden r | no category |
| 𐑾 | ɪə, two vowels (L-08) | one vowel, one syllable | no category |
| 𐑿 | juː, 𐑘𐑵 | /j/ plus 𐑵 | no category |
| 𐑮 | r | r | /ɾ/ tap |
| 𐑣𐑢 | /ʍ/, one glyph (C-02) | two letters; alliterates as /h/ | /hw/, one sound |

## 8. Issues found while reading

Facts about current code or the source. None is fixed.

1. **𐑾 is one syllable in `scansion.html` and two vowels in s2t.** `AGENTS.md` says they must agree. s2t writes 𐑥𐑰𐑛𐑾 *media* as three vowels (spec §10); the page counts two syllables, so syllable counts and the `×`/`/` pattern differ.
2. **𐑣𐑢 alliterates as /h/ on our page.** It is in the onset list, so `onset[0]` is 𐑣, and *whip* pairs with *hat*, not *wed*. s2t and the deck both treat it as one sound.
3. **The handoff's 𐑺 note.** I confirmed the 𐑾 disagreement. For 𐑺, our page and s2t both read ɛ plus r; the deck differs. If a 𐑺 mismatch exists between the page and s2t, I did not find it.
4. **Our markup characters collide with s2t's punctuation.** s2t maps `.` to a full stop glyph and `-` to a section mark (U-01, U-04), strips `·` and passes `*` through. Markup must be stripped per word before calling s2t.
5. **Our 𐑻 shows as ɜː without the r** in the IPA readout, though it is counted as having one.
6. **The deck's hex table disagrees with its own swatches** (slide 4). /ŋ/ is labelled #005EFF but drawn purple; /hw/ #003082 but red; /ɾ/, /j/ and /h/ all carry #FFB100 but are drawn green, violet and magenta; /tʃ/ and /ʃ/ share a hex. The swatches follow slide 1's place logic; the labels look like copy errors. Ask the owner before copying any value.
7. **The vowel slide's "light/dark pairs for unvoiced/voiced"** looks carried over from the consonant slide. For vowels the pairing seems to mark lax against tense.

## 9. Decisions for Alex

Each has my proposal; none is applied. The first group is about the Tengwar fit and is new.

**D1. Class model for views and matching.** The Tengwar grid (series and grades), the modern place, manner and sibilant model, or both?
Proposal: both, as separate views. Matching stays exact by default. Needs your answer on the sibilant question in section 4.3.

**D2. Where the two disagree** (/hw/, /h/, low vowels, sibilants).
Proposal: on a Tengwar view follow the Tengwar grid and the tehta families; on a phonetic view follow the deck's classes. Say so in the spec, so a disagreement is a choice, not a bug.

**D3. What we borrow from the deck.** Its feature-to-channel assignment, its box styles, its hex values?
Proposal: borrow the assignment (place or series is hue, voicing is brightness, vowel family is hue, length is lightness). Skip box styles on Tengwar, where shape already carries manner. Pick our own palette and check contrast and colour-blind safety. Settle the hex inconsistencies first (section 8, item 6); ADR-0005 says to follow the swatches and place logic and record each choice.

**D4. Who owns the table of features.** A table giving each s2t glyph its series, grade, voicing and class.
Proposal: keep it in poetic-parser, keyed by glyph name, and test it against s2t's spec tables, as s2t already does for encodings. If you would rather s2t expose it, that is a spec-first change in s2t, through its own process.

**D5. How to style cells.** Per base and per mark, per cell, or per syllable?
Proposal: per base and per mark, since cells straddle syllables (section 5). First test whether marks styled separately keep their placement in Alcarin and FreeMono, using the font gate approach.

**D6. How stress shows on Tengwar.** On the nucleus mark or carrier, or in a strip above the line?
Proposal: style the nucleus and also draw the strip. Check whether either font has bold and italic before relying on weight.

**D7. Stress scale.** Keep binary or add secondary?
Proposal: add an optional secondary level. It costs one new marker, keeps ADR-0001, and the deck's sample scansions use it. You choose the syntax; `*`, `.`, `-` and `·` are taken.

**D8. Ties.** The deck shows them but never defines them.
Proposal: ask the owner what they mean before designing anything.

**D9. "Break in pattern".** It needs an expected pattern, which ADR-0001 says we do not infer.
Proposal: allow an optional declared pattern per stanza or line, and mark deviations; without one, show no breaks.

**D10. Phonetic detail** (/ɐɪ/, tap /ɾ/).
Proposal: no. Shavian has one letter for each, so we cannot derive the difference. Allow a per-syllable override if you want it.

**D11. R-vowels and assonance.** Our README says 𐑺 assonates with 𐑧𐑮; the deck gives /ɛə/ its own colour.
Proposal: keep ours. s2t writes 𐑺 as `{roomen}[acute]`, a glyph with no place for a separate /ɛə/ colour. Say so in the README.

**D12. /hw/ on our page.** One sound as in s2t C-02, or two letters?
Proposal: one sound, with an option to treat it as /w/ for readers who do not distinguish them. Needs an ADR.

**D13. 𐑾 on our page.** Two nuclei as s2t, or one?
Proposal: follow s2t L-08, since the spec is the authority. Needs an ADR; it changes syllable counts.

**D14. Shared tables.** A Python package that imports s2t's tables, or a separate copy in the page?
Proposal: decide after D12 and D13, the two cases where the tables drift. Already open in the handoff.

**D15. English-spelled input.** The deck's way of working.
Proposal: no. It needs letter-to-sound alignment that Shavian removes. If wanted, go English to Shavian first.

**D16. Layered app with an interactive stress editor.**
Proposal: treat each dimension as a toggleable layer over one shared analysis (stress; vowels; consonants by class; end rhyme; alliteration; Tengwar row). Let the reader click a syllable to set its stress, cycling none, primary, secondary. The click writes `*` markup back into the source text, so the text stays the single source of truth and ADR-0001 holds. Layers read the analysis; they never change it.

**D17. Permission and credit.** *Resolved.* Alex: the owner shared the scheme so the community would align on it. It is a first-class built-in scheme, credited to its author (ADR-0005). The PDF stays uncommitted until Alex says otherwise.

## 10. Not done, deliberately

- No code, ADRs, roadmap entries or project folders were created or changed. The `AGENTS.md` workflow (a project folder with README, TASKS and LOG) can start with Phase 2.
- No Tengwar row was built. When it is, it renders per word through `s2t.render` or `s2t.translate_word`.
- Nothing about rendering marks separately was tested; it is a risk, not a finding.
