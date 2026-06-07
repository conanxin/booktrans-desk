# Phase S9: Translation Version Persistence / Selected Translation Polish Report

## Stage Goal

Persist translation results as long-lived `UnifiedDocument.translationVersions`, let bilingual exports choose a translation version, refresh snapshots from EPUB/PDF translation paths where possible, and add a minimal selected chapter/page/unit translation baseline without changing PDF public release status.

## Modified Files

- `src/shared/documentModel.ts`
- `src/shared/types.ts`
- `src/main/translate/translationVersionService.ts`
- `src/main/translate/translationVersionService.test.ts`
- `src/main/document/documentLibraryStore.ts`
- `src/main/document/documentLibraryStore.test.ts`
- `src/main/export/bilingualExportCore.ts`
- `src/main/export/bilingualMarkdownExporter.ts`
- `src/main/export/bilingualMarkdownExporter.test.ts`
- `src/main/export/bilingualHtmlExporter.ts`
- `src/main/export/exportCenter.ts`
- `src/main/ipc.ts`
- `src/main/preload.cts`
- `src/renderer/App.tsx`
- `src/renderer/styles/main.css`
- `tests/exportHistoryStore.test.ts`
- `docs/merge/NEXT_DEVELOPMENT_QUEUE.md`
- `docs/merge/BILINGUAL_EXPORT_EVALUATION.md`
- `docs/merge/TRANSLATION_VERSION_MODEL.md`
- `docs/merge/PHASE_S9_TRANSLATION_VERSION_PERSISTENCE_REPORT.md`

## Design Rationale

S8 made bilingual Markdown/HTML possible, but reliable bilingual export needs translated text to become part of the same local document object as reading, analysis, chat, and export state. S9 adds a version layer so the app can keep multiple translation snapshots, resolve the best match for a selected scope, and export real translated text when available while still showing honest placeholders when it is not.

## Translation Version Model

`TranslationVersion` now supports:

- `id`, `label`, `documentId`
- `sourceFormat`
- `source`: `epub-translation`, `pdf-experimental`, `manual`, `imported`, or `missing`
- `scope`: full document, chapter, page, or units
- `status`: completed, partial, failed, or stale
- `provider`, `model`, `style`, `jobId`
- `translatedUnitCount`, `totalUnitCount`, `missingUnitCount`
- `units` plus compatibility `unitTranslations`
- `createdAt` and `updatedAt`

`TranslatedUnit` now records source unit id, source hash/preview, translated text, status, source, optional error, and update time. The model keeps old snapshots compatible when `translations` or richer fields are missing.

## EPUB Full Translation Snapshot Status

EPUB full translation completion builds an `epub-translation` version by mapping translated chapter output back to UnifiedDocument units. Translated EPUB export also attempts a best-effort snapshot refresh from the current job result before writing the EPUB. Snapshot persistence failure is treated as a warning path and does not break the existing BookTrans translated EPUB flow.

## EPUB Retry / Resume Snapshot Refresh Status

Retry/resume paths refresh snapshots from the completed job result where the current code can access translated chapters. If a job result contains one translated chapter, it can become a chapter-scoped version; if it contains broader completed chapter state, it refreshes a full-scope version. Deeper XHTML-preserving diff/merge remains future work.

## PDF Experimental Snapshot Status

PDF translation results can create `pdf-experimental` translation versions, including page-scoped versions for selected-page translation. This is internal state for bilingual export and does not change the release decision: PDF translation remains experimental and public release remains HOLD.

## Selected Chapter / Page / Unit Translation Status

Added selected translation handlers:

- EPUB current chapter translation creates a chapter-scoped translation version.
- PDF current page translation creates a page-scoped `pdf-experimental` translation version.
- Selected units translation is available as a service/IPC helper and is covered by tests.

The EPUB selected-chapter baseline translates UnifiedDocument text units for snapshot/export use. It does not yet reconstruct XHTML-preserving translated EPUB chapter output.

