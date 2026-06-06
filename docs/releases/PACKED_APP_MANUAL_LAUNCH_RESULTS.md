# Packed App Manual Launch Results

## Environment

| Field | Value |
| --- | --- |
| Date | 2026-06-06 |
| OS | Windows |
| Shell | PowerShell |
| App version | 0.2.8-alpha.0 |
| Release tag target | v0.2.8-public-alpha |

## Results

MANUAL_LAUNCH_RESULT: PARTIAL_PROCESS_STARTED_UI_NOT_VERIFIED

| Artifact tested | Launch result | UI result | Notes |
| --- | --- | --- | --- |
| `release/win-unpacked/BookTrans Desk.exe` | PROCESS_STARTED | Not visually verified | Process stayed alive for a 5 second smoke check, then was stopped |
| `release/BookTrans Desk 0.2.8-alpha.0.exe` | PROCESS_STARTED | Not visually verified | Portable exe stayed alive for a 5 second smoke check, then was stopped |
| `release/BookTrans Desk Setup 0.2.8-alpha.0.exe` | NOT_RUN | Not verified | Installer was not run to avoid changing local system install state |

## Visual UI Checklist

The following checks remain pending because this environment did not provide interactive visual confirmation:

- App window opens visibly.
- No white screen.
- Translate, Jobs, Exports, and Settings tabs visible.
- Settings shows API settings, EPUBCheck settings, and security notes.
- Translate shows Import EPUB, Translation Settings, and Start Translation.
- Exports shows Export History.
- Jobs shows Job Manager.
