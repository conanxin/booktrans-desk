# Manual Desktop Validation Results

## Environment

- Branch: `merge-documuse-studio`
- Synthetic EPUB: `temp/manual-fixtures/synthetic-reading.epub`
- Synthetic PDF: `temp/manual-fixtures/synthetic-paper.pdf`
- Public release: not created.
- PDF translation public release: HOLD.

## Dev Smoke

- Status: PASS.
- Vite ready: PASS, `http://127.0.0.1:5173/`.
- TypeScript watch: PASS, 0 errors.
- Electron startup: PARTIAL, Electron reached startup logging but reported local disk cache access errors in this environment.
- Residual dev processes: PASS, no matching dev processes remained after cleanup.

## Real Desktop Click-Through

Status: BLOCKED_MANUAL.

Reason:

- The current Codex execution environment can run shell commands and dev smoke checks, but it does not provide a reliable interactive Windows desktop control surface for clicking Electron dialogs, choosing files, running analysis in the live window, saving export dialogs, closing/restarting the window, and visually confirming persistence.

## EPUB Results

- Import synthetic EPUB: BLOCKED_MANUAL.
- Document library entry: BLOCKED_MANUAL.
- Chapter reading: BLOCKED_MANUAL.
- Quick analysis: BLOCKED_MANUAL.
- Chat with sources: BLOCKED_MANUAL.
- Markdown/JSON/Chat/Analysis export: BLOCKED_MANUAL.
- Restart persistence: BLOCKED_MANUAL.
- EPUB translation flow still reachable: BLOCKED_MANUAL.

## PDF Results

- Import synthetic text PDF: BLOCKED_MANUAL.
- Document library entry: BLOCKED_MANUAL.
- Page reading: BLOCKED_MANUAL.
- sourceHint / role / bbox visibility: BLOCKED_MANUAL.
- Quick analysis: BLOCKED_MANUAL.
- Chat with page/source/unit sources: BLOCKED_MANUAL.
- Markdown/JSON/Chat/Analysis export: BLOCKED_MANUAL.
- Restart persistence: BLOCKED_MANUAL.
- PDF translation still Experimental / HOLD: BLOCKED_MANUAL.

## Automated Coverage Supporting Manual Validation

- EPUB/PDF adapter, reader utilities, analysis, chat, export, and persistence flows are covered by automated tests.
- S5 adds display helper tests for workspace status, source display, and export labels.
- Real window behavior still requires manual execution of `MANUAL_DESKTOP_VALIDATION_CHECKLIST.md`.
