# Text Form Spec (draft)

This document defines the **text form** of `spec/app.md` (F-02, F-05, F-06): the plain-text serialisation of
a document. It is the share layer. It names no programming language. The working file extension is `.pxml`
("poetic XML": a small subset and dialect of XML, in the way `.jsx` relates to `.js`).

**The fixtures in `spec/fixtures/` are part of this spec.** Each rule below cites the cases that pin it
down. If a rule and a fixture disagree, one of them is wrong and must be fixed, not ignored. Run
`python3 -I spec/fixtures/check.py`. The checker there is a reference, not the implementation.

## 0. Conventions

Statuses are as in `spec/app.md`: `ADOPTED` (Alex decided it, chat of 2026-10-14), `PROVISIONAL` (an agent's
default), `OPEN`. An agent never promotes one on its own judgment.

| Prefix | Section |
|---|---|
| B | The file and its blocks |
| T | The text block |
| M | The markup block: spans |
| A | The analysis block: tiers and sets |
| S | The style block |
| I | Import and export |

Model in one line: a **tier** (a dimension) holds **sets**; a **set** lists **spans** by id; a **span** is a
stretch of the input text. Every id in a file is unique.

## 1. Shape in one example

A file is a list of blocks, side by side, in the manner of a Vue single-file component: the input text, the
text with spans marked, the analysis, and the styles. (This is fixture `01-basic`, without its comments.)

```xml
<meta title="Twinkle, Twinkle, Little Star" author="Jane Taylor" year="1806" language="en"/>

<text>
Twinkle, twinkle, little star,
How I wonder what you are!
Up above the world so high,
Like a diamond in the sky.
</text>

<markup>
  <span id="1">Twinkle, twinkle, little st<span id="5">ar</span>,</span>
  <span id="2">How I wonder what you <span id="6">are</span>!</span>
  <span id="3">Up above the world so h<span id="7">igh</span>,</span>
  <span id="4">Like a diamond in the sk<span id="8">y</span>.</span>
</markup>

<analysis>
  <tier id="t1" name="Rhyme scheme" role="rhyme-scheme">
    <set id="s1" name="A" members="1,2"/>
    <set id="s2" name="B" members="3,4"/>
  </tier>
  <tier id="t2" name="Rhyme" kind="relation" role="rhyme">
    <set id="s3" name="A" members="5,6"/>
    <set id="s4" name="B" members="7,8"/>
  </tier>
</analysis>

<style>
  tier[role="rhyme-scheme"] > set:nth-child(1) { background: #fdebd0; }
  tier[role="rhyme-scheme"] > set:nth-child(2) { background: #d6e9ff; }
  tier[role="rhyme"] > set:nth-child(1) { color: #b3261e; font-weight: 700; }
  tier[role="rhyme"] > set:nth-child(2) { color: #1b5fa8; font-weight: 700; }
</style>
```

- `text` is the input text, exactly as given.
- `markup` is the same text with bare, id'd `<span>`s. It says where things are and nothing about what they
  mean.
- `analysis` says what they mean. A set such as rhyme "A" lists the spans that belong to it. A span can be in
  any number of sets in any number of tiers, so tiers overlap freely and no hierarchy is implied.
- `style` is plain CSS. It styles the **analysis**, not the text: it picks tiers by `role` and sets by
  position, key or tags, and the application paints each set's style onto its spans (section 6).

## 2. The file and its blocks (B)

