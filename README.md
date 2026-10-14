# poetic-parser

Tools for seeing the sound of a poem: its meter, rhymes, assonance and alliteration. Poems are written in
Shavian, so every letter is a sound and English spelling never gets in the way.

## Scansion score

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

### Markup

| Mark | Meaning | Example |
|---|---|---|
| `*` | the next syllable is stressed; works mid-word | `𐑩𐑐*𐑪𐑯` |
| `.` | split syllables by hand where the automatic split is wrong | `𐑤𐑳𐑝.𐑤𐑦` |
| `-` | joins a compound; it stays one word | `*·𐑧𐑤𐑝𐑩𐑯-*𐑥𐑱𐑛` |
| `·` | namer dot; shown, not sounded | `*·𐑥𐑱` |

A blank line separates stanzas. Punctuation and apostrophes are shown but not sounded.

### How it hears the text

- Syllables are split around each vowel letter; consonants between vowels go to the next syllable when
  they form an English onset (𐑕𐑑, 𐑐𐑮, ...), otherwise one goes to the next syllable and the rest stay.
- Ligatures carry a hidden consonant: 𐑸 𐑹 𐑺 𐑽 𐑻 𐑼 are a vowel plus /r/, and 𐑿 is /j/ plus 𐑵. The
  vowel part is what counts for assonance, so 𐑺 rhymes and assonates with 𐑧𐑮.
- The one-letter words 𐑞 𐑝 𐑯 𐑑 𐑓 are sounded as their weak forms (/ðə/, /əv/, /ənd/, /tə/, /fər/), or
  their strong forms when marked `*`.
- An /st/ or /sp/ opening alliterates with plain /s/.

## Earlier prototype

`syllabifier.py`, `design-doc.md`, `decisions.md`, `diagram.md` and `out.json` are the first attempt,
which tried to infer stress automatically. Known bugs there: 𐑬 is missing from the vowel lists, 𐑼 counts
as a full (stressed) vowel, and every syllable with a full vowel is marked stressed.
