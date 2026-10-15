# pxml fixtures

A stack of small files, each testing one case the format has to support. They are part
of the spec: if a rule in `../format.md` and a fixture disagree, one of them is wrong and
must be fixed, not ignored. They are the poetic-parser counterpart of the corpus in
shavian2tengwar.

Run them all: `python3 -I check.py` (Python 3, stdlib only). `check.py --show FILE`
prints what the checker computed. `check.py` is a reference for the draft rules, not the
implementation; a JavaScript loader must produce the same results.

Each fixture says what it should do in a comment: `<!-- expect {json} -->` with
`outcome`, `errors`, `warnings` and `tiers` (the text each tier member resolves to).
Names: `NN-` loads cleanly, `eNN-` must be rejected, `wNN-` loads with a warning.

| Case | What it pins down |
|---|---|
| 01 basic | blocks; bare id'd spans, sub-word spans; tiers hold sets of span ids; ids opaque and unique; names free; CSS on stamped `data-tier` / `data-set`; tab indentation |
| 02 dedent | common indentation removed from text and markup; stray short whitespace line |
| 03 crossing | spans that cross: a head span plus a continuation (`cont="head-id"`); every span has its own id |
| 04 discontinuous | split digraph (a_e) as a head and a continuation |
| 05 enjambment | a directed relation tier, one set per enjambment |
| 06 provider | provider-filled tiers, `reads`, `confirmed`, a hand-made tier, one span in many sets, members listed one by one |
| 07 relations | alliteration and a repeated rime over the same words |
| 08 names | ids opaque; names in any script, repeated or absent |
| 09 entities | XML escapes and numeric references; no CDATA |
| 10 text-src | `<text src="..."/>`, self-closing, relative only, nothing escaped, sliced and dedented like an inline block |
| 11 unicode | code-point offsets (astral Shavian), combining mark alone, Private Use |
| 12 explicit root | the `<pxml>` root form, with an XML declaration |
| 13 order | undirected sets are unordered (read in document order); directed relations keep the listed order |
| 14 tags | tags on sets, stamped as `data-tags` for CSS |
| 15 unreferenced | a span no set lists loads silently |
| 16 disabled | saved view state: `disabled="true"` on tiers and style blocks |
| 17 style-src | `<style src="..."/>`, same rules as `<text src>` |
| 18 indented-src | a text file is dedented like an inline block |
| 19 key | the `key` of a set: the provider's own name for the sets it owns |
| e01-e28 | files that must be rejected, each for one reason (e15 is CDATA) |
| w01-w03 | files that load but are reported: control character, `url()` in CSS, unknown attribute |

Model in one line: a **tier** (a dimension) holds **sets**; a **set** lists **spans** by id;
a **span** is a stretch of the text. Every id is unique in the whole file.

Poems used are in the public domain (Jane Taylor, Milton, nursery rhymes). Do not add
copyrighted verse.
