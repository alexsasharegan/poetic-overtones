# Provider contract

Status: PROVISIONAL (everything here is new; none of it is ADOPTED until Alex says so).
Authority: `spec/app.md` E-01..E-09, `spec/format.md` section on tiers, sets and spans.
Fixtures: `spec/providers/fixtures/`. Reference code: `reference.py`. Runner: `run.py`.

A **provider** produces the contents of a tier. It is how "standard" tiers (words, syllables, stress)
get filled in, and it follows the same contract as a provider written by a user or an extension (X-05).

## 1. Rules

| ID | Rule | Status |
|----|------|--------|
| C-01 | A provider is a **pure function**: the input text, the contents of the tiers it reads, and a lexicon go in; the members of each set it owns come out. Same input, same output. No clock, no randomness, no network. | PROVISIONAL |
| C-02 | A provider **owns sets**, named by `key` (format.md). A tier with `provider="name@int"` lists the sets it owns with a `key` each. Sets without a `key` belong to the user and a reset never touches them. | PROVISIONAL |
| C-03 | A **member** is a list of pieces; a piece is a `(start, end)` pair of code point offsets in the input text (end exclusive). Pieces of one member do not overlap and are in text order. Members of a set are in text order (by first piece) unless the set is a directed relation. | PROVISIONAL |
| C-04 | `reads` on the tier names the tiers whose contents the provider needs. A provider never looks at any tier it does not read. A missing input tier is an error in the application, not something the provider works around. | PROVISIONAL |
| C-05 | **Reset** recomputes every keyed set and replaces its member list (app.md E-03). A set the provider owns but finds empty stays in the tier with `members=""`. Reuse of existing span ids follows app.md E-08: a member with the same pieces as an existing span keeps that span's id. | PROVISIONAL |
| C-06 | **Don't guess.** When the provider lacks the data to decide, it says so in a set (see english.md `unknown`, `check`, `unmarked`) instead of inventing an answer. A wrong silent guess is worse than a visible gap. | PROVISIONAL |
| C-07 | The **lexicon** is data, not code. The provider contract fixes the lexicon format (section 3); which dictionary fills it is a packaging decision, kept out of the spec so tests do not depend on any licensed word list. | PROVISIONAL |
| C-08 | A provider has an id and an integer version, written `name@int`. Output may change between versions; the version in the file says which one produced it. The exact form of the id is open (format.md FQ8). | OPEN |

## 2. Conformance: reset equality

A provider fixture is an ordinary `.pxml` document with the provider tiers **already filled in**, plus an
`<x-lexicon>` block holding the lexicon the provider is allowed to use.

The runner (`run.py`):

1. loads the document with the reference loader;
2. for every tier with a `provider`, recomputes each keyed set from the text, the tiers it reads and the lexicon;
3. compares the result with the file **by position**: for each set, the pieces of each member, in order. Ids and names are opaque and never compared.

A conformant implementation passes if it gets the same member positions for every fixture. The
fixtures are the spec; the prose and `reference.py` explain them.

**Hand-made inputs.** A tier without a provider may carry `x-as="<provider id>"`. It then stands in as that
provider's output for the tiers read by later providers. Fixture p06 uses this to show what the stress provider does
when the user has re-cut the syllables by hand.

**Running.** `python3 -I spec/providers/run.py` (all fixtures) or `python3 -I spec/providers/run.py FILE.pxml`.
The runner also fails a fixture whose `reads` lacks a tier the provider needs, or whose set keys differ from the provider's keys.

## 3. Lexicon format

Inside `<x-lexicon>` (and in any packaged lexicon file), one entry per line:

```
word<TAB>letters|ipa|stress letters|ipa|stress ...
```

* `word`: the headword as written.
* each syllable: the **letters** it covers in the word (so the syllable pieces can be cut out of the text), its IPA, and stress `0` unstressed, `1` primary, `2` secondary.
* Concatenating the letters of all syllables, after the lookup normalisation below, must give the word. An entry that does not is treated as absent (C-06 applies).
* Blank lines and lines starting with `#` are ignored.
* A word may appear on several lines: these are **variants**. The first is the one used. If a later variant differs in stress, the word is flagged (english.md E-30).
* **Lookup key**: the word with `’` read as `'`, `‐` read as `-`, and simple one-to-one lower-casing (a character whose lower-case form is not one character is left alone).

## 4. Licence notes (informational)

Real lexicons that could fill this format, and what they require:

* CMUdict: BSD 2-clause. ARPAbet phones with stress digits 0/1/2, variants as `WORD(1)`. It has no letter-to-syllable alignment; building one is a separate, offline lexicon-builder step.
* ReadLex (shavian.info): CC BY-SA 4.0, which is share-alike. Anything derived from it carries the same licence, so it cannot be mixed silently into a differently-licensed data file.

Neither is bundled by this spec. Fixtures use small hand-written lexicons.
