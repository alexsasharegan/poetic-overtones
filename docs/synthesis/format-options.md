# Text form: prior art and alternatives

> Background for `spec/format.md`. Written 2026-10-14. Not normative.

## The problem

`spec/app.md` asks for a plain-text form that a person can read and edit, that round-trips with no loss,
that diffs well, and that holds **overlapping tiers** over an **undistorted** input text (F-02, F-05, P-04).
Overlap is the hard part. Inline markup, such as XML or HTML tags, forces a single tree, and tiers do not
form one: a metrical foot can start in the middle of one word and end in the middle of another.

## Prior art

| Source | What it does | What to take from it |
|---|---|---|
| Vue and Svelte single-file components | One file with named blocks for template, script and style | Alex's idea: separate blocks for text, markup, metadata and styles in one file |
| TEI XML | Marks up texts in XML. Overlapping hierarchies are a known problem, handled by milestones, fragmenting elements, or stand-off markup | Overlap is solved by moving annotation out of the text |
| LMNL (Layered Markup and Annotation Language) | Overlapping ranges written inline as `[name}content{name]` | Ranges, not a tree, are the right model; inline syntax stays readable only for a few ranges |
| BRAT stand-off format | A text file plus an annotation file, one item per line, with character offsets, and relations between items | One item per line diffs well. Offsets cannot be read or edited by hand |
| Praat TextGrid, ELAN | Linguistic annotation in tiers over a recording | The word "tier", and tiers as independent parallel sequences |
| W3C Web Annotation | Annotations that select text by position or by quoted text | Selecting by quotation is robust, but heavy and verbose |
| Pandoc bracketed spans | `[text]{.class key=val}` | A short, familiar syntax for a marked span |
| CommonMark fenced blocks | A fence of any length, so the body can contain shorter fences | Verbatim blocks that need no escaping |

## Alternatives

| | Idea | Good | Bad |
|---|---|---|---|
| A | Everything inline in one marked-up text | One view; readable for few tiers | Alters the text; overlap needs tricks; many tiers become noise |
| B | Pure stand-off: text plus tables of character offsets | Text untouched; overlap is free; simple to parse | Offsets are unreadable by hand and break silently when the text changes |
| C | Blocks, with one marked copy of the text per tier, and tables for labels and links (**the draft**) | Text untouched; overlap is free across tiers; each block is readable and editable; stripping markup checks the block against the text | Repeats the text once per tier; overlap inside one tier needs several ids on a piece |
| D | JSON or YAML only | Easy to parse; precise | Spans are not readable without tooling |
| E | A database dump | Compact | Not plain text |

## Why C

- It meets the requirement that the text stays undistorted, and it gets overlap across tiers for free.
- It avoids B's weakness: a person can see which words a token covers, because the words are in the block.
- The strip check (I-01) catches an edit that has drifted from the text. B cannot do that.
- The pieces syntax is short and already familiar from Pandoc.
- The cost, a repeated text per tier, is small for poems. A line-range option (FQ1) covers long texts.

## Risks and things to test

- Hand-editing a marks block is easy, but a long block with many ids may still feel heavy. Try it on a real poem.
- The escape rule (M-05) must be tested against texts that contain brackets or braces.
- A formal grammar and fixtures should come before any code (F-04).
