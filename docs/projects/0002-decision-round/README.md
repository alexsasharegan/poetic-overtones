# 0002: Decision round

**Status:** done (2026-10-24), not yet committed when this was written. **Owner:** Alex. **Worked on by:** Claude.
**Branch:** none; the repository has no remote, so the work sits on `main` as in 0001.

Alex found the open decisions spread over two review notes hard to work through. This project collected
them into one note (`docs/reviews/2026-10-24.md`), took Alex's answers, and applied them to the specs, the
ADRs, the board, the credit and the Reader theme.

## Scope

* The review note, with a ledger of what was decided and what stays open.
* ADR-0014 (credit the author), ADR-0015 (ids), ADR-0016 (Playwright, dev-only), ADR-0017 (no marks in the MVP).
* Every PROVISIONAL rule in `spec/app.md`, `spec/format.md` and `spec/providers/` adopted.
* The board: decided items closed, marks moved past the MVP, new tasks CT-6, UI-10, DOC-1, DOC-2.
* AGENTS.md brought up to date. README.md, HISTORY.md (apart from a new phase) and project records wait for
  DOC-1.

## Definition of Done

* `npm test` passes.
* No PROVISIONAL status is left in the three spec files except in the convention text.
* Every decision in the ledger names where it is recorded.
* What was not verified is written down (see `LOG.md`).

See `TASKS.md` and `LOG.md`.
