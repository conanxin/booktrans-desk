# S13 Bug / Blocker List

## S13-001

- Severity: blocker
- Area: validation
- Status: open
- Steps:
  1. Start the S12 redesigned workspace shell from `npm run dev` or packaged app.
  2. Complete a real Windows desktop click-through with file picker, save dialogs, app restart, and external file opening.
- Expected:
  - EPUB and PDF synthetic fixtures can be imported, read, exported, reopened, and manually verified through the desktop UI.
- Actual:
  - Process-level dev and packaged startup smoke passed, but this Codex shell context cannot operate the real Windows file picker, save dialogs, or external applications.
  - EPUB/PDF click-through, export external open, and restart persistence remain `BLOCKED_MANUAL`.
- Suggested fix:
  - Run the S13/S11 manual validation checklist from a human-operated Windows desktop session.
  - Record PASS/FAIL/BLOCKED results in `docs/merge/MANUAL_DESKTOP_VALIDATION_RESULTS.md`.

## S13-002

- Severity: low
- Area: packaging
- Status: fixed
- Steps:
  1. Ensure no project Electron/Vite/packaged app processes are running.
  2. Run `npm run pack`.
- Expected:
  - electron-builder writes ignored packaged output to `release\win-unpacked`.
- Actual:
  - S13 rerun passed and produced `release\win-unpacked\BookTrans Desk.exe`.
- Suggested fix:
  - No code fix required.
  - If the lock returns, close packaged/dev app windows and rerun pack from a fresh PowerShell session.

