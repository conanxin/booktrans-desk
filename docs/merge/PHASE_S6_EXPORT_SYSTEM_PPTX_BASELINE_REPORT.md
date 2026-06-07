# Phase S6: Export System / PPTX Baseline Report

## Stage Goal

Expand DocuMuse Studio export capabilities around persisted analysis/chat state, add practical Markdown presets, add a full archive ZIP, and implement a minimal PPTX baseline without changing release status.

## Modified Files

- `src/main/export/exportCenter.ts`
- `src/main/export/exportCenter.test.ts`
- `src/main/export/exportPresets.ts`
- `src/main/export/fullArchiveExporter.ts`
- `src/main/export/pptxExporter.ts`
- `src/main/ipc.ts`
- `src/main/preload.cts`
- `src/renderer/App.tsx`
- `src/renderer/styles/main.css`
- `docs/merge/NEXT_DEVELOPMENT_QUEUE.md`
- `docs/merge/PPTX_BASELINE_MIGRATION_NOTES.md`
- `docs/merge/PHASE_S6_EXPORT_SYSTEM_PPTX_BASELINE_REPORT.md`

## Design Rationale

S6 turns the persisted document knowledge state into reusable materials. Instead of adding new AI or parsing capabilities, it expands export formats and presets so users can take analysis/chat outcomes into reading notes, research workflows, presentations, podcast prep, and archives.

## New Export Presets

- `study-notes`
  - Summary, key points, keywords, Q&A highlights, source hints, and personal notes placeholder.
- `research-digest`
  - Research object, core question, argument trail, findings, limitations, quotable points, and sources.
- `presentation-outline`
  - 5-8 slide-style outline with bullets, speaker-note placeholders, and source hints.
- `podcast-prep`
  - Show title ideas, opening draft, discussion questions, segment outline, quotes, closing summary, and extension questions.

## Full Archive ZIP

The full archive baseline contains:

- `README.md`
- `document.json`
- `analysis.md`
- `chat.md`
- `study-notes.md`
- `research-digest.md`
- `presentation-outline.md`
- `podcast-prep.md`

It does not include the original EPUB/PDF, API keys, temp fixtures, release artifacts, or `node_modules`.

## PPTX Evaluation Result

DocuMuse full PPTX exporter uses `pptxgenjs` and supports rich templates. S6 does not migrate that full system. The baseline implementation uses existing `adm-zip` to write a minimal OpenXML PPTX package.

## PPTX Implementation Status

Implemented as baseline / experimental export.

Slides:

- Cover
- Summary
- Key points
- Presentation outline
- Chat highlights
- Sources

Known manual validation still required:

- Open generated PPTX in PowerPoint.
- Open generated PPTX in WPS or LibreOffice.
- Check Chinese text rendering and layout overflow.

## UI Changes

- The Export panel now includes:
  - Document Markdown
  - Document JSON
  - Chat Markdown
  - Analysis Markdown
  - Study Notes
  - Research Digest
  - Presentation Outline
  - Podcast Prep
  - Full Archive ZIP
  - Baseline PPTX
- Preset purpose descriptions are visible in the panel.
- Baseline PPTX is explicitly described as experimental and not the full template system.

## IPC / Preload Changes

New IPC handlers:

- `export:presets`
- `export:presetMarkdown`
- `export:fullArchive`
- `export:pptx`

New preload methods:

- `listExportPresets`
- `exportPresetMarkdown`
- `exportFullArchive`
- `exportBaselinePptx`

Renderer still does not receive direct filesystem access.

## Test Results

- Baseline before S6:
  - `npm run build`: passed.
  - `npm test`: passed, 48 test files / 181 tests.
  - `npm run release:check`: passed.
- After implementation:
  - `npm run build`: passed.
  - `npm test`: passed, 48 test files / 184 tests.
  - `npm run release:check`: passed.

## Dev Smoke Check

- `npm run dev` smoke was started in the desktop environment.
- Vite reached ready state at `http://127.0.0.1:5173`.
- TypeScript watch reported 0 errors.
- Electron attempted to start but hit `ERR_FAILED (-2) loading 'http://127.0.0.1:5173'` in this environment.
- Real click-through remains `BLOCKED_MANUAL`; no manual desktop PASS is claimed.

## Real Desktop Validation Status

Real desktop click-through remains `BLOCKED_MANUAL` from S5. Export dialogs, generated ZIP, and generated PPTX still require manual validation in a Windows desktop session.

## Known Limitations

- PPTX baseline is experimental.
- Full DocuMuse PPTX theme/template system is not migrated.
- Export history does not yet fully track unified document knowledge exports.
- Generated PPTX is tested structurally, not visually.
- Real desktop export dialogs are still `BLOCKED_MANUAL`.

## PDF Translation HOLD Confirmation

PDF translation remains experimental. No public release flag was changed, no GitHub Release was created, and this branch was not merged to master.

## Modification Impact Analysis

- Existing Markdown, JSON, Chat Markdown, and Analysis Markdown exports remain available.
- New exports are additive.
- EPUB translation job flow is untouched.
- No database, OCR, vector DB, cloud sync, login, or release automation was introduced.
- No generated ZIP/PPTX artifacts are committed.

## Current System Status

DocuMuse Studio now has unified document import, reading, analysis, Q&A, persistence, and expanded export capabilities. Users can turn EPUB/PDF documents into local knowledge objects and further export study notes, research digests, presentation outlines, podcast prep materials, full archive ZIP packages, and baseline PPTX slide decks. PPTX is implemented as a minimal baseline and still needs external-reader validation before becoming a formal presentation export. EPUB translation continues to use existing BookTrans capabilities; PDF translation remains experimental and public release remains HOLD.

## S7 Recommendation

Proceed to export polish and packaged manual validation:

- Run real desktop export dialog validation.
- Open ZIP archive and PPTX outputs externally.
- Integrate unified document exports with export history.
- Evaluate bilingual Markdown/HTML export scope.
