# Text Form Spec (draft)

This document defines the **text form** of `spec/app.md` (F-02, F-05, F-06): the plain-text serialisation
of a document, a tier definition or a scheme. It is the share layer. It names no programming language.

Every rule here is `PROVISIONAL` or `OPEN`. This is a first shape for Alex to react to, not a decision. The
alternatives and the prior art behind it are in `docs/synthesis/format-options.md`. The working extension
`.tiers` is a placeholder (FQ3).

## 0. Conventions

Statuses are as in `spec/app.md`: `ADOPTED`, `PROVISIONAL`, `OPEN`. An agent never promotes one.

| Prefix | Section |
|---|---|
| B | Blocks and fences |
| D | The document block and tier lines |
| M | Marks: the text with a tier's tokens marked |
| V | Value tables: label sets, labels, links |
| C | Schemes |
| I | Import and export |

## 1. Shape in one example

A file is a list of **blocks**, in the style of a Vue or Svelte single-file component: one block for the
input text, one for each tier's markup, one for tier metadata, one for styles. The input text stays
undistorted in its own block. Each tier has its own marked copy of the text, so tiers overlap freely
without any markup getting in each other's way.

```text
%tiers 1

~~~document
title: Sonnet 18, opening lines (public domain)
language: en
scheme: demo
view: words syllables stress feet rhyme

tier words     segmentation "Words"      provider=english.word@1
tier syllables segmentation "Syllables"  provider=english.syllable@1 reads=words
tier stress    label        "Stress"     provider=english.stress@1 reads=syllables target=syllables labels=stress3
tier feet      segmentation "Feet"
tier sounds    segmentation "Sounds"
tier phonemes  label        "Phonemes"   target=sounds labels=phonemes
tier rhyme     relation     "Rhyme"      labels=relations
~~~

~~~text
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
~~~

~~~labelset stress3
primary    "Primary stress"
secondary  "Secondary stress"
none       "Unstressed"
~~~

~~~labelset phonemes
sh  "ʃ"   place:postalveolar manner:fricative voiced:false
ei  "eɪ"  class:vowel
k   "k"   place:velar manner:plosive voiced:false
~~~

~~~labelset relations
rhyme         "Rhyme"
alliteration  "Alliteration"
~~~

~~~marks words
[Shall]{w1} [I]{w2} [compare]{w3} [thee]{w4} [to]{w5} [a]{w6} [summer's]{w7} [day]{w8}?
[Thou]{w9} [art]{w10} [more]{w11} [lovely]{w12} [and]{w13} [more]{w14} [temperate]{w15}:
[Rough]{w16} [winds]{w17} [do]{w18} [shake]{w19} [the]{w20} [darling]{w21} [buds]{w22} [of]{w23} [May]{w24},
~~~

~~~marks syllables
Shall I [com]{s1}[pare]{s2} thee to a [sum]{s3}[mer's]{s4} [day]{s5!}?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
~~~

~~~labels stress
s2 = primary
s3 = primary
s5 = primary !
~~~

~~~marks feet
[Shall I]{f1} [compare]{f2} [thee to]{f3} [a sum]{f4}[mer's day]{f5}?
Thou art more lovely and more temperate:
Rough winds do shake the darling buds of May,
~~~

~~~marks sounds
Shall I compare thee to a summer's day?
Thou art more lovely and more temperate:
Rough winds do [sh]{p1}[a]{p2}[k]{p3}[e]{p2} the darling buds of May,
~~~

~~~labels phonemes
p1 = sh
p2 = ei
p3 = k
~~~

~~~links rhyme
rhyme: w8 w24
~~~

~~~scheme demo
name: Demo scheme
credit: written for this example

words                   { underline: dotted #8a909c }
syllables               { border-style: solid; border-colour: #5d6370 }
stress/primary          { weight: bold }
feet                    { fill-colour: #6250d6; fill-opacity: 15% }
tag(place:postalveolar) { border-colour: #2a78d6 }
tag(place:velar)        { border-colour: #a600ff }
rhyme/rhyme             { arc-colour: #6250d6; arc-width: 2px }
~~~
```

What the example shows:

