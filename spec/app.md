# Application Spec: Tiers over Text

This document says what the application is. It names no programming language, framework, file API or
user-interface toolkit, and it sits above whichever stack is chosen (ADR-0006, ADR-0007). When this
document and the code disagree, the code is wrong.

The application takes a text, lets the user mark it up in as many overlapping **tiers** as they like, and
draws the result. It is a tokenizer with WYSIWYG markup decoration. Linguistic analysis is not part of the
core; it arrives as separate, replaceable providers (section 6).

## 0. Conventions

**Status.**
- `ADOPTED`: decided by Alex. The decision is in the chat of 2026-10-14 and recorded in an ADR.
- `PROVISIONAL`: a default proposed by the agent so the spec can be read as a whole. Alex has not yet decided it.
- `OPEN`: an undecided question. Section 13 lists them with the current default.

An agent never promotes a status on its own judgment.

**Rule IDs.** Each rule has an ID. A prefix says which section it belongs to.

| Prefix | Section |
|---|---|
| P | Principles |
| W | Input and workbench |
| S | Spans |
| T | Tiers |
| E | Standard tiers, reset, provenance, editing |
| R | Relations |
| Y | Styles, schemes, collisions |
| O | Offline and storage |
| F | Files and the text form |
| A | Artifacts (exports) |
| X | Extensions and platform |

**Words.** "Tier" is the name for what has also been called a dimension or a layer (decided 2026-10-14).
Earlier ADRs say "layer"; read it as "tier". A tier holds **sets**; a set lists **spans**.

## 1. Vocabulary

| Term | Meaning |
|---|---|
| Input text | The text the user pastes or types, in the input editor |
| Workbench | The surface where the input text is rendered and all marking happens |
| Span | A stretch of the input text with an id, made of one or more pieces |
| Tier | A dimension of analysis such as "Lines", "Stress" or "Rhyme". It holds an ordered list of sets. Tiers overlap freely |
| Set | A named set of spans inside a tier, with an id and optional tags, such as rhyme "A" or the value "stressed" |
| Kind | How a tier's sets are read: **label** (each member has the label) or **relation** (the members belong together) |
| Tag | A named property of a set, such as `place:labial`, used to group sets for styling |
| Standard tier | An ordinary tier whose contents came from a provider |
| Provider | A replaceable function that fills a tier from the text and other tiers |
| Override | A human edit to something a provider produced |
| Scheme | A CSS style sheet that styles spans by the tiers, sets and tags they belong to |
| Channel | One visual property a style can set: a CSS property, or an application custom property for what CSS cannot draw |
| View | Which tiers are visible, with the active scheme |
| Working copy | The document as the application keeps it in persistent local storage |
| Text form | The plain-text serialisation of a document: the share layer, readable and editable in any text editor |
| Artifact | A fixed rendering of a view (PDF or image) that needs no application to read |
| Extension | Separately installed software that adds providers or other features |

## 2. Principles

| ID | Rule | Status |
|---|---|---|
| P-01 | The core is a tokenizer with WYSIWYG markup decoration. It has **no built-in analysis**. | ADOPTED |
| P-02 | The spec is above any language or stack. Nothing in it assumes one. | ADOPTED |
| P-03 | **The user has the last word.** Anything an algorithm produces can be edited. | ADOPTED |
| P-04 | **No default hierarchy.** Tiers overlap freely and are combined by turning them on and off. | ADOPTED |
| P-05 | Relations are first-class. Poetic analysis is mostly relations, so they are in scope from the start. | ADOPTED |
| P-06 | Standard tiers are built on the same primitive as custom ones. Nothing the application ships for itself is out of the user's reach. | ADOPTED |
| P-07 | **Offline first.** Every baseline feature works with no network. | ADOPTED |
| P-08 | **The working copy persists** in local storage on the user's file system, and survives restarting the application. | ADOPTED |
| P-09 | **Open standard.** Every document has a plain-text form that a person can read and edit. Export and import of that form are the **share layer**. | ADOPTED |
| P-10 | **Artifacts are immutable shares.** The application can export a view as a PDF or an image. The text form is the working document; an artifact is the finished picture. | ADOPTED |
| P-11 | **Baseline plus extensions.** The baseline works with nothing added. Extra power comes from extensions the user installs. | ADOPTED |
| P-12 | **macOS first.** The baseline targets a stock macOS install. Nothing in the spec depends on macOS, so other systems can follow. | ADOPTED |

