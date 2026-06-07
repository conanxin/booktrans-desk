# Changelog

## Unreleased / v0.3.3-layout-aware-pdf-extraction

- Replace simple PDF page-text concatenation with coordinate-based text blocks and spans.
- Add PDF region classification for title, subtitle, two body columns, quote boxes, headers, footers, and references.
- Sort two-column pages in reading order: left column top-down, then right column top-down, while excluding headers and footers from body translation.
- Reconstruct paragraphs by merging wrapped lines, repairing hyphenated words, and fixing short split names such as `Li` + `u`.
- Translate PDF content as structured paragraph arrays with stable ids, roles, page numbers, and source text.
- Require structured JSON translation responses and reject missing ids, added ids, reordered ids, prompt leakage, and `<think>` output.
- Export translated PDFs from structured paragraph roles and write an adjacent HTML preview for structure review.
- Keep PDF release decision as HOLD pending real packaged UI and exported PDF reader validation.
- Document that EPUB is the current usable alpha path and PDF translation is experimental and currently held from public release until manual packaged UI validation and external reader validation pass.
- Add cross-machine development handoff instructions for continuing from `v0.3.3-layout-aware-pdf-extraction`.

## v0.3.2-pdf-diagnostics-fix

- Fix PDF translation start failures being misreported as raw `Translation canceled` IPC errors.
- Add structured translation error codes and Chinese UI error mapping.
- Separate user cancellation from provider timeout, auth failure, rate limit, network failure, invalid output, and PDF chunking failures.
- Add fresh cancellation state per running translation job.
- Add PDF chunk planning diagnostics and explicit `PDF_NO_TEXT` / `PDF_CHUNKING_FAILED` handling.
- Add MiniMax/OpenAI-compatible model connection test without storing API keys or job state.
- Preserve progress totals on failure instead of overwriting them with `0 / 0`.
- Keep PDF release decision as HOLD pending real MiniMax workflow and external reader validation.

## v0.3.1-translation-quality-fix

- Add MiniMax Token Plan provider preset with request body `thinking.type = disabled`.
- Replace the translation prompt with a strict translation-engine protocol and source text isolation.
- Add translation output sanitizing, validation, repair retry, and failed-chunk placeholder handling for EPUB and PDF translation.
- Block PDF export when translated paragraphs still contain reasoning or prompt leakage.
- Clean noisy PDF metadata titles such as `Microsoft Word - ...doc`.
- Improve translated PDF export wrapping, A4 layout, Chinese font candidates, and non-monospace body text.
- Keep PDF release decision as HOLD pending real packaged UI and external reader validation.

## v0.3.0-pdf-translation-mvp

- Add text PDF import with metadata, page count, page text, paragraph extraction, and scanned-like detection.
- Add PDF translation MVP using existing translators, glossary, style, chunking, cancellation, and progress events.
- Add translated PDF export as a readable reflowed PDF.
- Add lightweight PDF validation.
- Update Chinese UI to import EPUB / PDF and switch page/chapters plus export labels by document type.
- Add synthetic PDF fixture tests for import, translation, export, validation, and history safety.
- Add PDF support and release-gate documentation.
- Record Phase 3A-V manual PDF workflow validation as HOLD because visible packaged UI and external PDF reader-open validation were blocked by the current environment.

## v0.2.14-chinese-ui-redesign

- Localize the renderer UI to Chinese-first copy across navigation, workflow actions, settings, progress, validation, jobs, and exports.
- Redesign the translation workbench around a four-step import/configure/translate/export flow.
- Replace the old heavy-panel visual style with a cleaner light desktop UI using CSS variables, softer cards, restrained tabs, and responsive width constraints.
- Add UI copy regression tests for Chinese tabs, style labels, diagnostic safety copy, and empty states.
- Update alpha docs and roadmap for the Chinese UI redesign phase.

## v0.2.12-white-screen-hotfix

