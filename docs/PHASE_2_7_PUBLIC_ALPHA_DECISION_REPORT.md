# Phase 2.7 Public Alpha Decision Report

## Automatic Verification Results

- `npm run build`: PASS
- `npm test`: PASS, 18 test files / 75 tests
- `npm audit`: PASS, 0 vulnerabilities
- `npm run release:check`: PASS
- `npm run labels:print`: PASS
- `git diff --check`: PASS

## Pack Result

- `npm run pack`: PASS
- Output: `release/win-unpacked/`
- No installer, portable zip, DMG, or AppImage artifact was generated.
- Known non-fatal warning: Electron Builder emitted Node `DEP0190`.

## Manual Launch Result

MANUAL_LAUNCH_RESULT: PARTIAL_PROCESS_STARTED_UI_NOT_VERIFIED

`release/win-unpacked/BookTrans Desk.exe` started and remained alive during a short smoke check, then was stopped. The current automation environment could not verify the visible UI, tab switching, or Settings content.

## Reader Validation Result

MANUAL_READER_VALIDATION_RESULT: NOT_RUN_ENVIRONMENT_LIMITED

No Calibre, Thorium Reader, or SumatraPDF validation was completed in this environment. No reader PASS is claimed.

## Checksum Result

CHECKSUM_RESULT: NO_INSTALLER_ARTIFACT_GENERATED

Hashes were recorded for unpacked executable files only in `docs/releases/RELEASE_CHECKSUMS_v0.2.6-public-alpha-prep.md`.

## RC Burn-down Status

- P0 issues: none known from automated checks.
- P1 issues: none known from automated checks.
- P2 known limitations: unsigned Windows build, manual reader validation pending, no installer artifact generated, macOS packaging not configured.

## Release Decision

RC_BURNDOWN_DECISION: CONDITIONAL_GO

The project can proceed only if the release publisher accepts the documented limits and completes manual reader validation plus final artifact checksum generation before publishing. It is not a full GO because reader validation and full visible UI verification were not completed in this environment.

## Pre-release Manual Actions

- Launch the packed app interactively and verify Translate, Jobs, Exports, and Settings tabs.
- Run Calibre and Thorium Reader validation for baseline synthetic fixtures.
- Generate the final installer or portable artifact intended for GitHub Release upload.
- Generate SHA256 checksums for the final uploaded artifacts.
- Paste final checksums into the GitHub Release body.

## Security Check

- No release artifacts should be committed.
- No EPUB, exported EPUB, zip, exe, DMG, AppImage, log, `.env`, `release/`, or `dist/` files should be tracked.
- No API keys or Bearer tokens were found by release checks.

## Known Limitations

- Windows package is unsigned.
- Manual reader validation remains pending.
- Manual visible UI launch verification remains pending.
- Only reflowable EPUB is supported.

## Next Recommended Phase

Phase 2.8 should complete actual reader validation, produce uploadable artifacts, generate final checksums, and publish or hold the GitHub Release based on those manual results.