## 3. Input and workbench

| ID | Rule | Status |
|---|---|---|
| W-01 | There are two surfaces. The **input editor** holds the text, which is editable. The **workbench** renders the text with its tiers and holds all marking and interaction. | ADOPTED |
| W-02 | The workbench is a function of its input. Inside the workbench the text cannot be edited. To change the text, the user goes back to the input editor, which gives the workbench a new input. | ADOPTED |
| W-03 | When the input text changes, the workbench starts fresh: standard tiers are re-derived, and hand edits and the contents of custom tiers are discarded after a warning. Tier definitions and schemes are kept. | PROVISIONAL |
| W-04 | The application limits the size of the **input text** (not the size of the files it writes). The limit is stable and counted in Unicode code points, with 1,000,000 as a first guess. Size is not a concern for the first version. The limit is an application rule, not a rule of the text form. | PROVISIONAL |

W-03 is the simplest rule that fits W-02. A friendlier one, re-anchoring annotations after a text change,
is a later option (Q1).

## 4. Spans

| ID | Rule | Status |
|---|---|---|
| S-01 | A position is a Unicode code point index into the input text exactly as given (no normalisation). A range is half-open: start included, end excluded. | PROVISIONAL |
| S-02 | A span is a stretch of the input text with an id, made of one or more pieces (ranges). Pieces may be discontinuous, as for the split digraph in English *make*, or may exist because spans cross. In the text form a span in several pieces is a head and its continuations (`spec/format.md` M-05). | PROVISIONAL |
| S-03 | A span may start or end between a base character and its combining mark. Snapping to grapheme boundaries is a user-interface helper, not a rule. | PROVISIONAL |
| S-04 | Every span has an id. Ids are **unique** across the document (spans, tiers and sets together) and never reused. A span that survives an edit keeps its id. An id is opaque: the spec requires only uniqueness, and how an application makes ids is its own business. | ADOPTED (unique); PROVISIONAL (never reused) |
| S-05 | Spans may overlap, nest or sit apart. Characters may belong to no span (spaces, silent letters). | ADOPTED |
| S-06 | No rule ties the spans of one tier to those of another. A tier may declare that it **reads** another tier, a dependency for providers (E-02), never a hierarchy. | ADOPTED |

S-01 uses code points because they are the same in every language and stack. An implementation whose strings
use another unit (UTF-16, for example) converts at the edges. S-03 matters for Tengwar, where a mark may need
its own style (ADR-0003, `docs/synthesis/comparison.md` section 5).

## 5. Tiers and sets

| ID | Rule | Status |
|---|---|---|
| T-01 | A **tier** has an id, an optional name, a kind, optionally a direction (relation tiers), optionally a provider and the tiers it reads, an ordered list of sets, and a visibility flag. A **set** has an id, an optional name, its member spans, optional tags and a list of members a human has confirmed. | PROVISIONAL |
| T-02 | A tier is a dimension of analysis. It does not own spans: spans exist on their own, and a set only lists them. So one span can be in any number of sets of any number of tiers. | ADOPTED |
| T-03 | **Kind.** In a `label` tier (the default) each member of a set independently has the label the set stands for. In a `relation` tier the members of a set belong together, as a rhyme or an alliteration group does; when the tier is directed they are read in the listed order. Kind says how to read and draw; it adds no exclusivity and no hierarchy. | PROVISIONAL |
| T-04 | Nothing is exclusive. A span may be in several sets of the same tier. (The earlier "one value per label tier" is dropped.) | ADOPTED |
| T-05 | Any number of tiers can exist, and the user can create, rename, delete and reorder tiers and sets. | ADOPTED |
| T-06 | Each tier is switched on or off independently. A **view** is the set of visible tiers plus the active scheme, and views are combinable. A document saves its view as `disabled` on tiers and styles (`spec/format.md` A-11). | ADOPTED |
| T-07 | A set may carry **tags** (`place:labial`, `manner:plosive`, `voiced:true`). Tags let a scheme and a filter act on a group of sets. | PROVISIONAL |
| T-08 | The user defines tiers and sets in the application. Nothing about them is fixed by the core. | ADOPTED |
| T-09 | Names are free text in any script and need not be unique. Ids are opaque. Nothing refers to a name, and no id is derived from one. | ADOPTED |
| T-10 | The order of sets in a tier is kept, and a set's **position** in its tier is available to styles (`spec/format.md` A-06, S-04), so a tier can cycle styles as the user adds sets. | ADOPTED (exposed); PROVISIONAL (form) |

