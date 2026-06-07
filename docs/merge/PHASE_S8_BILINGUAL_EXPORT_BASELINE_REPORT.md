# Phase S8: Bilingual Markdown / HTML Export Baseline Report

## Stage Goal

Connect UnifiedDocument source units and available translations into bilingual export outputs. S8 adds bilingual Markdown and HTML baselines, supports full and selected scopes, and keeps missing translations explicit instead of fabricating translated text.

## Modified Files

- `src/shared/documentModel.ts`
- `src/shared/types.ts`
- `src/main/document/documentLibraryStore.ts`
- `src/main/export/bilingualExportCore.ts`
- `src/main/export/bilingualMarkdownExporter.ts`
- `src/main/export/bilingualMarkdownExporter.test.ts`
- `src/main/export/bilingualHtmlExporter.ts`
- `src/main/export/bilingualHtmlExporter.test.ts`
- `src/main/export/exportCenter.ts`
- `src/main/export/exportValidation.ts`
- `src/main/export/exportValidation.test.ts`
- `src/main/ipc.ts`
- `src/main/preload.cts`
- `src/renderer/App.tsx`
- `tests/exportHistoryStore.test.ts`
- `docs/merge/NEXT_DEVELOPMENT_QUEUE.md`
- `docs/merge/BILINGUAL_EXPORT_EVALUATION.md`
- `docs/merge/PHASE_S8_BILINGUAL_EXPORT_BASELINE_REPORT.md`

## Design Rationale

S7 made knowledge exports saveable, verifiable, and traceable. S8 connects the translation side of BookTrans Desk to DocuMuse Studio knowledge export by producing editable bilingual Markdown and browsable bilingual HTML. Bilingual PDF remains deferred because exact layout, fonts, pagination, and visual validation are significantly higher risk.

## Bilingual Data Model

Added or extended:

- `TranslationUnitRecord.sourceUnitId`
- `TranslationUnitRecord.source`
- `TranslationUnitRecord.status` values for `missing` and `experimental`
- `TranslationVersion.source`
- `TranslationVersion.style`
- `BilingualExportScope`
- `BilingualExportOptions`
- `BilingualExportUnit`
- `TranslationSummary`

The exporter reads the latest completed `TranslationVersion` and maps unit translations by `sourceUnitId` or `unitId`.

## Markdown Exporter

`bilingualDocumentToMarkdown(document, scope)` outputs:

- title and bilingual metadata
- source format
- document kind
- scope
- generated timestamp
- translation summary
- one original and translation section per selected unit
- source hint and unit metadata

Missing translations are rendered as `【暂无译文，请先完成翻译或在后续版本生成。】`.

## HTML Exporter

`bilingualDocumentToHtml(document, scope, layout)` outputs:

- single-file HTML
- `<!doctype html>`
- `lang="zh-CN"`
- inline CSS
- side-by-side layout by default
- responsive stacked layout on small screens
- visible source hints
- escaped source and translation text
- no scripts or external assets

## Selected Scope Support

Supported scopes:

- full document
- selected EPUB chapter
- selected PDF page
- selected units through API/helper

The renderer wires current chapter/page selection into bilingual selected export buttons. Complex multi-unit UI selection remains planned.

## Translation Snapshot Support

- EPUB: completed translation jobs create a lightweight `TranslationVersion` snapshot by extracting translated text from translated chapter HTML and mapping it to chapter-level UnifiedDocument units.
- PDF: completed experimental PDF translation results can create a `pdf-experimental` snapshot for internal bilingual export use.
- Missing/partial mappings are preserved as missing translation records.
- Resume/retry/job export snapshot refresh remains S9 follow-up.

## Missing Translation Fallback

If no translated unit text is available, bilingual exports still generate a structured bilingual draft with a clear missing-translation placeholder. The system does not fabricate translations.

## UI Changes

The Export panel now includes:

- Bilingual Markdown · Full
- Bilingual Markdown · Current
- Bilingual HTML · Full
- Bilingual HTML · Current

The panel explains that missing translations become placeholders and that PDF bilingual export does not change PDF translation HOLD status.

## IPC / Preload Changes

New IPC handlers:

- `export:bilingualMarkdown`
- `export:bilingualHtml`

New preload methods:

- `exportBilingualMarkdown(documentId, scope)`
- `exportBilingualHtml(documentId, scope, layout)`

Renderer still does not receive filesystem access.

## Export Validation Changes

Added:

- `validateBilingualMarkdownExport`
- `validateBilingualHtmlExport`

Validation checks original/translation sections, HTML structure, no script tags, source hint presence, and missing translation warnings.

## Export History Changes

Added export kinds:

- `bilingual-markdown`
- `bilingual-html`
- `bilingual-markdown-selected`
- `bilingual-html-selected`

History records now support:

- `exportScope`
- `translationStatusSummary`

## Test Results

- Baseline before S8:
  - `npm run build`: passed.
  - `npm test`: first run hit known PDF fixture/pdfjs timeout fluctuation; rerun passed, 49 test files / 195 tests.
  - `npm run release:check`: passed.
- During implementation:
  - `npm run build`: passed.
  - `npm test`: passed, 51 test files / 203 tests.
- Final validation:
  - `npm run build`: passed.
  - `npm test`: passed, 51 test files / 203 tests.
  - `npm run release:check`: passed.

## Dev Smoke Check

- `npm run dev` smoke was started.
- Vite reached ready state at `http://127.0.0.1:5173`.
- TypeScript watch reported 0 errors.
- No stderr output was captured in the smoke log.
- Real click-through remains `BLOCKED_MANUAL`; no manual desktop PASS is claimed.

## Real Desktop Validation Status

Real desktop click-through remains `BLOCKED_MANUAL`. S8 does not claim that save dialogs, selected exports, or browser opening of HTML were manually completed in this Codex environment.

## PDF Translation HOLD Confirmation

PDF translation remains experimental. PDF bilingual export can emit source text and missing placeholders, and it may use internal experimental translation snapshots, but public PDF translation release remains HOLD.

## Unfinished Capabilities

- Complex selected unit multi-select UI.
- Translation-version picker.
- EPUB resume/retry/job export snapshot refresh.
- Bilingual HTML external browser click-through.
- Bilingual PDF.

## Modification Impact Analysis

- Existing Markdown/JSON/ZIP/PPTX exports remain unchanged.
- Existing EPUB translated export remains unchanged.
- Existing export history remains compatible.
- No database, OCR, embeddings, cloud sync, login, release automation, or public alpha was introduced.
- No generated Markdown/HTML export artifacts are committed.

## Current System Status

DocuMuse Studio now connects EPUB/PDF unified document objects, reading, analysis, Q&A, persistence, knowledge export, and bilingual export. Users can export regular knowledge materials and bilingual Markdown / HTML for editing, checking, and sharing. If translation is not available, the system generates a bilingual draft with clear placeholders and does not fabricate translations. EPUB translation continues to use existing BookTrans capabilities; PDF translation remains experimental and public release remains HOLD.

## S9 Recommendation

Proceed to translation version persistence and selected translation polish:

- Persist snapshots for EPUB resume/retry/job export paths.
- Add selected chapter/page/unit translation that writes directly to `TranslationVersion`.
- Add UI to pick translation version/source for bilingual exports.
- Keep bilingual PDF deferred.
