# English standard providers

Status: ADOPTED on 2026-10-24, apart from the open items named below. English is the baseline reference language (app.md); these are the first providers and
the first test of the span-reuse rule (app.md E-08). The general contract is in `contract.md`.

Provider ids (form still open, format.md FQ8): `text.line`, `text.stanza`, `english.word`, `english.syllable`,
`english.stress`. The first two are language-neutral. `english.sound` is deferred (section 6).

## 1. Language-neutral: `text.line@1`, `text.stanza@1`

| ID | Rule | Fixture |
|----|------|---------|
| E-01 | Set `line`: one member per non-blank line. The piece runs from the first to the last non-whitespace character; leading and trailing whitespace is outside. Line ends are LF (the loader already normalised them). | p01 |
| E-02 | Set `stanza`: one member per run of consecutive non-blank lines. The piece runs from the start of the first line's text to the end of the last line's text, so it includes the line breaks between them. A line containing only whitespace is blank. | p01 |
| E-03 | Neither provider reads any tier. Blank lines belong to no member. | p01 |

## 2. `english.word@1` (reads nothing). Set `word`

| ID | Rule | Fixture |
|----|------|---------|
| E-10 | A **word** is a maximal run of characters in Unicode categories L, M or N. | p02 |
| E-11 | An apostrophe (`'` or `’`) or hyphen (`-` or `‐`) **inside** a run, with a word character on both sides, is part of the word. So `summer's`, `don’t`, `moon-light` are each one word. | p02, p05 |
| E-12 | An apostrophe or hyphen at the start or end of a run is not part of the word (so a leading apostrophe, as in `'tis`, is dropped from the word; documented limitation). | p02 |
| E-13 | Hyphenated words are **single words**, not two (Alex's decision). A hyphenated word is never split into parts at this tier. | p05 |
| E-14 | Digits are word characters, so `1999` is a word. It will be unknown to the syllable provider (E-21). | p02 |

## 3. `english.syllable@1` (reads `english.word`). Sets `syllable`, `unknown`

| ID | Rule | Fixture |
|----|------|---------|
| E-20 | For each word, look it up in the lexicon (contract.md section 3). If found, the first variant's syllables are cut from the word using the letters given, one member in `syllable` per syllable. | p03 |
| E-21 | A word with no usable entry is **not guessed**: it is added to `unknown` (as a member equal to the word's span) and gets no syllables. | p04 |
| E-22 | A hyphenated word with no whole-word entry is tried **part by part**; if every part is found, the syllables are the concatenation. If any part is missing, the whole word is unknown. | p05 |
| E-23 | Syllable pieces are contiguous within the word and may be hand-edited afterwards; a hand-edited syllable tier is a legitimate input to later providers (E-32). | p06 |

## 4. `english.stress@1` (reads `english.word`, `english.syllable`). Sets `primary`, `secondary`, `unstressed`, `check`, `unmarked`

| ID | Rule | Fixture |
|----|------|---------|
| E-30 | Each syllable of a known word goes into `primary`, `secondary` or `unstressed` according to the stress in the first variant (1, 2, 0). A one-syllable word is stressed as the lexicon says; the provider does not demote function words. | p03 |
| E-31 | If any later variant of the word differs in stress from the first, the **word** is added to `check` ("other readings exist"). The first variant is still used for the syllables. | p04 |
| E-32 | The provider matches the syllables **inside the word's span** (from the `syllable` set of the tier read) against the lexicon entry by count. If the counts differ (for example the user re-cut the syllables), none of the word's syllables is classified; they are added to `unmarked`. | p06 |
| E-33 | Unknown words (E-21) get no stress and appear in no stress set. | p04 |
| E-34 | Every set the provider owns exists in the tier even when empty. | p04 |

## 5. Roles and tags

Each provider gives the tier it fills a role (format.md A-13), so themes find it without knowing ids:
`text.line` → `line`, `text.stanza` → `stanza`, `english.word` → `word`, `english.syllable` → `syllable`,
`english.stress` → `stress`. The runner checks it.

Sets carry tags so a theme can style them by meaning: stress sets use `stress:primary`, `stress:secondary`,
`stress:unstressed`; gap sets use `status:unknown`, `status:check`, `status:unmarked`. A theme can equally select
by `key` (`tier[role="stress"] > set[key="primary"]`). Tags are ADOPTED. The runner does not compare tags or names.

## 6. Deferred: `english.sound`

A sound tier (phonemes and graphemes aligned to them) needs a grapheme-aligned lexicon that CMUdict does not give.
It waits for a lexicon-builder step and is OPEN. A syllable's IPA is in the lexicon but is not yet exposed in any set.

## 7. Known limits

* Leading-apostrophe words (`'tis`) lose the apostrophe (E-12).
* No heteronym disambiguation: the first variant wins, and `check` flags the disagreement (E-31).
* Capitalised proper nouns not in the lexicon are unknown, deliberately (`contract.md` C-06).
