# UI plan

How the application grows from the app shell to the MVP. Each step is small enough to test in a
browser and leaves the app usable. The rules are in `spec/app.md`; this file only orders the work.

Run it with `npm run serve` and open <http://localhost:8000/app/>. (Modules do not load from
`file://` pages in every browser, so the app needs a local server, ADR-0012.)

Step numbers are the board's `UI-n` tasks (`docs/ROADMAP.md`), where blockers and status are kept up to date.

| Step | What | Status |
|---|---|---|
| UI-1 | **Shell.** Open a `.pxml` file, render it with the painter (`src/render/paint.js`), show and hide tiers, restack them, switch themes, undo and redo, save. Sample menu. | Done |
| UI-2 | **Marking.** Select text, mark it into the selected set (key M), remove members, add tiers and sets. | Done (basic) |
| UI-3 | **Tier and set details.** Rename, role, kind and direction, tags; delete with undo; reorder sets; confirm inferred members with one click (A-08). | Done; drag to reorder is still buttons |
| UI-4 | **Selection helpers.** Snap to word or grapheme boundaries (S-03 is a helper, not a rule); mark several pieces as one span (M-05); click a painted member to select it; keyboard selection. | Ready |
| UI-5 | **Relations.** Build a relation by selecting spans in turn; reorder members of a directed relation (A-05). Arcs wait for marks (MRK-4). | Ready |
| UI-6 | **Theme editor (Y-07).** Pick a role, set or tag and edit its look with controls that write CSS; warn on collisions and poor contrast (Y-05, Y-06). | Blocked by RND-2 |
| UI-7 | **Files.** Drag and drop; keep the working copy between visits (O-04); a clean print view and PDF export (A-02). | Ready |
| UI-8 | **Standard tiers.** Line, stanza and word tiers made by providers with no lexicon (E-07); reset (E-03). | Blocked by PRV-1, CORE-2 |
| UI-9 | **Views.** Filter what is shown by tag (place, manner, sibilant), as the deck's grouped views do (T-06). | Ready |

Built-in themes are their own epic on the board (CT).

Known limits of the shell: no keyboard-only way to make a selection, no touch selection testing,
set keys are shown but not edited (keys belong to providers), reordering is by buttons.
