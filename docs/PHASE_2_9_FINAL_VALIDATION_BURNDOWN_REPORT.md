# Phase 2.9 Final Validation Burn-down Report

## Automatic Verification Results

- `npm run build`: PASS
- `npm test`: PASS, 18 test files / 76 tests
- `npm audit`: PASS, 0 vulnerabilities
- `npm run release:check`: PASS
- `npm run labels:print`: PASS
- `npm run pack`: PASS
- `npm run dist`: PASS
- `git diff --check`: PASS before final doc updates

## Artifact Results

ARTIFACTS_READY: YES

- `release/BookTrans Desk Setup 0.2.8-alpha.0.exe`
- `release/BookTrans Desk 0.2.8-alpha.0.exe`
- `release/BookTrans Desk Setup 0.2.8-alpha.0.exe.blockmap`

Artifacts remain ignored and are not committed.

## Checksum Result

CHECKSUM_RESULT: GENERATED_FOR_WINDOWS_ARTIFACTS

Final SHA256 values are recorded in `docs/releases/RELEASE_CHECKSUMS_v0.2.8-public-alpha.md`.

## Visual Launch Result

MANUAL_LAUNCH_RESULT: BLOCKED_BY_ENVIRONMENT

The unpacked app and portable executable processes started and stayed alive during smoke checks. The current environment did not allow reliable visual confirmation of the app window, tabs, or settings content.

## Reader Validation Result

MANUAL_READER_VALIDATION_RESULT: PARTIAL

Calibre `ebook-viewer` was available. A temporary synthetic `minimal-epub3` was generated, translated with the mock translator, exported, validated with internal validator PASS, and opened via Calibre `ebook-viewer` process smoke. Visual confirmation of book text was not available, so this is not a PASS.

Thorium Reader and SumatraPDF were not found.

## RC Burn-down Final Decision

FINAL_DECISION: CONDITIONAL_GO

The release can be published only with explicit conditional validation wording. It should not be described as fully manually verified.

## GitHub Release Recommendation

Recommend publishing only if the maintainer accepts the conditional validation language in `docs/releases/GITHUB_RELEASE_DRAFT_v0.2.8-public-alpha.md`. For a full GO, first complete visual app UI validation and visible Calibre or Thorium baseline EPUB validation.

Publication status after Phase 2.10: published manually as GitHub prerelease at https://github.com/conanxin/booktrans-desk/releases/tag/v0.2.9-public-alpha-conditional. Final decision remains CONDITIONAL_GO.

Post-publication hotfix note: user testing found a packaged Windows white screen. The root cause is outside EPUB translation logic: preload was packaged with ESM syntax while Electron executed it as CommonJS, and renderer assets were emitted with absolute `/assets/...` paths. `v0.2.12-white-screen-hotfix` is recommended to supersede the affected package.

## Release Steps

1. Recompute checksums immediately before upload.
2. Upload installer and portable artifacts to GitHub Release.
3. Paste checksums into the release body.
4. Keep the Windows unsigned warning and privacy warning visible.
5. Do not upload release artifacts to git.

## Security Check

- No release artifacts are committed.
- `release/` and `dist/` remain ignored.
- No `.env`, EPUB, exported EPUB, zip, exe, DMG, AppImage, log, API key, or Bearer token should be tracked.
- Diagnostic bundles remain redacted.

## Known Limitations

- Visual UI verification remains blocked by the environment.
- Reader validation is partial, not PASS.
- Windows build is unsigned.
- macOS packaging is not configured.
- Only reflowable EPUB is supported.

## Next Recommended Phase

Phase 3 should begin local library management only after the maintainer either accepts the conditional public alpha or completes the remaining visual UI and reader checks for a full GO.
