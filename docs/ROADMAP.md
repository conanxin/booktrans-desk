# Roadmap

## Phase 1

- EPUB import, translation, progress, and export.
- Local OpenAI-compatible settings.
- Mock translator and roundtrip tests.

## Phase 1.5

- Structural EPUB validation after export.
- XHTML DOM text-node translation with inline structure preservation.
- Chapter-level retry/resume state persisted in user data.
- Glossary and style prompt controls.
- OpenAI-compatible timeout, retry, cancellation, and safer error handling.

## Phase 2

- Explicit job picker for resume/retry workflows.
- Optional full epubcheck integration.
- Detailed validation report UI with Markdown copy/save.
- Internal EPUB compatibility matrix.

## Phase 2.1

- Generated EPUB fixture pack and alpha compatibility baseline.
- Enhanced external EPUBCheck output parsing.
- Export history without adding a full library database.
- Per-book translation profiles.

## Phase 2.2

- Release packaging and GitHub Actions.
- Release safety checks.
- Alpha tester kit.
- Open source governance files.

## Phase 2.3 Alpha Feedback Loop

- Triage alpha tester feedback.
- Add issue labels and templates.
- Add export history file existence checks and cleanup.
- Improve EPUBCheck issue grouping and filters.
- Add privacy-safe diagnostic bundle export.

## Phase 2.4 Alpha Stabilization

- Status: completed in `v0.2.4-alpha-stabilization`.
- Add alpha release readiness checklist and release notes.
- Improve diagnostic bundle UX with explicit included, redacted, excluded, and output path summary.
- Add print-only GitHub label sync instructions.
- Strengthen release checks for version consistency and required alpha release documents.

## Phase 2.5 Targeted EPUB Compatibility RC

- Status: completed in `v0.2.5-alpha-rc`.
- Add targeted synthetic fixtures for common real-world EPUB structure boundaries.
- Improve import handling for nav, non-linear spine entries, URL-encoded manifest hrefs, and path separators.
- Add reader compatibility notes and release candidate documentation.
- Strengthen release checks for RC docs and compatibility matrix fixture coverage.

## Phase 2.6 Public Alpha Prep

- Status: current release target `v0.2.6-public-alpha-prep`.
- Add manual reader validation checklist.
- Add RC burn-down criteria.
- Add GitHub Release draft, checksum instructions, and Windows unsigned warning copy.
- Keep manual reader validation and checksum generation outside git artifacts.
- Strengthen release checks for public alpha release prep documents.

## Phase 2.7 Public Alpha Decision

- Status: completed as `CONDITIONAL_GO` documentation.
- Automatic checks passed.
- Packed app process smoke check passed, but visible UI verification remains manual.
- Manual reader validation was not run in the current environment.
- No installer artifact was generated; unpacked executable checksums were recorded for traceability.

## Phase 2.8 Final Public Alpha Release

- Status: completed as `CONDITIONAL_GO`.
- Windows NSIS installer and portable artifacts generated.
- SHA256 checksums recorded for generated artifacts.
- Packed process smoke launch completed for unpacked and portable executables.
- Visual UI verification and reader validation remain pending.

## Phase 3 Local Library Management

- Multi-book local library.
- Cover thumbnails.
- Search.
- Tags.
- Translation versions.
- Batch import.

## Phase 4 Plugin / Provider Profiles

- Provider presets.
- Safer model configuration profiles.
- Optional plugin/provider extension points.

## Phase 5 Multi-format Support

- Explore PDF, MOBI, and AZW3 import paths.
- Keep DRM-protected content out of scope unless legal processing is clearly supported.
- More language targets and richer per-book translation profiles.
- Real-world reader compatibility fixture expansion.

## Current Format Scope

- Current target: reflowable EPUB.
- Not supported: fixed-layout EPUB, DRM EPUB, PDF, MOBI, and AZW3.
- Out of current scope: Calibre integration, batch translation, book library database, user login, cloud sync, online reader, paid systems, plugins, and auto publishing.