Typical flow (not a rule): the user creates a tier "Rhyme" of kind relation, starts a set, selects the line
ends that rhyme, and ends it; the next set takes the next position and so the next style in the tier's cycle.
The user names the sets A, B and so on when they like.

## 6. Standard tiers, reset, provenance, editing

| ID | Rule | Status |
|---|---|---|
| E-01 | A **standard tier** is an ordinary tier with a provider reference. It has no special powers. | ADOPTED |
| E-02 | A **provider** is a pure function: input text, the tiers it declares it reads, and options go in; tier contents come out. A provider declares what it reads. That is a dependency, not a hierarchy (S-06). | PROVISIONAL |
| E-03 | **Reset** applies the provider and replaces the entire contents of the tier. In this version it has no narrower scope: it resets everything in that tier. | ADOPTED |
| E-04 | A standard tier can be edited at any moment, and stays linked to its provider, so reset is always available. | ADOPTED |
| E-05 | The user may **unlink** a standard tier. It then becomes an ordinary custom tier and reset is no longer offered. | PROVISIONAL |
| E-06 | Every tier records its origin. A tier with a provider is **inferred** (provider id and version), and the members a human accepted are listed as confirmed; a tier without a provider is **human**. Views can show the difference. Reset replaces human edits too (E-03). | ADOPTED |
| E-07 | The core ships with no provider. The application ships standard providers separately (word, syllable and sound for English first), built through the same interface a user's provider would use. | ADOPTED |
| E-08 | **Reset replaces what the sets of a provider tier list, not the spans.** Spans belong to no tier, so a rhyme set that lists a syllable span cannot dangle. When a provider recomputes a span with the **same pieces** as an existing one it reuses that span id, so hand-made sets survive a reset whenever the boundaries are unchanged. If boundaries change, the old span stays because other sets still list it, and the application flags it as no longer in the provider tier (an **orphan**, worked out, not stored). A span that no set lists is dropped on export (`spec/format.md` A-12). | PROVISIONAL |
| E-09 | Every edit, reset included, can be undone and redone. | PROVISIONAL |

E-06 follows ADR-0004. Standard providers are specified separately, in `spec/providers/` (`contract.md`, `english.md`, with fixtures and a runner),
one per language or script.

## 7. Relations

Relations are first-class (P-05). They are the sets of a tier of kind `relation` (T-03).

| ID | Rule | Status |
|---|---|---|
| R-01 | A relation is a set of two or more spans, which may lie anywhere in the text and in any tier's sets. | PROVISIONAL |
| R-02 | What a relation means (rhyme, alliteration, assonance, echo, enjambment) comes from its tier's name and the set's name and tags. The core defines none of them. | PROVISIONAL |
| R-03 | A relation tier may be **directed**: each set is then read from its first member to its last, in the listed order. Otherwise a set is unordered. A set may have more than two members (a rhyme scheme letter across several lines). | PROVISIONAL |
| R-04 | A relation can be drawn by hand (select spans, connect them) or produced by a provider. Its origin follows E-06. | PROVISIONAL |
| R-05 | A relation is drawn through channels (section 8): an arc or connector, or the same marker on every member. | PROVISIONAL |

## 8. Styles, schemes, collisions