## Bilingual Export Version Picker Status

Bilingual export now accepts version resolution options:

- latest matching version
- specific selected `translationVersionId`
- no-translation mode, which forces missing placeholders

Resolution prefers exact scope matches, then full-document versions, then the latest usable completed/partial version. Selected chapter/page exports can use scoped versions or fall back to full versions.

## UI Changes

The unified workspace export side panel now includes a Translation Versions section:

- lists available versions
- shows scope, status, translated/total counts, provider/model/style, and updated time
- lets the user choose latest, a specific version, or missing fallback
- exposes current EPUB chapter translation
- exposes experimental current PDF page translation with a HOLD note
- passes the selected version option into bilingual Markdown/HTML export

## IPC / Preload Changes

Added renderer-safe APIs:

- `translation:versions`
- `translation:translateCurrentChapter`
- `translation:translateCurrentPageExperimental`
- `translation:translateUnits`

Preload exposes matching methods without exposing Node filesystem access or provider secrets.

## Export History Changes

Bilingual export history can record:

- `translationVersionId`
- `translationVersionLabel`
- translation status summary
- selected export scope

Existing translation export history remains separate and compatible.

## Test Results

- `npm run build`: passed.
- `npm test`: passed, 52 test files / 211 tests.
- `npm run release:check`: passed.

New and updated tests cover:

- building EPUB translation versions from translated chapter results
- building PDF experimental page translation versions
- selected unit translation with a mock translator
- latest/specific/no-translation resolution for bilingual export
- document library translation version add/list/latest behavior
- export history records for selected translation versions

## Release Check Result

`npm run release:check` passed:

- build passed
- tests passed
- audit found 0 vulnerabilities
- repository safety scan passed

## Dev Smoke Check

`npm run dev` smoke was started and then stopped:

- Vite reached ready state at `http://127.0.0.1:5173`.
- TypeScript watch reported 0 errors.
- stderr log was empty.
- No real desktop click-through was completed in this environment, so manual UI validation remains `BLOCKED_MANUAL`.

## Real Desktop Validation Status

Real desktop click-through remains `BLOCKED_MANUAL`. This report does not claim that selected translation buttons, version selection, or bilingual exports were manually completed in a Windows desktop window.

## PDF Translation HOLD Confirmation

PDF translation remains experimental. S9 can persist internal `pdf-experimental` translation snapshots and use them for internal bilingual export, but public PDF translation release remains HOLD.

## Unfinished Capabilities

- XHTML-preserving selected EPUB chapter translation.
- Rich selected-unit multi-select UI.
- Translation version diff/compare.
- Manual Windows desktop click-through for selected translation and bilingual export version picker.
- Bilingual PDF export.
- Public PDF translation release.

## Modification Impact Analysis

- Existing EPUB full translation and translated EPUB export remain in place.
- Existing analysis/chat persistence remains unchanged.
- Existing Markdown/JSON/ZIP/PPTX exports remain compatible.
- Bilingual export becomes more useful when real translations exist, while missing fallback remains explicit.
- No database, OCR, embeddings, cloud sync, login, release automation, or public alpha was introduced.
- No generated export artifacts, real EPUB/PDF files, API keys, or release artifacts are committed.

## Current System Status

DocuMuse Studio now has promoted translation results into persisted `UnifiedDocument` translation versions. EPUB/PDF documents can be read, analyzed, queried, exported bilingually, and associated with selectable translation versions so bilingual Markdown / HTML can use real translated text instead of transient results. EPUB translation continues to use existing BookTrans capabilities; PDF translation remains experimental and public release remains HOLD.

## S10 Recommendation

Proceed to README and merge-branch product framing:

- Update the README to explain the DocuMuse Studio merge branch and current internal alpha capabilities.
- Keep limitations, manual validation requirements, and PDF translation HOLD visible.
- Avoid release creation until real desktop click-through is complete.
