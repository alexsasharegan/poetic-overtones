# Core library

The document model, its loader and its canonical export, as plain ES modules with no
dependencies. The same files run in the browser and in Node (ADR-0006, ADR-0012).

```js
import { load, save, spanText, PxmlError } from './src/core/index.js';

const { doc, warnings } = load(source, { readFile: (path) => contentsOrNull });
doc.tiers[0].sets[0].members;   // span ids, in the order of spec/format.md A-05
spanText(doc, 'w1');            // the text of a span, pieces joined
save(doc);                      // canonical .pxml text (spec/format.md I-02)

const ed = new Editor(doc);
const t = ed.addTier({ name: 'Rhyme', role: 'rhyme', kind: 'relation' });
const s = ed.addSet(t, { name: 'A' });
ed.mark(s, [[26, 28]]);           // code points; cpIndex() converts from UTF-16
ed.undo(); ed.redo();
```

| File | What it does |
|---|---|
| `xml.js` | A small XML 1.0 parser for exactly what the format allows. Rejects CDATA (B-05) and DOCTYPE (B-03). Line numbers on every node. |
| `load.js` | The loader: a port of `spec/fixtures/check.py`, rule for rule and error code for error code, that keeps everything a document holds. |
| `edit.js` | `Editor`: add, remove, move and rename tiers and sets; mark text as a member (making or reusing a span, E-08); confirm; undo and redo (E-09). A failed edit throws and changes nothing. Ids are not reused within a session (S-04, ADR-0015). |
| `save.js` | Canonical export. Writes spans that cross as heads and continuations (M-05), drops spans no set lists (A-12), writes styles inline. |
| `index.js` | The public entry point. |

**The model.** `doc.text` is the input text. `doc.spans` maps a span id to its pieces
(`{ id, start, end }`, positions in **code points**, M-06). `doc.tiers` is the analysis in
layer order: each tier has `id`, `attrs` (everything else as written) and `sets`; each set
has `id`, `attrs`, `members` and `confirmed`. `doc.styles` holds `{ attrs, css }`;
`doc.meta` its attributes; `doc.blocks` keeps extension blocks as parsed.

**Errors.** `load` throws a `PxmlError` with the same `code` as `check.py`, a `detail`
and, where known, a `line`. Warnings come back as `{ code, line }`.

**Tests.** `npm test` runs `tests/run.mjs` (every fixture in `spec/fixtures/`, plus
load-save-load round trips and stable saves), `tests/edits.mjs` (edits made in memory), `tests/editor.mjs` (the editing operations, undo and redo),
and both Python reference checkers.
