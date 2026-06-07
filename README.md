# BookTrans Desk

[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-lightgrey)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v0.3.2--pdf--diagnostics--fix-orange)](CHANGELOG.md)

BookTrans Desk is an open source desktop alpha for translating reflowable EPUB books into Simplified Chinese with an OpenAI-compatible API. It is local-first: no telemetry, no account system, no cloud sync, and no bundled commercial EPUB content.

Phase 3A status: `v0.3.0-pdf-translation-mvp` adds an internal MVP for copyable text PDF import, translation, reflowed PDF export, and lightweight PDF validation. Scanned/image-only PDFs are detected but OCR is not supported.

Phase 3A-V manual PDF validation status: HOLD. Automatic build, test, audit, release check, pack, and dist passed, and the packed executable passed a process smoke check, but visible packaged UI validation and exported PDF external reader-open validation were blocked by the current environment.

Phase 3B status: `v0.3.1-translation-quality-fix` hardens MiniMax/OpenAI-compatible translation output with a strict prompt, MiniMax thinking disabled, output sanitizing, validation, retry, PDF export quality blocking, cleaned PDF titles, and safer PDF wrapping. PDF support remains HOLD until real UI and external reader validation pass.

Phase 3C status: `v0.3.2-pdf-diagnostics-fix` fixes PDF translation start diagnostics after real MiniMax testing reported raw `Translation canceled` errors. It adds structured error codes, fresh cancellation state per job, PDF chunk diagnostics, provider error mapping, MiniMax connection testing, and friendly UI error messages. PDF support remains HOLD.

> Alpha warning: this project is still intended for technical testers. Keep backups of original EPUB files and review provider privacy terms before translating private or copyrighted content.

> Windows unsigned warning: current Windows alpha packages are unsigned. Download only from the project GitHub Release page, verify checksums when provided, or build from source.

## Screenshot

Screenshot placeholder: use only generated fixture books or your own non-private test EPUBs when adding screenshots. Do not commit screenshots of real user libraries or copyrighted book content.

## Quick Start

```bash
npm install
npm run dev
```

Use Settings to configure a compatible API provider, or enable the mock translator for local dry runs.

## Current Features

- Import reflowable `.epub` files.
- Translate XHTML text nodes while preserving inline structure and resources.
- Resume and retry chapter-level translation jobs.
- Export translated EPUB files.
- View validation reports and optional external EPUBCheck output.
- Track export history.
- Refresh export history file status and remove missing records.
- Save and auto-load per-book translation profiles.
- Export privacy-safe diagnostic bundles for issue reports.
- Run generated EPUB fixture regression tests.
- Review reader compatibility notes for manual alpha checks.
- Use a Chinese-first, modernized desktop UI for the import, translation, export, jobs, and settings workflows.
- Import and translate copyable text PDFs, then export a readable translated PDF.

## Development

```bash
npm run build
npm test
npm audit
```

## Packaging

```bash
npm run pack
npm run dist
```

Packaging uses electron-builder. Artifacts are written to `release/`, which is ignored by git. Windows packaging is the primary target; Linux AppImage is configured as a secondary target. macOS packaging is roadmap-only.

Before publishing a public alpha, follow the [manual reader validation checklist](docs/releases/MANUAL_READER_VALIDATION_CHECKLIST.md), [RC burn-down](docs/releases/RC_BURNDOWN.md), [checksum instructions](docs/releases/INSTALLER_CHECKSUMS.md), and [Windows unsigned warning](docs/releases/WINDOWS_UNSIGNED_WARNING.md).

Phase 2.8 decision status: CONDITIONAL_GO. Automatic checks, packaging, dist artifact generation, and checksum recording passed, but visible UI verification and real reader validation still need to be completed before treating the public alpha as fully verified.

Phase 2.9 final validation status: CONDITIONAL_GO. App and portable processes start, Calibre reader process smoke opened a temporary validated minimal EPUB, but visual UI and visible reader text confirmation remain incomplete.

