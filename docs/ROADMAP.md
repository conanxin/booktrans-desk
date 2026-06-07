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

## Phase 2.9 Final Validation Burn-down

- Status: completed as `CONDITIONAL_GO`.
- Automatic checks, pack, and dist passed.
- Windows artifacts and checksums are ready outside git.
- App and portable process smoke checks passed.
- Calibre reader process smoke opened a temporary validated minimal EPUB.
- Visual UI and visible reader text confirmation remain incomplete.

## Phase 2.10 Conditional Public Alpha Publication

- Status: published as GitHub prerelease.
- Release URL: https://github.com/conanxin/booktrans-desk/releases/tag/v0.2.9-public-alpha-conditional
- Final decision remains `CONDITIONAL_GO`.
- Uploaded Windows installer, portable exe, and blockmap artifacts.
- Publication record stored in `docs/releases/PUBLIC_ALPHA_PUBLICATION_RECORD.md`.

## Phase 2.12 Packaged Electron White Screen Hotfix

- Status: hotfix target `v0.2.12-white-screen-hotfix`.
- Fix packaged preload ESM/CommonJS mismatch by emitting `dist/main/preload.cjs`.
- Fix packaged renderer asset paths by using relative Vite assets.
- Add clean `dist/` build step, packaged path regression tests, ErrorBoundary, and white screen troubleshooting documentation.
- Recommend superseding the `v0.2.9-public-alpha-conditional` Windows package for testers who encounter a blank renderer window.

## Phase 2.14 Chinese Localization and Modern UI Redesign

- Status: current target `v0.2.14-chinese-ui-redesign`.
- Localize visible renderer copy to Chinese-first wording while preserving technical terms such as EPUB, API, EPUBCheck, OpenAI-compatible, JSON, and Markdown.
- Rework the translation workbench into a clearer import, configure, translate, and export flow.
- Modernize visual styling with CSS variables, light panels, restrained tabs, softer shadows, responsive max width, and cleaner empty states.
- Keep EPUB import, translation, validation, retry/resume, and export behavior unchanged.

## Phase 3A PDF Import and Text PDF Translation MVP

- Status: current internal target `v0.3.0-pdf-translation-mvp`.
- Support copyable text PDF import, text extraction, page/paragraph/chunk translation, reflowed translated PDF export, and lightweight validation.
- Detect scanned-like PDFs and show an OCR unsupported message.
- Keep OCR, exact layout preservation, bilingual export, table handling, selected page translation, encrypted PDF handling, and batch PDF translation on the roadmap.
- Public PDF release requires packaged UI visible PASS plus exported PDF reader-open PASS.

## Phase 3A-V Manual PDF Workflow Validation

- Status: HOLD.
- Automatic validation, pack, and dist passed for `v0.3.0-pdf-translation-mvp`.
- The packed Windows executable passed a process smoke check, but visible UI confirmation was blocked by the current environment.
- Manual PDF import, translation, export, and external reader-open validation were not completed.
- Next gate is a real Windows desktop validation session before any public PDF release decision.

## Phase 3B Translation Output Quality and PDF Export Fix

- Status: current hardening target `v0.3.1-translation-quality-fix`.
- Fix real MiniMax-M3 output contamination where `<think>`, assistant reasoning, prompt commentary, and English explanations entered translated PDFs.
- Add MiniMax Token Plan preset with thinking disabled.
- Add strict translation prompt, output sanitizer, output validator, repair retry, and failed-chunk placeholder handling across EPUB and PDF.
- Add PDF export quality gate so polluted translations are blocked before writing a PDF.
- Improve translated PDF title cleanup, A4 layout, Chinese font candidates, measured wrapping, and overflow prevention.
- PDF support remains HOLD until real visible UI and reader validation pass.

## Phase 3C PDF Translation Start Failure Diagnostics

- Status: current diagnostics target `v0.3.2-pdf-diagnostics-fix`.
- Fix real MiniMax-M3 PDF translation startup failure reporting raw `Translation canceled`.
- Add structured translation error codes, provider error mapping, timeout/auth/rate-limit separation, and UI-friendly Chinese errors.
- Add fresh cancellation state per job so old cancelled signals cannot contaminate new jobs.
- Add PDF chunk planning diagnostics and explicit no-text/chunking failure codes.
- Add MiniMax connection test in settings.
- PDF support remains HOLD until real MiniMax PDF workflow and external reader validation pass.

## Phase 3D Layout-aware PDF Extraction

- Status: current hardening target `v0.3.3-layout-aware-pdf-extraction`.
- Replace page-level PDF text concatenation with coordinate-based text spans and blocks.
- Classify page regions as title, subtitle, left/right body columns, quote boxes, headers, footers, and references.
- Reconstruct two-column reading order before translation and keep headers/footers out of body translation.
- Translate structured paragraph arrays by stable ids, roles, page numbers, and source text.
- Validate JSON translation responses for complete ids, order preservation, prompt leakage, and `<think>` output.
- Generate an HTML preview next to exported translated PDFs for structure review.
- PDF support remains HOLD until visual packaged UI validation and exported PDF external-reader validation pass.

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

- Expand PDF support beyond text PDF MVP, then explore MOBI and AZW3 import paths.
- Keep DRM-protected content out of scope unless legal processing is clearly supported.
- More language targets and richer per-book translation profiles.
- Real-world reader compatibility fixture expansion.

## Current Format Scope

- Current target: reflowable EPUB.
- PDF support is internal MVP only for copyable text PDFs.
- Not supported: fixed-layout EPUB, DRM EPUB, scanned/image-only PDF OCR, encrypted PDF, MOBI, and AZW3.
- Out of current scope: Calibre integration, batch translation, book library database, user login, cloud sync, online reader, paid systems, plugins, and auto publishing.
