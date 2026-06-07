# Phase S7: Export Polish / Packaged Validation Report

## Stage Goal

Polish S6 export capabilities into a desktop-oriented workflow where users can choose save paths, receive structured success/cancel/error feedback, validate generated files, and track knowledge exports in the existing export history.

## Modified Files

- `src/shared/types.ts`
- `src/main/export/exportHistoryStore.ts`
- `src/main/export/exportValidation.ts`
- `src/main/export/exportValidation.test.ts`
- `src/main/ipc.ts`
- `src/main/preload.cts`
- `src/renderer/App.tsx`
- `src/renderer/components/ExportHistoryPanel.tsx`
- `src/renderer/styles/main.css`
- `tests/exportHistoryStore.test.ts`
- `docs/merge/NEXT_DEVELOPMENT_QUEUE.md`
- `docs/merge/BILINGUAL_EXPORT_EVALUATION.md`
- `docs/merge/PHASE_S7_EXPORT_POLISH_PACKAGED_VALIDATION_REPORT.md`

## Design Rationale

S6 proved that DocuMuse Studio can generate practical knowledge exports. S7 makes those exports easier to save, verify, and audit without changing parsing, translation, or release status. Knowledge exports now share the existing export history path with translation exports while remaining clearly distinguishable.

## Save Dialog Polish

- Document Markdown default: `{safe-title}.documuse.md`
- Document JSON default: `{safe-title}.documuse.json`
- Chat Markdown default: `{safe-title}.chat.md`
- Analysis Markdown default: `{safe-title}.analysis.md`
- Preset Markdown defaults: `{safe-title}.{preset-id}.md`
- Full Archive ZIP default: `{safe-title}.archive.zip`
- Baseline PPTX default: `{safe-title}.deck.pptx`
- User cancel now returns a structured `canceled` result instead of being treated as an error.

## Export Validation

Added validation helpers for:

- Markdown: exists, non-empty, expected title check, sensitive-field warning scan.
- JSON: exists, non-empty, parseable, UnifiedDocument-like structure, sensitive-field warning scan.
- ZIP: exists, non-empty, can open as archive, contains expected entries.
- PPTX: exists, non-empty, can open as ZIP, contains `[Content_Types].xml` and `ppt/presentation.xml`.

## Export History Integration

- Reuses `ExportHistoryStore`.
- Adds `exportCategory: knowledge` for DocuMuse Studio knowledge exports.
- Adds concrete `exportKind` values for document Markdown, JSON, chat Markdown, analysis Markdown, presets, Full Archive ZIP, and PPTX.
- Records source format, document id, document title, source path, output path, created time, and validation status.
- Keeps translation exports compatible with `exportCategory: translation` and translated EPUB/PDF kinds.
- Does not store API keys, authorization headers, or raw provider responses.
- `exports:openFolder` now only opens paths that are already recorded in export history.

## UI Changes

- Export panel shows per-export loading labels.
- Export result card shows saved output path and validation summary.
- Canceled exports show a non-error canceled state.
- Successful exports expose an "Open folder" action.
- Recent knowledge export history appears inside the workspace export panel.
- The global export history list now includes export kind, so knowledge exports and translation exports are distinguishable.

## ZIP Validation Result

Automated ZIP validation passes structurally for Full Archive ZIP. Real desktop archive opening remains `BLOCKED_MANUAL`.

## PPTX Validation Result

Automated PPTX package validation passes structurally. Visual opening in PowerPoint, WPS, or LibreOffice remains `BLOCKED_MANUAL`.

## Pack Result

- `npm run pack`: passed.
- `electron-builder --dir` produced `release\win-unpacked`.
- Package artifacts are not committed.

## Dev Smoke Check

- `npm run dev` smoke was started.
- Vite reached ready state at `http://127.0.0.1:5173`.
- TypeScript watch reported 0 errors.
- No stderr output was captured in the smoke log.
- Real click-through remains `BLOCKED_MANUAL`; no manual desktop PASS is claimed.

## Real Desktop Validation Status

Real desktop click-through remains `BLOCKED_MANUAL`. S7 does not claim that export dialogs or external application opening were manually completed in this Codex environment.

## Bilingual Export Evaluation Summary

`docs/merge/BILINGUAL_EXPORT_EVALUATION.md` recommends S8 implement bilingual Markdown first, then bilingual HTML. Bilingual PDF remains deferred because exact layout, OCR, and selected translation persistence are not mature enough.

## Test Results

- Baseline before S7:
  - `npm run build`: passed.
  - `npm test`: first run hit known PDF fixture/pdfjs timeout fluctuation; rerun passed, 48 test files / 184 tests.
  - `npm run release:check`: passed.
- After implementation:
  - `npm run build`: passed.
  - `npm test`: first run hit the same PDF fixture/pdfjs timeout fluctuation; rerun passed, 49 test files / 195 tests.
  - Final `npm run build`: passed.
  - Final `npm test`: passed, 49 test files / 195 tests.
  - `npm run release:check`: passed.
  - `npm run pack`: passed.

## PDF Translation HOLD Confirmation

PDF translation remains experimental. No release flag was changed, no GitHub Release was created, and this branch was not merged to master.

## Unfinished Capabilities

- Real desktop export click-through.
- External visual opening of generated PPTX.
- Export history deep filtering/search.
- Bilingual Markdown/HTML implementation.
- Bilingual PDF.

## Modification Impact Analysis

- Knowledge exports are additive and do not replace translated EPUB/PDF export.
- Existing translation export history remains readable.
- Renderer still does not receive direct filesystem access.
- Open-folder access is narrower than before because it is restricted to known export paths.
- Generated export artifacts and package artifacts are not committed.

## Current System Status

DocuMuse Studio now has EPUB/PDF unified reading, analysis, Q&A, persistence, and expanded export capabilities. S7 further polishes export workflows into a desktop user path: knowledge exports can be saved with clear names, structurally validated, recorded in export history, surfaced in the UI with output paths and status, and opened through a restricted known-export folder action. Real desktop click-through still needs the user to complete it in a Windows desktop session; EPUB translation continues to use existing BookTrans capabilities; PDF translation remains experimental and public release remains HOLD.

## S8 Recommendation

Proceed to bilingual Markdown / HTML export baseline:

- Add a translation lookup layer for `UnifiedDocument` units.
- Implement bilingual Markdown for whole document and selected chapter/page when translation data is available.
- Add bilingual HTML after Markdown behavior is stable.
- Keep bilingual PDF deferred.
