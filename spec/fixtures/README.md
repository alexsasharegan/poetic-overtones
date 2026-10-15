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
| 01 basic | blocks, bare id'd spans, sub-word spans, tiers as sets, channel as class, tab indentation |
| 02 dedent | common indentation removed from text and markup; stray short whitespace line |
| 03 crossing | spans that cross, written as fragments sharing an id |
| 04 discontinuous | split digraph (a_e) as one span in two fragments |
| 05 enjambment | directed relation across lines; one tier = one relation; `group` |
| 06 provider | provider-filled tiers, `reads`, `confirmed`, a hand-made tier, one span in many tiers, ranges |
| 07 relations | alliteration and repeated rime over the same words |
| 08 group | `group` for dimensions made of several tiers; default channel from the name |
| 09 entities | XML escapes, numeric references, CDATA |
| 10 text-src | `<text src="..."/>`, self-closing, relative only |
| 11 unicode | code-point offsets (astral Shavian), combining mark alone, Private Use |
| 12 explicit root | the `<pxml>` root form, with an XML declaration |
| e01-e14 | files that must be rejected, each for one reason |
| w01-w04 | files that load but are reported: control character, `url()` in CSS, unknown tier attribute, lossy slug |

Poems used are in the public domain (Jane Taylor, Milton, nursery rhymes). Do not add
copyrighted verse.