- `words` tokens every word. `syllables` and `sounds` cover only part of the text; the rest is untokenised.
- `feet` crosses word and syllable boundaries ("a sum"), which a single inline markup could not do.
- In `sounds`, the token `p2` has two pieces (`a` and `e`), the split digraph of *shake*. It is one token
  with two ranges (S-02).
- `{s5!}` and `s5 = primary !` mark human edits in tiers whose other items came from a provider (E-06).
- `rhyme: w8 w24` links *day* and *May* in a relation tier, across lines.
- `tag(place:velar)` styles every phoneme whose label set value has that tag (Y-04).

## 2. Blocks

| ID | Rule | Status |
|---|---|---|
| B-01 | A file is plain text made of **blocks**. Text outside blocks is ignored, so notes can sit between them. | PROVISIONAL |
| B-02 | The first line is `%tiers 1`: the format name and its version. | PROVISIONAL |
| B-03 | A block opens with a **fence** line: three or more `~`, then the block type, then arguments, separated by spaces. It closes with a line of exactly the same number of `~` and nothing else. An exporter picks a fence longer than any run of `~` at the start of a body line (at least three). | PROVISIONAL |
| B-04 | The body of a `text` or `marks` block is verbatim: nothing is trimmed and there are no comments. In every other block, blank lines are ignored and a line that starts with `#` is a comment. | PROVISIONAL |
| B-05 | The block types are in the table below. | PROVISIONAL |
| B-06 | The file is UTF-8 with LF line ends. An importer accepts CRLF and converts it (FQ2). | PROVISIONAL |
| B-07 | `text` is required in a document file. A file with no `text` block is a definitions file: tier lines, label sets and schemes (F-01). Any other combination of blocks is allowed. | PROVISIONAL |
| B-08 | Fields on a line are separated by one or more spaces, so columns can be aligned. | PROVISIONAL |

| Block | Arguments | Body | Count |
|---|---|---|---|
| `document` | none | `key: value` lines, then tier lines (section 3) | at most one |
| `text` | none | the input text, verbatim | one per document file |
| `labelset` | label set id | one value per line (V-01) | any |
| `marks` | tier id | the text with that tier's tokens marked (section 4) | one per segmentation tier |
| `labels` | tier id | one label per line (V-02) | one per label tier |
| `links` | tier id | one relation per line (V-03) | one per relation tier |
| `scheme` | scheme id | header lines, then style rules (section 6) | any |
| `x-<name>` | free | free: reserved for extensions | any |

## 3. The document block and tier lines

| ID | Rule | Status |
|---|---|---|
| D-01 | The `document` body starts with `key: value` lines. Keys: `title`, `language` (a BCP 47 tag), `scheme` (the active scheme id) and `view` (the visible tier ids, in drawing order). Unknown keys are kept. | PROVISIONAL |
| D-02 | A **tier line** is `tier <id> <kind> "<name>" key=value ...`. The kind is `segmentation`, `label` or `relation`. The order of tier lines is the order of the tiers (T-05). | PROVISIONAL |
| D-03 | Tier line keys: `provider=<id>@<version>` (E-01); `reads=<tier ids, comma separated>` (E-02); `target=<tier id>` for a label tier (T-03); `labels=<label set id>` for a label or relation tier; `parent=<tier id>` for the editing hint (S-06). | PROVISIONAL |
| D-04 | An id starts with a letter and holds letters, digits, `-`, `_` and `.`. Tier, label set and scheme ids are unique among their own kind. Token ids are unique in the whole document (S-04). | PROVISIONAL |
| D-05 | In a quoted name, `\"` is a quote and `\\` is a backslash. | PROVISIONAL |

## 4. Marks