| ID | Rule | Status | Cases |
|---|---|---|---|
| B-01 | A file is UTF-8 text. A leading byte order mark is ignored. | PROVISIONAL | 10 |
| B-02 | The syntax is **XML 1.0**, well-formed, not HTML5. Empty elements are written JSX-style as self-closing tags, `<tag ... />`; a tag without the slash expects its end tag. A file that is not well-formed is rejected. | ADOPTED | e02 |
| B-03 | Blocks are **siblings at the top level**, as in a Vue component. No enclosing element is needed: a loader wraps the file in a `<pxml>` element before parsing (it adds no line break, so error line numbers are unchanged). A file may instead have an explicit `<pxml>` root, with an optional XML declaration. Both forms mean the same. There is no DOCTYPE: a loader rejects one. | PROVISIONAL | 01, 12, e30 |
| B-04 | The blocks are `meta` (at most one, attributes only), `text` (exactly one), `markup` (exactly one), `analysis` (at most one) and `style` (any number). A block whose name starts with `x-` belongs to an extension and is kept without a warning. Any other block is kept and reported. | PROVISIONAL | e09 |
| B-05 | **CDATA sections are not part of the format.** A loader rejects `<![CDATA[`. Escape instead, or keep the text in a file and reference it (T-04). | ADOPTED | 09, e15 |
| B-06 | Only the five XML named entities exist (`&lt; &gt; &amp; &quot; &apos;`). Any other character is written literally or as a numeric reference (`&#x2019;`). HTML names such as `&nbsp;` are errors. | ADOPTED | 09 |
| B-07 | A character that XML 1.0 forbids (most control characters) becomes U+FFFD, with a warning. The file still loads. | PROVISIONAL | w01 |
| B-08 | Comments are allowed between blocks and inside `analysis` and `style`. A comment or processing instruction inside `text` or `markup` is rejected, because parsers drop them silently and the text would change without a trace. | PROVISIONAL | 12, e23 |
| B-09 | An attribute the format does not define is kept and reported. Names starting with `x-` are the extension space and are not reported. | PROVISIONAL | w03 |
| B-10 | **Ids** are tokens of letters, digits and underscore. They are **unique across the whole file**: spans, tiers and sets share one namespace. Ids are opaque. The format derives nothing from them, and they need not be readable or ordered. How an application makes them is its own business. | ADOPTED (unique, opaque); PROVISIONAL (characters) | 08, e04, e05, e08 |
| B-11 | A **name** is free text in any script. Names need not be unique and may be absent. Nothing refers to a name. | ADOPTED | 08 |

## 3. The text block (T)

| ID | Rule | Status | Cases |
|---|---|---|---|
| T-01 | `<text>` holds the input text. Only `<` and `&` need escaping (B-06). | ADOPTED | 01, 09 |
| T-02 | **Slice.** One newline right after the start tag is dropped, and the final newline together with any spaces or tabs before the end tag is dropped. This lets a block start and end on lines of its own. | ADOPTED | 01, 02 |
| T-03 | **Dedent.** After slicing, the indentation shared by all non-blank lines is removed. Relative indentation stays. A blank line holding less whitespace than the shared indentation becomes empty. T-02 and T-03 apply to `text` and `markup`, and to text read from a file (T-04), in the same way. Exporters write both blocks flush left. | ADOPTED | 01, 02, 12, 18 |
| T-04 | **File reference.** `<text src="poem.txt"/>`, self-closing, may stand in for the body. The path is relative to the document file, written with `/`, and has no `..`, no leading `/` or `~`, no backslash and no scheme such as `http:`. The file is not itself a document, so there is no chaining. The element must have no body. The file is UTF-8, a BOM is ignored, line ends become LF, and nothing in it is escaped. Its contents are then treated like an inline block: the final line end is dropped and the shared indentation removed (T-02, T-03), so the markup can always match it. A leading blank line stays, because no start tag precedes it. Support is optional in the first version (F-08). | ADOPTED (relative only, same rule for styles); PROVISIONAL (the rest) | 10, 18, e06 |
| T-05 | The size limit on input text is an application rule (W-04), not a rule of the format. | ADOPTED | |
| T-06 | The input text stays out of the document block for a reason: it is never changed by markup. Whatever happens in the other blocks, the text is the text. | PROVISIONAL | e01 |

## 4. The markup block (M)

