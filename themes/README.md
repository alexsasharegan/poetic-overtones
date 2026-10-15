# Themes

Built-in themes: plain CSS over the analysis mirror (`spec/format.md` S-03 to S-09). A document uses one
with `<style name="..." src="theme.css"/>` next to it, or with the CSS inline.

## Community theme (`community.css`)

Encodes *Phonetic Markup for Verse* v3.0 (ADR-0005). Credit goes to the scheme's author; the wording is to
be agreed, so no name is written here yet. The deck stays private in `sources/community/`.
`community-demo.pxml` shows it on two lines of a public-domain poem; open it in the app (Sample menu).

### How a document has to be marked

| Role | Tier kind | Sets | Tags the theme reads |
|---|---|---|---|
| `consonant` | label | one set per sound | `sound:<name>` (colour), `manner:<plosive, affricate, fricative, nasal, approximant>` (border) |
| `vowel` | label | one set per vowel or diphthong | `sound:<name>` |
| `stress` | label | sets keyed `primary`, `secondary`, `unstressed` | the `key` (as `english.stress` uses) |

`place:`, `voiced:` and `sibilant:` tags are worth adding too (the demo does): the theme does not need them,
but filters and other themes can use them.

### Sound names

Tags allow only ASCII, so sounds have short names, mostly ARPAbet in lower case.

| Name | IPA | Deck example | Name | IPA | Deck example |
|---|---|---|---|---|---|
| `p` | /p/ | pearl | `s` | /s/ | sail |
| `b` | /b/ | Bree | `z` | /z/ | zero |
| `t` | /t/ | tale | `sh` | /ʃ/ | shadow |
| `d` | /d/ | dwarf | `zh` | /ʒ/ | genre |
| `k` | /k/ | king | `m` | /m/ | man |
| `g` | /g/ | gold | `n` | /n/ | nine |
| `ch` | /tʃ/ | chain | `ng` | /ŋ/ | sing |
| `jh` | /dʒ/ | jewel | `hw` | /hw/ | whip |
| `f` | /f/ | forge | `w` | /w/ | wet |
| `v` | /v/ | voice | `l` | /l/ | lore |
| `th` | /θ/ | Thingol | `r` | /ɾ/ | ring |
| `dh` | /ð/ | there | `y` | /j/ | yore |
| | | | `h` | /h/ | helm |
| `iy` | /iː/ | deep | `uw` | /uː/ | dûm |
| `ih` | /ɪ/ | hilt | `uh` | /ʊ/ | book |
| `ey` | /e, eɪ/ | grey | `ow` | /o/ | stone |
| `eir` | /ɛə, ɛɚ/ | fair | `ao` | /ɔː/ | saw |
| `eh` | /ɛ/ | elf | `oh` | /ɒ/ | beyond |
| `ae` | /æ/ | axe | `aa` | /ɑː/ | father |
| `er` | /ɜː, əː/ | bird | `ay` | /aɪ/ | ride |
| `ah` | /ʌ/ | struck | `ay2` | /ɐɪ/ | write |
| | | | `oy` | /ɔɪ/ | voice |
| | | | `aw` | /aʊ/ | crown |

### Choices made where the deck disagrees with itself

ADR-0005: follow the swatch and the deck's own place logic, and record each choice. All are worth
confirming with the author.

| Sound | Hex label in the deck | Swatch | Used | Why |
|---|---|---|---|---|
| /ŋ/ | #005EFF | purple | #540081 | velar, voiced (as /g/) |
| /hw/ | #003082 | red | #FF0910 | labial, voiceless (as /f/) |
| /w/ | #FF0910 | dark red | #820002 | labial, voiced (as /v/) |
| /l/ | #820002 | gold | #7F5500 | dental, voiced (as /ð/) |
| /ɾ/ | #FFB100 | green | #006507 | alveolar, voiced (as /z/) |
| /j/ | #FFB100 | blue | #002F7F | postalveolar, voiced (as /ʒ/) |
| /h/ | #FFB100 | pink | #A600FF | the deck puts it in the velar row; voiceless (as /k/) |
| secondary stress | slide 3: bold/italic; slide 4: italic | | bold italic | slide 3 is the stress slide |

The /ŋ/ /hw/ /w/ /l/ labels repeat the /tʃ/ /dʒ/ /f/ /v/ labels of the column beside them, which looks like a
copying slip. /tʃ/ and /ʃ/ share #005EFF on purpose (same place; manner is the border), so they stay shared.

### Approximations and gaps

* **Rough borders.** The deck draws plosives and nasals with brush strokes CSS cannot draw; they are solid here,
  at the deck's widths (4pt, 5pt) and corners (0, 4pt).
* **Not encoded yet:** the meter strip (bars per syllable), ties, "break in pattern" and the grouped views
  (by place, manner, sibilant). They are marks and views, not styles of a span; they wait for the "marks"
  channels (`spec/app.md` Y-03) and for views.
* **No schwa.** The deck has no colour for an unstressed schwa, so it is left unmarked.
* **Overlap.** Box borders take no room, so a thick border can touch the next letter.
