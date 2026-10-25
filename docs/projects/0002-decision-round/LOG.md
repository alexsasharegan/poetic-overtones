# Execution Log: Decision round

## 2026-10-24: Collect, decide, apply

### Context & Decisions

- Alex found the open decisions in `docs/reviews/2026-10-15.md` and `2026-10-19.md` hard to work through. A
  new note, `docs/reviews/2026-10-24.md`, collected them with options and a recommendation each.
- Alex answered in chat: DEC-4 option A; DEC-1 credit as `<name> (<screenname>)`; DEC-2 accept for now;
  DEC-3, DEC-5, DEC-7, DEC-11 as recommended; M1 to M17 and the wider PROVISIONAL rules adopted; part 4
  deferred; part 5 noted; AGENTS.md updated now and the other docs refreshed after build work. "Agreed" meant
  "follow the recommendation".
- Credit wording: Alex attached a screenshot of the author's profile and said to credit them by name and
  screen name. I used the real name from the profile text and the display name as the screen name, not the
  account handle. Alex can swap either. No committed file says how Alex knows the author.
- Four ADRs written as Active: 0014 credit, 0015 ids, 0016 Playwright, 0017 no marks. DEC-2, DEC-5, DEC-6 and
  DEC-11 got no ADR: they confirm existing behaviour or change a theme's CSS. The wholesale adoption of
  PROVISIONAL rules is recorded in the review note and as addenda on ADR-0009, 0010, 0011.
- ADR-0016 says only what Alex decided (dev-only Playwright). How browser tests join `npm test` is left to QA-1;
  an earlier draft of the ADR had decided that and I took it out.
- DEC-11: the Reader theme's `member[inferred]` rule changed from a dashed 1px outline to a dotted 1px
  underline at 55% opacity.

### Commands & Operations Executed

```bash
# status sweep: every "| PROVISIONAL |" table cell became "| ADOPTED |"; mixed cells such as
# "ADOPTED (unique); PROVISIONAL (never reused)" became "ADOPTED". Run with python3 -I over
# spec/format.md and spec/providers/contract.md (31 -> 3 and 9 -> 1 occurrences of the word; the rest are
# the convention text).
# spec/app.md (47 rows) was done by hand with targeted edits, because the shell check was unavailable for a
# while. Its three remaining occurrences are the convention text.
for n in 0009-... 0010-... 0011-...; do printf '...Addendum (2026-10-24)...' >> docs/adr/$n.md; done
node --check app/sample.js          # ok
npm test                            # exit 0: 53 fixtures, 23 round trips, editor and reset checks, 8 provider tiers, 6 provider fixtures
git grep -n -i discord              # no match: nothing committed about where the credit came from
```

Nothing was committed.

### Not verified

- The Reader theme change was not looked at in a browser. `npm test` does not render the app. QA-1 would cover
  this kind of check.
- `spec/providers/english.md` still says some items are OPEN (lexicon work); only its status line and the tags
  sentence changed.
- The count of PROVISIONAL rules adopted is from the files, not from the earlier review's 23, 41 and 8.
- The README status table is still dated 2026-10-15 (DOC-1).

### LLM Session Summary

- **Thread purpose:** turn Alex's answers on the open decisions into spec, ADR and board changes.
- **Key findings / Blockers resolved:** the shell safety check failed repeatedly for part of the session, so
  the spec sweep was split between hand edits and a script. All edits were re-checked by `grep` and
  `npm test` afterwards.
- **Context state for next thread:** the decisions are recorded; open items are CT-6 (ask the author), part 4
  of the review note, and DOC-1 and DOC-2 after the next build work. Suggested next build tasks: UI-4 with
  CORE-1 and RND-1, and QA-1. Everything is uncommitted on `main`.
