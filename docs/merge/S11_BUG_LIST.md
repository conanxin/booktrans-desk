# S11 Bug / Blocker List

## S11-001

- Severity: blocker
- Area: packaging
- Status: open
- Steps to reproduce:
  1. Run `npm run pack`.
  2. Observe electron-builder packaging `release\win-unpacked`.
- Expected:
  - `npm run pack` completes and produces `release\win-unpacked\BookTrans Desk.exe`.
- Actual:
  - First attempt failed with `ENOENT: no such file or directory, rename ... electron.exe -> BookTrans Desk.exe`.
  - Second attempt failed with `The process cannot access the file because it is being used by another process` for `release\win-unpacked\locales\de.pak`.
  - Later attempts timed out after 300 seconds while electron-builder remained running and only partial `electron.exe` output was visible.
- Screenshot path:
  - None.
- Suggested fix:
  - Before re-running S11, ensure no dev Electron/Vite/electron-builder processes are running.
  - Clean `release\win-unpacked`.
  - Consider adding or documenting a safe `pack:clean` helper that removes ignored package output before `electron-builder --dir`.
  - Re-run `npm run pack` from a fresh PowerShell session.
- Notes:
  - Prior S10 pack passed, so this may be environment/process-lock related rather than a product code regression.
  - No generated release artifacts are committed.

## S11-002

- Severity: blocker
- Area: validation
- Status: open
- Steps to reproduce:
  1. Run S11 in the current Codex shell-only context.
  2. Attempt to complete real file picker, save dialog, restart, and external open validation.
- Expected:
  - A human operator completes the Windows desktop click-through checklist.
- Actual:
  - No user-operated Windows desktop click-through was performed in this run.
  - EPUB/PDF import, reading, analysis, chat, export, persistence, and external open items remain `BLOCKED_MANUAL`.
- Screenshot path:
  - None.
- Suggested fix:
  - Run `docs/merge/S11_MANUAL_WINDOWS_VALIDATION_PLAN.md` from a real Windows desktop session.
  - Record PASS/FAIL/BLOCKED results in `docs/merge/MANUAL_DESKTOP_VALIDATION_RESULTS.md`.
- Notes:
  - Dev process smoke passed, but process smoke is not a replacement for manual UI validation.