| ID | Rule | Status |
|---|---|---|
| M-01 | `marks <tier-id>` holds the full text with that tier's tokens marked. Without the markup it must equal the `text` block exactly (I-01). A missing block means an empty tier. | PROVISIONAL |
| M-02 | A **piece** is `[` text `]`, optionally followed by `{` ids `}`. The ids are separated by spaces and name tokens of this tier. A token's pieces together are its span. A token whose pieces are apart is discontinuous (S-02). A piece with several ids belongs to several tokens, which is how tokens overlap inside one tier. | PROVISIONAL |
| M-03 | Pieces do not nest, and a character is in at most one piece. | PROVISIONAL |
| M-04 | A piece with no `{...}` is an anonymous token and gets an id on import. An exporter always writes ids. | PROVISIONAL |
| M-05 | In a `marks` body, a `[`, `]`, `{`, `}` or `\` that belongs to the text is written `\[`, `\]`, `\{`, `\}` or `\\`. | PROVISIONAL |
| M-06 | An id followed by `!` says a human made or changed that token, in a tier that has a provider (E-06). In a tier with no provider every token is human, and `!` is not needed. | PROVISIONAL |
| M-07 | Text outside any piece is untokenised in this tier (S-05). The body still holds all of the text. | PROVISIONAL |

## 5. Value tables

| ID | Rule | Status |
|---|---|---|
| V-01 | A `labelset` body has one value per line: `<value-id> "<name>" <tag>:<value> ...`. The order is the order of the set (T-07). | PROVISIONAL |
| V-02 | A `labels` body has one label per line: `<token-id> = <value-id>`, then an optional `!` for a human label. The token belongs to the tier's target tier. | PROVISIONAL |
| V-03 | A `links` body has one relation per line: `<type-id>: <token-id> <token-id> ...`. In a directed relation the tokens are separated by `->`. An optional `!` ends a human relation. Token ids can come from any tier. | PROVISIONAL |
| V-04 | A reference to an id that does not exist is an **orphan** (E-08). It is kept on import, flagged in the application and written back on export. | PROVISIONAL |

## 6. Schemes

| ID | Rule | Status |
|---|---|---|
| C-01 | A `scheme` body starts with `key: value` lines (`name`, `credit`), then a blank line, then style rules in a CSS-like syntax. | PROVISIONAL |
| C-02 | A rule is `<selector> { <channel>: <value>; ... }`. Selectors: `<tier-id>` (every token of the tier), `<tier-id>/<value-id>` (the tokens, or the relations, with that value), and `tag(<tag>:<value>)`. | PROVISIONAL |
| C-03 | Channel names come from the application's registry (Y-02). Unknown channels are kept and not drawn. | PROVISIONAL |
| C-04 | A value may adjust instead of set, such as `lighten(-50%)` (Y-04). The list of functions is not decided. | OPEN |
| C-05 | A built-in scheme must have a `credit` line (Y-08). | PROVISIONAL |

## 7. Import and export

| ID | Rule | Status |
|---|---|---|
| I-01 | On import, each `marks` body is stripped of markup and compared with the `text` block. A difference is an error that names the block and the first line that differs. | PROVISIONAL |
| I-02 | Importing an export gives back the same document, with ids, origins, orphans and view (F-05). | PROVISIONAL |
| I-03 | Errors carry line numbers. Import never drops content silently (F-05). | PROVISIONAL |
| I-04 | Export order is fixed: the first line, `document`, `text`, label sets, then each tier's body block in tier order, then schemes. Inside a body, items follow text position, then id. That keeps diffs small. | PROVISIONAL |
| I-05 | Unknown block types and keys are kept and written back unchanged. | PROVISIONAL |
| I-06 | Opening a file never runs code (F-07). | PROVISIONAL |

## 8. Open questions

| ID | Question | Current default |
|---|---|---|
| FQ1 | Should every `marks` block repeat the whole text? | Yes (M-01). A line range per block is a later option for long texts |
| FQ2 | S-01 says the text is not normalised. Do line endings count? | Line endings become LF when the text enters the input editor |
| FQ3 | What are the file extension and format name? | `.tiers` and `tiers`, as placeholders |
| FQ4 | How far should the scheme syntax follow CSS? | Rules only: no variables, nesting or cascade yet |
| FQ5 | Is backslash the right escape for marks bodies? | Yes (M-05); the only characters escaped are `[`, `]`, `{`, `}` and `\` |
| FQ6 | One file or several for large documents? | One file. Definitions files can be shared (B-07) |
| FQ7 | A formal grammar (EBNF) and conformance fixtures? | After the shape is agreed (F-04) |