| ID | Rule | Status |
|---|---|---|
| Y-01 | A **scheme** is a CSS style sheet. The application invents no styling language. It is separate from the tiers and swappable at any time. | ADOPTED |
| Y-02 | A **channel** is a CSS property, or a custom property the application defines for what CSS cannot draw (relation arcs, text above or below). The set of channels is open: new CSS properties and new custom properties need no change to the core. | PROVISIONAL |
| Y-03 | The initial channels are in the table below. | PROVISIONAL |
| Y-04 | A rule selects by the tiers, sets, tags and positions that the renderer exposes on each span (`spec/format.md` S-03, S-04). Adjusting a style (lighter by a fixed amount) is done in CSS (`color-mix`, relative colours, `calc`). A scheme where place sets hue and voicing sets brightness is two rules combined by channel. | PROVISIONAL |
| Y-05 | If two visible rules set the same channel on overlapping spans, that is a **collision**. The editor works it out from the selectors and warns. It never blocks. | PROVISIONAL |
| Y-06 | In one tier, the editor warns when two sets look too alike (colour distance) or when text contrast is poor. It warns and never blocks. | PROVISIONAL |
| Y-07 | The application has a visual style editor for any set, tag or tier. It writes CSS. | ADOPTED |
| Y-08 | A built-in scheme records its credit in its own file. The community scheme is a first-class built-in (ADR-0005). | PROVISIONAL |
| Y-09 | A loader never fetches anything a style names (`url(...)`, `@import`). Opening a file stays offline (F-07, `spec/format.md` S-02). | PROVISIONAL |

Initial channels (Y-03). The groups are for the editor; the list is expected to grow.

| Group | Channels |
|---|---|
| Text | colour, weight, italic, size |
| Box | fill colour, fill opacity, border colour, border width, border style (solid, dashed, dotted, double), corner radius |
| Line | underline, overline, strikethrough: each with colour, thickness and style (solid, dashed, dotted, wavy) |
| Mark | text or badge above, text or badge below, marker shape (application custom properties) |
| Effect | shadow, glow, background pattern |
| Relation | arc or connector colour, width and dash; shared marker (application custom properties) |

## 9. Offline, storage and files

| ID | Rule | Status |
|---|---|---|
| O-01 | After the application is installed or loaded, every baseline feature works with no network. | ADOPTED |
| O-02 | The working copy of every document is kept in persistent local storage on the user's file system. The storage technology is not specified (a local database is one example). | ADOPTED |
| O-03 | Changes are saved as the user works. Quitting or crashing loses nothing that was visible. | PROVISIONAL |
| O-04 | The working copy is not required to be the text form. So the application has an **export engine** and an **import engine** for the text form. | ADOPTED |

| ID | Rule | Status |
|---|---|---|
| F-01 | There are three kinds of document: **documents**, **schemes** (style sheets) and **tier definitions** (reusable tiers with their sets, names and tags, but no spans). | PROVISIONAL |
| F-02 | Every kind has a **text form**: plain text in UTF-8 that a person can read and edit in any text editor. Export writes it, import reads it. This is the share layer (P-09). | ADOPTED |
| F-03 | A document holds the input text, the spans, the tiers with their sets (with origin), the styles and the view. | PROVISIONAL |
| F-04 | Conformance is tested with fixtures. The text form has them in `spec/fixtures/` (47 cases and a reference checker); provider fixtures are in `spec/providers/fixtures/` with their own runner (`spec/providers/contract.md`); reset-by-hand and round-trip fixtures are not yet written. An implementation in any language can run them. | PROVISIONAL |
| F-05 | Requirements on the text form: (a) a person can read it without a manual; (b) plain text with a stable order, one item per line where possible, so a diff or version-control history reads well; (c) comments are allowed; (d) it names its format and version; (e) import of an export gives back the same document, including origins, orphans and the view; (f) import reports errors with line numbers and never drops content silently. | PROVISIONAL |
| F-06 | The grammar of the text form is `spec/format.md`: XML-based, sibling blocks, no CDATA (Q9 resolved). | PROVISIONAL |
| F-07 | Opening a document never runs code. The text form holds data only. | PROVISIONAL |
| F-08 | A document file may keep its **input text** and its **styles** in other files, with self-closing `<text src="..."/>` and `<style src="..."/>` (`spec/format.md` T-04, S-06): relative path only, no chaining. Support is optional and is not in the first version. | PROVISIONAL |

## 10. Artifacts