Public alpha prerelease published: [BookTrans Desk v0.2.9 Public Alpha (Conditional)](https://github.com/conanxin/booktrans-desk/releases/tag/v0.2.9-public-alpha-conditional). Final decision remains CONDITIONAL_GO.

Packaged app hotfix status: `v0.2.12-white-screen-hotfix` fixes the Windows packaged renderer white screen caused by preload ESM/CommonJS mismatch and absolute Vite asset paths. Users of the public alpha package should upgrade to the hotfix release once published.

Chinese UI redesign status: `v0.2.14-chinese-ui-redesign` updates the alpha UI copy, navigation, workflow layout, settings panel, progress panel, validation report, jobs, exports, and visual styling for Chinese testers.

## Release Check

```bash
npm run release:check
npm run labels:print
```

The release check runs build, tests, audit, version consistency checks, release document checks, label JSON validation, and a repository safety scan for tracked `.env`, EPUB binaries, generated build folders, and common credential patterns.

`npm run labels:print` prints optional GitHub label sync instructions without making GitHub API calls or reading tokens.

## Privacy Model

- EPUB import is local.
- Text is sent to your configured model provider only when you start translation.
- API keys are stored in local Electron settings.
- Job cache, export history, and per-book profiles do not store API keys.
- External EPUBCheck is optional and runs as a local command.

See [docs/alpha/PRIVACY_NOTICE.md](docs/alpha/PRIVACY_NOTICE.md) and [docs/SECURITY.md](docs/SECURITY.md).

## Supported EPUB Scope

Supported target: reflowable EPUB.

Unsupported formats: fixed-layout EPUB, DRM EPUB, scanned/image-only PDF OCR, encrypted PDF, MOBI, AZW3.

PDF support: text PDFs only. Scanned PDFs, image-only PDFs, encrypted PDFs, OCR, exact layout preservation, and table/formula reconstruction are not supported in Phase 3A.

## Documentation

- [Alpha Tester Guide](docs/alpha/ALPHA_TESTER_GUIDE.md)
- [Test Plan](docs/alpha/TEST_PLAN.md)
- [Triage Guide](docs/triage/TRIAGE_GUIDE.md)
- [Compatibility Matrix](docs/EPUB_COMPATIBILITY_MATRIX.md)
- [Reader Compatibility Notes](docs/READER_COMPATIBILITY_NOTES.md)
- [Test Fixtures](docs/TEST_FIXTURES.md)
- [Alpha Release Checklist](docs/releases/ALPHA_RELEASE_CHECKLIST.md)
- [v0.2.5 RC Release Notes](docs/releases/v0.2.5-alpha-rc.md)
- [GitHub Release Draft](docs/releases/GITHUB_RELEASE_DRAFT_v0.2.6-public-alpha-prep.md)
- [v0.2.8 GitHub Release Draft](docs/releases/GITHUB_RELEASE_DRAFT_v0.2.8-public-alpha.md)
- [Installer Checksums](docs/releases/INSTALLER_CHECKSUMS.md)
- [v0.2.8 Release Checksums](docs/releases/RELEASE_CHECKSUMS_v0.2.8-public-alpha.md)
- [Release Checksum Results](docs/releases/RELEASE_CHECKSUMS_v0.2.6-public-alpha-prep.md)
- [Manual Reader Validation Results](docs/releases/MANUAL_READER_VALIDATION_RESULTS.md)
- [Packed App Launch Results](docs/releases/PACKED_APP_MANUAL_LAUNCH_RESULTS.md)
- [Phase 2.9 Final Validation Burn-down](docs/PHASE_2_9_FINAL_VALIDATION_BURNDOWN_REPORT.md)
- [Public Alpha Publication Record](docs/releases/PUBLIC_ALPHA_PUBLICATION_RECORD.md)
- [White Screen Troubleshooting](docs/troubleshooting/WHITE_SCREEN.md)
- [Phase 2.12 White Screen Hotfix Report](docs/PHASE_2_12_WHITE_SCREEN_HOTFIX_REPORT.md)
- [Phase 2.14 Chinese UI Redesign Report](docs/PHASE_2_14_CHINESE_UI_REDESIGN_REPORT.md)
- [PDF Translation Pipeline](docs/PDF_TRANSLATION_PIPELINE.md)
- [PDF Support Limitations](docs/PDF_SUPPORT_LIMITATIONS.md)
- [Phase 3A PDF Translation MVP Report](docs/PHASE_3A_PDF_TRANSLATION_MVP_REPORT.md)
- [Phase 3A Manual PDF Validation Report](docs/PHASE_3A_MANUAL_PDF_VALIDATION_REPORT.md)
- [Phase 3B Translation Output Quality Fix Report](docs/PHASE_3B_TRANSLATION_OUTPUT_QUALITY_FIX_REPORT.md)
- [Phase 3C PDF Translation Failure Diagnostics Report](docs/PHASE_3C_PDF_TRANSLATION_FAILURE_DIAGNOSTICS_REPORT.md)
- [Windows Unsigned Warning](docs/releases/WINDOWS_UNSIGNED_WARNING.md)
- [RC Burn-down](docs/releases/RC_BURNDOWN.md)
- [Roadmap](docs/ROADMAP.md)

## License

MIT. See [LICENSE](LICENSE).