- Fix Windows packaged app white screen by emitting preload as CommonJS `preload.cjs`.
- Fix packaged renderer asset loading by generating relative `./assets/...` paths.
- Add clean `dist/` step to prevent stale preload artifacts from being packaged.
- Add packaged renderer path regression tests and white screen troubleshooting docs.
- Add renderer ErrorBoundary for React render failures.
- Record GitHub prerelease publication URL for `v0.2.9-public-alpha-conditional`.
- Record conditional public alpha publication as a GitHub prerelease.
- Refresh public alpha release checksums after final `npm run dist`.
- Record Phase 2.9 final validation burn-down as CONDITIONAL_GO.
- Add Calibre reader process smoke result for a temporary exported synthetic minimal EPUB.
- Update manual launch result to BLOCKED_BY_ENVIRONMENT because visual UI verification remains unavailable.
- Update GitHub Release draft with final conditional validation wording.
- Prepare `v0.2.8-public-alpha` with CONDITIONAL_GO final release decision.
- Generate Windows NSIS and portable artifacts with SHA256 checksum records.
- Add packed app manual launch results.
- Add v0.2.8 GitHub Release draft.
- Keep reader validation as NOT_RUN_ENVIRONMENT_LIMITED and document that no reader PASS is claimed.
- Record Phase 2.7 public alpha decision as CONDITIONAL_GO.
- Add manual reader validation results documenting environment-limited reader checks.
- Add release checksum traceability notes for unpacked output.
- Update RC burn-down and GitHub Release draft with launch, reader, checksum, and decision status.
- Add manual reader validation checklist for public alpha release prep.
- Add RC burn-down criteria and decision rule.
- Add GitHub Release draft for `v0.2.6-public-alpha-prep`.
- Add installer checksum instructions and Windows unsigned warning copy.
- Update README, alpha docs, privacy notice, roadmap, reader notes, release checklist, and release checks for public alpha prep.

## v0.2.8-public-alpha

- Prepared public alpha documentation, checksums, burn-down records, and conditional release publication notes.

## v0.2.5-alpha-rc

- Add targeted synthetic EPUB regression fixtures for nested sections, split inline text, special entities, nav landmarks, duplicate resource paths, and large chapter progress.
- Skip EPUB nav and non-linear spine items during chapter import.
- Decode manifest hrefs for import path resolution.
- Add reader compatibility notes and release candidate notes.
- Strengthen release checks for RC docs and compatibility matrix coverage.

## v0.2.4-alpha-stabilization

- Add alpha release readiness checklist and v0.2.4-alpha-stabilization release notes.
- Add diagnostic bundle safety summary in the UI and exported bundle.
- Add optional GitHub label sync instruction printer.
- Strengthen release checks for package version, docs, release notes, alpha warning, and label JSON.
- Update alpha docs, security notes, compatibility guidance, and roadmap.

## v0.2.3-alpha-feedback

- Add GitHub issue templates and triage docs.
- Add EPUBCheck issue grouping.
- Add export history path refresh and missing-record cleanup.
- Add privacy-safe diagnostic bundle export.
- Strengthen release safety checks.

## v0.2.2-alpha-packaging

- Add electron-builder packaging configuration.
- Add GitHub Actions CI.
- Add release safety check script.
- Add alpha tester documentation and open source governance files.
- Add release notes for packaging alpha.

## v0.2.1-alpha-quality

- Add generated EPUB fixture pack.
- Add EPUB compatibility regression tests.
- Add external EPUBCheck issue parsing.
- Add export history.
- Add per-book translation profiles.

## v0.2.0-alpha

- Add translation job manager UI.
- Add detailed validation report UI.
- Add optional external EPUBCheck command support.
- Add compatibility matrix.

## v0.1.5-epub-hardening

- Add structural EPUB validator.
- Add XHTML text-node translation.
- Add chapter-level retry/resume persistence.
- Add glossary and style controls.
- Harden OpenAI-compatible translator.

## v0.1.0-mvp

- Complete Electron, React, TypeScript, and Vite desktop MVP.
- Support EPUB import, mock/OpenAI-compatible translation, progress, cancellation, and Chinese EPUB export.