| ID | Rule | Status |
|---|---|---|
| A-01 | The application exports the current view as an **artifact**: a fixed rendering that needs no application to read. | ADOPTED |
| A-02 | Artifact formats: PDF and PNG are required. JPEG and SVG are optional. | PROVISIONAL |
| A-03 | An artifact shows exactly the visible tiers in the active scheme, a legend of the styles in use, and the credit of any built-in scheme (Y-08). | PROVISIONAL |
| A-04 | Exporting an artifact needs no extension. | PROVISIONAL |
| A-05 | An artifact may carry the text form of its document inside, so the analysis can be traced back. | PROVISIONAL |

## 11. Extensions and platform

| ID | Rule | Status |
|---|---|---|
| X-01 | The baseline application works on a stock macOS install with no additional software. | ADOPTED |
| X-02 | More power comes from **extensions**: separately installed software that adds providers, and possibly exporters or views. | ADOPTED |
| X-03 | An extension may need software the baseline lacks, such as a language runtime. The user installs it. The baseline never requires it. | ADOPTED |
| X-04 | An extension declares a manifest: id, version, what it provides (each provider with the tiers it reads and writes), what it requires, and its credit and licence. | PROVISIONAL |
| X-05 | A provider from an extension follows the same contract as a built-in one (E-02): plain data in, plain data out. How data travels between the application and the extension is not specified. | PROVISIONAL |
| X-06 | If a tier's extension is missing, the tier keeps its contents and stays editable. Only reset is unavailable, and the application says which extension provides it. | PROVISIONAL |
| X-07 | Opening a document never runs an extension. An extension runs only after the user has installed it and asked for it. | PROVISIONAL |
| X-08 | Extensions run on the user's machine. The project hosts no compute (ADR-0006). | ADOPTED |

## 12. Out of scope for the first version

- A hosted service, accounts, or collaboration (ADR-0006).
- Editing the text inside the workbench (W-02).
- Meter detection or any other analysis in the core (P-01).
- Audio.
- Enforcing a hierarchy between tiers (P-04).
- Windows and Linux as targets. They are not ruled out (P-12).
- File references in the text form (F-08).
- Ranges in the lists of members, ids derived from names, and CDATA (`spec/format.md` A-03, B-10, B-05).

## 13. Open questions

| ID | Question | Current default |
|---|---|---|
| Q1 | When the input text changes, can annotations be kept? | They are discarded after a warning (W-03). Re-anchoring by text diff is a later option |
| Q2 | What is a tier called? | Decided 2026-10-14: tier, with set and span. ("Dimension" and "layer" are retired) |
| Q3 | May a span be in several sets of one tier? | Yes (T-04). Nothing is exclusive |
| Q4 | Can a set list raw character ranges, not spans? | No: sets list span ids. A span is the thing with an identity (S-02) |
| Q5 | Should reset ever be narrower than a whole tier? | No (E-03). A scope such as a line or a selection can come later |
| Q6 | How many channels, and how are they grouped? | Open registry with the initial list in Y-03 |
| Q7 | Where do scheme credits and licences live, and in what form? | In the scheme file (Y-08); form to be agreed with the scheme's author |
| Q8 | Should a document record several readers' annotation sets side by side? | Not in this version (ADR-0004 notes that two readers can disagree) |
| Q9 | What is the grammar of the text form? | `spec/format.md`: XML-based, sibling blocks, spans with ids, sets in tiers, plain CSS (F-06) |
| Q10 | Can the text form also serve as the working copy, edited in place? | No: the working copy is separate (O-04), so import and export are needed |
| Q11 | Which export formats are required? | PDF and PNG required; JPEG and SVG optional (A-02) |
| Q12 | Should an artifact carry its document's text form inside, so it can be traced back or re-imported? | It may (A-05); how is open |
| Q13 | How are extensions found, installed and trusted, and what is the transport between the application and an extension? | Not decided (X-04, X-05, X-07) |
| Q14 | What is the input size limit, and in what unit? | Input text, in code points, 1,000,000 as a first guess; not a concern for the first version (W-04) |
| Q15 | Should file references ever allow absolute paths? | No (`spec/format.md` B-11) |
