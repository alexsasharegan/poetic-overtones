# ADR-0014: The Community Scheme's Author Is Credited by Name

**Status:** Active
**Date:** 2026-10-24
**Affected:** AGENTS.md, README.md, themes/community.css, themes/README.md, spec/app.md (Y-08, Q7); refines ADR-0005
**Origin:** Alex, chat 2026-10-24 (DEC-1, credit wording)
**Review:** Decided by Alex in chat. The author has not yet seen the wording; change it if they ask
**Revert:** Edit the credit line in the places listed under Decision; a new ADR if the form changes

## Context

ADR-0005 adopted *Phonetic Markup for Verse* v3.0 as a built-in theme, credited to its author, with the
wording "to be agreed". Until then no name was committed. Alex has since decided the wording.

## Decision

1. The credit reads: **Eric Kingsepp (Éadric Scúsmiþ)**, the form `<name> (<screenname>)`. The screen name is
   the author's display name, not their account handle.
2. The credit appears in the theme file (`themes/community.css`, Y-08), `themes/README.md`, the README and
   AGENTS.md, and in any artifact that shows the theme (A-03).
3. The full title stays *Phonetic Markup for Verse* (v3.0).
4. The credit is only the name and screen name. It does not say where or how the author and Alex are
   acquainted, and the PDF stays gitignored (ADR-0005).

## Consequences

* The AGENTS.md rule "name no one in committed files" no longer applies to this author.
* The seven colour choices (M11) and bold-italic secondary stress (M12) are still to be confirmed with the
  author (board: CT-6). The credit does not claim that they approved them.
* If the author asks for other wording, change the places in Decision item 2.