| ID | Rule | Status | Cases |
|---|---|---|---|
| M-01 | `<markup>` holds the input text with `<span>` elements. After slicing and dedenting (T-02, T-03) and removing the spans, its text must equal the input text exactly (the **strip invariant**). Otherwise the file is rejected. | PROVISIONAL | 01, e01 |
| M-02 | `<span>` is the only element allowed. Spans may nest. They cannot cross, because XML cannot express it (M-05). | ADOPTED | e11 |
| M-03 | **Every span has an id** (B-10). | ADOPTED | e22 |
| M-04 | A span may be a part of a word and may start or end between a base character and its combining mark. A span may be empty (reported). | PROVISIONAL | 01, 11 |
| M-05 | **A span in several pieces** (to cross another span, or to be discontinuous such as the English split digraph a_e) is written as a **head** and **continuations**. The head is a span with its own id. Each continuation is a span with its own id and a `cont` attribute holding the head's id. The pieces, in document order, make one span whose text is the pieces joined. A continuation points at a head, never at another continuation; it must come after its head; the pieces must not overlap. Sets name only the head. | PROVISIONAL | 03, 04, e07, e16, e17, e18 |
| M-06 | Positions are Unicode code points in the stripped text (S-01 of `spec/app.md`). An implementation whose strings are UTF-16 converts at the edges. | PROVISIONAL | 11 |
| M-07 | Whitespace inside `markup` and `text` is text. A formatter or editor that re-indents them line by line is harmless (T-03), but one that joins or wraps lines corrupts the file. Exporters write both blocks flush left with `xml:space="preserve"`, which XML-aware formatters respect; loaders ignore it. | PROVISIONAL | 02 |

## 5. The analysis block (A)

| ID | Rule | Status | Cases |
|---|---|---|---|
| A-01 | `<analysis>` holds `<tier>` elements, in **layer order**: each tier is painted above the tiers before it (S-07). A tier holds `<set>` elements, in order. Nothing else. | ADOPTED | 01, 20 |
| A-02 | A **tier** has `id` (required) and these optional attributes: `name`; `role` (A-13); `kind` (`label`, the default, or `relation`); `directed` (`true` or `false`; only on a `relation` tier); `provider` (`name@version`, an integer version); `reads` (ids of other tiers); `disabled` (A-11). | PROVISIONAL | 05, 06, 16, e10, e13, e14, e19 |
| A-03 | A **set** has `id` (required) and these optional attributes: `name`; `key` (the provider's own name for a set it owns: lower-case letters, digits and underscore, unique within the tier; a set without a key is the user's and a reset never touches it); `members` (span ids, **listed one by one**, separated by commas or whitespace; no ranges); `confirmed` (a subset of `members`); `tags` (space-separated tokens of letters, digits and `_ . : + -`, such as `place:labial`). Each member is a head span (M-05). | ADOPTED (no ranges); PROVISIONAL (the rest) | 01, 14, 19, e03, e10, e12, e17, e20, e21, e27, e28 |
| A-04 | **Meaning of kind.** In a `label` tier each member of a set independently has the label that the set stands for (these are lines; these are stressed). In a `relation` tier the members of a set are related to each other (these two rhyme; these six alliterate). When the tier is `directed` the relation runs from the first member to the last in listed order. | PROVISIONAL | 01, 05, 07 |
| A-05 | **Order.** An undirected set is unordered: a loader reports its members in document order, whatever the listed order. A directed relation keeps the listed order, which is its meaning. Exporters list undirected members in document order, so files diff cleanly. | PROVISIONAL | 13 |
| A-06 | Sets are ordered within their tier, and that order is preserved. A set's **position** is its place in the tier, counting from 1 (S-04). | ADOPTED (position exposed); PROVISIONAL (the rest) | 01 |
| A-07 | A span may be in any number of sets of any number of tiers. Nothing is exclusive. A label dimension with several values is one tier with several sets. | ADOPTED | 06, 07 |
| A-08 | **Provenance.** A tier with a `provider` was filled by that provider (`spec/app.md` E-01) and a whole-tier reset reruns it. In such a tier, a member listed in `confirmed` was accepted by a human and every other member is inferred. A tier without a `provider` was made by hand and is never reset. `reads` names the tiers the provider worked from: a dependency, not a hierarchy. | PROVISIONAL | 06, e10, e13 |
| A-09 | There is no parent and child between tiers (P-04 of `spec/app.md`), and no rule that members of one tier match members of another. | ADOPTED | 06, 07 |
| A-10 | A tier may hold no sets and a set no members. | PROVISIONAL | |
| A-11 | **Saved view state.** `disabled="true"` on a tier means it is switched off in the view; absent or `"false"` means on. The value is required because XML has no bare attributes. A disabled tier is still parsed and checked in full. | ADOPTED | 16, e25 |
| A-12 | A span that no set lists is meaningless. Import accepts it silently. Export drops it (with its continuations). A reset replaces what the sets of a provider tier list, not the spans; a provider that recomputes a span with the same pieces as an existing one reuses its id (`spec/app.md` E-08). | PROVISIONAL | 15 |
| A-13 | **Role.** `role` says what a tier is about (`line`, `rhyme`, `stress`), so that a theme can find the tiers it styles without knowing their ids (S-03). A tier has **at most one** role; for a second role, make a second tier. A role is a lower-case ASCII letter followed by lower-case letters, digits, `_` or `-`. Roles are not unique: several tiers may share one. A provider gives the tiers it fills their role. The built-in vocabulary is in `spec/app.md` Y-10; any other word is allowed. | ADOPTED (one role per tier); PROVISIONAL (syntax) | 01, 20, e29 |

