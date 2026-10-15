# UI plan

How the application grows from the app shell to the MVP. Each step is small enough to test in a
browser and leaves the app usable. The rules are in `spec/app.md`; this file only orders the work.

Run it with `npm run serve` and open <http://localhost:8000/app/>. (Modules do not load from
`file://` pages in every browser, so the app needs a local server, ADR-0012.)

| Step | What | Status |
|---|---|---|
| 1 | **Shell.** Open a `.pxml` file, render it with the layer painter (`src/render/paint.js`), show and hide tiers, restack them, switch themes, undo and redo, save. | Done |
| 2 | **Marking.** Select text, mark it into the selected set (key M), remove members, add tiers and sets. | Done (basic) |
| 3 | **Tier and set details.** Rename, set role, kind and direction, tags and keys; delete with undo; drag to reorder instead of buttons. Show the "inferred" state and confirm with one click (A-08). | Next |
| 4 | **Selection helpers.** Snap a selection to word or grapheme boundaries (S-03 is a helper, not a rule); mark several pieces as one span (discontinuous, M-05); click a painted member to select it. | |
| 5 | **Relations.** Draw a relation by selecting spans in turn; reorder members of a directed relation (A-05). | |
| 6 | **Theme editor (Y-07).** Pick a role, set or tag and edit its look with controls that write CSS; warn on collisions and poor contrast (Y-05, Y-06). | |
| 7 | **Built-in themes.** The community theme as a theme over roles and tags (ADR-0005); a plain default theme. | |
| 8 | **Working copy and files.** Keep the working copy in the browser between visits (O-04), open by drag and drop, export a clean print view and PDF. | |
| 9 | **Standard tiers.** Line, stanza and word tiers made by providers with no lexicon (E-07); reset (E-03). | |

Known limits of the shell: no keyboard-only way to make a selection, no touch selection testing,
names are edited only at creation.
