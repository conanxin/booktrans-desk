# BookTrans Desk

[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-lightgrey)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-v0.2.8--public--alpha-orange)](CHANGELOG.md)

BookTrans Desk is an open source desktop alpha for translating reflowable EPUB books into Simplified Chinese with an OpenAI-compatible API. It is local-first: no telemetry, no account system, no cloud sync, and no bundled commercial EPUB content.

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

Unsupported formats: fixed-layout EPUB, DRM EPUB, PDF, MOBI, AZW3.

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
- [Windows Unsigned Warning](docs/releases/WINDOWS_UNSIGNED_WARNING.md)
- [RC Burn-down](docs/releases/RC_BURNDOWN.md)
- [Roadmap](docs/ROADMAP.md)

## License

MIT. See [LICENSE](LICENSE).