## 6. The style block (S)

| ID | Rule | Status | Cases |
|---|---|---|---|
| S-01 | `<style>` holds **plain CSS**. There is no styling language of our own. Several blocks are allowed and apply in order. `<` and `&` must be escaped in the body (CSS nesting needs `&amp;`); `>` is safe; or put the CSS in a file (S-06), where nothing is escaped. A style block may have `name`, `disabled` (as A-11) and `src`. | ADOPTED | 01, 14, 16 |
| S-02 | A loader ignores and reports `url(...)` and `@import` in a style block, so opening a file never fetches anything (F-07 of `spec/app.md`). | PROVISIONAL | w02 |
| S-03 | **Themes style the analysis, not the text.** The renderer keeps a hidden **mirror** of the analysis: one `tier` element for each tier that is not disabled, in file order, holding one `set` element for each of its sets, in order, each holding one `member` element for each of its members (in the order of A-05). Style blocks are applied to the mirror. For each set the renderer reads the computed value of each channel (`spec/app.md` Y-03), including the `::before` and `::after` content, and paints the set's members with it: text styles on the letters, box styles as boxes around them. Nothing depends on measuring the screen, so the result is the same when the text rewraps, is zoomed or is printed. Nothing in the text is selected by CSS, so spans can cross, nest and come in pieces freely. | ADOPTED | 01, 14, 20 |
| S-04 | **What the mirror shows.** A `tier` element carries `role`, `kind`, `directed`, `provider` and `id`; a `set` element carries `key`, `tags` (space-separated, so `[tags~="place:labial"]` works) and `id`; a `member` element carries `id` (the head span's) and `inferred`, present only when the tier has a provider and the member is not listed in `confirmed` (A-08), so `member[inferred]` styles what no person has accepted yet. Position (A-06) is the element's place: `set:nth-child(2)`; in a directed relation `member:first-child` is where it starts. Names are not shown: they are free text for people. Ids are shown only so a document can tweak its own sets; a theme meant to be shared selects by role, kind, position, key, tags and `inferred`, never by id. | ADOPTED | 01, 14, prototype |
| S-05 | A **theme** is a named style block that can be swapped (`spec/app.md` Y-01): the active theme is the named style block that is not disabled (A-11). A theme is made of **parts**, one for each role it styles (`tier[role="rhyme"] ...`), and a fallback for other tiers (`tier`, `tier:not([role])`). A built-in theme records its credit in its own `<meta>` (Y-08). | PROVISIONAL | 16 |
| S-06 | **Style reference.** `<style src="theme.css"/>` follows the rule of T-04: self-closing, relative path only, no chaining, raw contents, nothing escaped. The CSS is not dedented. | ADOPTED | 17, e24, e26 |
| S-07 | **Layers.** Each visible tier is painted as one layer, in tier order: a later tier is on top (A-01). Within a tier, a later set is on top. For a **text style** (colour, weight, size…), a character takes the value of the topmost layer that sets it; underlines and other lines from every layer show. **Box styles** (fill, border, outline, radius…) from every layer show, stacked in this order, under the letters. A box covers a member's touching pieces as one, one box per line. Added characters nest by layer, lower layers outside, so a box takes in the characters added at its edges by its own and higher layers, and not those of lower layers. The user restacks layers by dragging tiers, which changes the tier order saved in the file. | ADOPTED | 20, prototype |
| S-08 | **Rules reach down.** A channel a member does not set takes its value from its set, and a set's from its tier, so `tier[role="line"] { text-decoration: underline; }` styles every member of that tier, even for properties CSS does not inherit; added characters (`::before`, `::after`) work the same way. The nearest rule wins: member over set over tier. | ADOPTED | prototype |
| S-09 | **Theme CSS is contained.** Style blocks apply only to the mirror of the analysis, kept apart from the application's own page (a shadow root in the prototype). A document's CSS can never restyle the application, and the application's CSS never leaks into a theme. | ADOPTED | prototype |

## 7. Import and export (I)

| ID | Rule | Status | Cases |
|---|---|---|---|
| I-01 | Importing an export gives back the same document: text, spans, tiers, sets, `confirmed` lists, names, ids and order. | PROVISIONAL | |
| I-02 | Export is canonical: blocks in the order `meta`, `text`, `markup`, `analysis`, `style`; tiers and sets in their order (tier order is layer order, A-01); undirected members in document order (A-05); spans that no set lists dropped (A-12); `text` and `markup` flush left with `xml:space="preserve"` (T-03, M-07). | PROVISIONAL | 01, 13, 15 |
| I-03 | Import reports every problem with the line number and the rule that was broken, and never drops content silently. Warnings (B-07, B-09, S-02, empty spans, duplicate members) do not stop a load. | PROVISIONAL | e01-e23, w01-w03 |
| I-04 | Import and export are the only ways a document enters or leaves the application's working copy (`spec/app.md` O-04). | ADOPTED | |

## 8. Questions

Settled on 2026-10-14:

| ID | Question | Answer |
|---|---|---|
| FQ1 | Extension and root name | `.pxml`, `<pxml>` (ADOPTED) |
| FQ2 | Name of the marked-up block | `markup` (ADOPTED) |
| FQ3 | Where are the view and the active theme kept? | `disabled="true"` on tiers and style blocks (A-11, S-05) (ADOPTED) |
| FQ4 | How are orphans written? | They are not: spans belong to no tier, a reset replaces what sets list, providers reuse spans with the same pieces, unlisted spans are dropped on export (A-12) (ADOPTED) |
| FQ5 | `<style src>`? | Yes, the same rule as `<text src>` (S-06) (ADOPTED) |
| FQ6 | Indented `src` text | Dedent it like an inline block (T-04) (ADOPTED) |
| FQ7 | The shape of the mirror | `tier` > `set` > `member`, with the attributes in S-04; members are mirrored so `member[inferred]` can look different (ADOPTED) |

Still open:

| ID | Question | Current default |
|---|---|---|
| FQ8 | Should the format say what provider ids look like (`english.stress@1`)? | No: any dotted name and integer version |
| FQ9 | An escape hatch for an input text whose every line must keep a shared indent? | None: that shared indent is lost (T-03). Add only if someone needs it |
