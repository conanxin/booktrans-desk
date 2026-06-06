# Phase 2.8 Final Alpha Release Report

## Automatic Verification Results

- `npm run build`: PASS
- `npm test`: PASS, 18 test files / 76 tests
- `npm audit`: PASS, 0 vulnerabilities
- `npm run release:check`: PASS
- `npm run labels:print`: PASS
- `npm run pack`: PASS
- `git diff --check`: PASS

## Artifact Generation Result

DIST_RESULT: PASS

`npm run dist` generated:

- `release/BookTrans Desk Setup 0.2.8-alpha.0.exe`
- `release/BookTrans Desk 0.2.8-alpha.0.exe`
- `release/BookTrans Desk Setup 0.2.8-alpha.0.exe.blockmap`

Artifacts are ignored and are not committed to git.

## Checksum Result

CHECKSUM_RESULT: GENERATED_FOR_WINDOWS_ARTIFACTS

Checksums are recorded in `docs/releases/RELEASE_CHECKSUMS_v0.2.8-public-alpha.md`.

## Manual Launch Result

MANUAL_LAUNCH_RESULT: BLOCKED_BY_ENVIRONMENT

Unpacked and portable executables started and stayed alive during short process smoke checks. Visual UI checks were blocked by the current automation environment.

## Reader Validation Result

MANUAL_READER_VALIDATION_RESULT: PARTIAL

Calibre `ebook-viewer` process smoke opened a temporary exported minimal EPUB that passed internal validation. Visual chapter text confirmation was not available, so no reader PASS is claimed.

## RC Burn-down Status

- P0 issues: none known from automated checks.
- P1 issues: none known from automated checks.
- P2 known limitations: visual UI verification pending, reader validation pending, Windows unsigned build, macOS packaging not configured.

## Final Decision

FINAL_DECISION: CONDITIONAL_GO

The public alpha can proceed only if the release publisher accepts the documented limitations or completes visual UI and reader validation before publishing. This is not a full GO.

## Release Upload Instructions

1. Recompute checksums immediately before upload.
2. Upload Windows installer and portable executable to GitHub Release.
3. Paste checksums into the release body.
4. Clearly retain the CONDITIONAL_GO status unless manual reader and visual UI validation are completed.
5. Do not commit release artifacts.

## Security Check

- No release artifacts should be committed.
- `release/` and `dist/` remain ignored.
- No `.env`, EPUB, exported EPUB, zip, exe, DMG, AppImage, log, API key, or Bearer token should be tracked.
- Diagnostic bundles remain redacted.

## Known Limitations

- Windows build is unsigned.
- Visual launch verification is incomplete.
- Real reader validation is incomplete.
- Only reflowable EPUB is supported.

## Next Recommended Phase

Phase 2.9 should perform real visual UI validation and Calibre/Thorium reader validation, then either upgrade the release decision to GO or publish with explicit CONDITIONAL_GO wording.
