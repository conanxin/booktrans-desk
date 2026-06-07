# Phase S12 UX: DocuMuse Studio Workspace Shell Report

## Stage Goal

Redesign the renderer UI from a BookTrans Desk translation wizard into a DocuMuse Studio document workbench, without adding backend capabilities, merging `master`, creating a release, publishing alpha, or changing PDF translation HOLD status.

## User Feedback Summary

The main issue was product-line confusion:

- The top of the app still implied `import -> configure translation -> start translation -> export`.
- The left side carried too many unrelated actions: settings, translation, analysis, chat, exports, versions, and history.
- The reading area was crowded by metadata and status cards.
- Export buttons were always visible and visually heavy.
- `start PDF translation` conflicted with `PDF public release remains HOLD`.
- Multiple scroll areas made the reader feel like an engineering console.
- The app did not yet feel like a local AI document workbench.

## Design Rationale

The UI now follows the product spine:

`document library -> reading -> AI assistant -> export / translation tasks`

Translation remains important, especially for EPUB, but it is now a task inside the document context instead of the global app workflow. Reading is the center of the interface, and AI/export/translation/details are contextual tools.

## New Information Architecture

- Top bar: product name, current document title, global status.
- Top nav: Workspace, Tasks, Exports, Settings.
- Left rail: import, document library, recent task status.
- Center: EPUB/PDF reader.
- Right context panel: AI, Export, Translation, Details.

## Left Rail Changes

- Keeps only import, local document library, selected document, and recent task status.
- Removes translation settings, big translation buttons, analysis, chat, export buttons, translation versions, and export history from the left rail.
- Keeps a compact task snapshot with progress and a link to Tasks.

## Center Reader Changes

- The reader is now the main visual area.
- EPUB reader shows chapter selector, selected chapter title, and source units.
- PDF reader shows page selector, page text, source hints, roles, and collapsed metadata.
- Compact document status summary is shown above the reader:
  - format
  - kind
  - chapter/page and unit count
  - analysis status
  - chat count
  - updated time
- Large metadata/status card grids were moved out of the reading surface.

## Right Context Panel Changes

The right panel now uses tabs:

- AI
- Export
- Translation
- Details

This reduces constant visual pressure and keeps tools available without competing with reading.

## Translation Entry Demotion

Translation is no longer the global app flow.

- EPUB full translation is available in the Translation tab.
- Current EPUB chapter translation is available in the Translation tab.
- Translation settings are collapsed under Translation.
- Translation versions are shown in the Translation tab.
- Task progress remains visible but compact.

Existing EPUB translation behavior and export paths remain connected.

## PDF HOLD Expression

PDF translation is only presented as an experimental task in the Translation tab:

`PDF translation: Experimental / HOLD`

The center PDF reader does not show a large HOLD banner. PDF reading, analysis, chat, and knowledge export remain normal workspace capabilities.

## Export Panel Changes

Export is now grouped and contextual:

- Basic exports: Document Markdown, Document JSON, Chat Markdown, Analysis Markdown.
- Generated materials: Study Notes, Research Digest, Presentation Outline, Podcast Prep.
- Bilingual and archive exports: Bilingual Markdown/HTML, Full Archive ZIP, Baseline PPTX.
- Recent export history remains available inside the Export tab.

Buttons are no longer always present in the left rail or reading area.

## AI Panel Changes

The AI tab contains:

- Quick analysis
- Analysis result display
- Document chat input
- Chat history
- Sources

Empty states explain what the user can ask or do next.

## Details Panel Changes

The Details tab contains:

- filename
- source path
- source format
- document kind
- chapter/page/unit counts
- parser
- layout/bbox availability
- updated time
- outline
- parse diagnostics
- validation report if present

These technical details no longer crowd the reading view.

## Modified Files

- `src/renderer/App.tsx`
- `src/renderer/components/TranslationSettings.tsx`
- `src/renderer/styles/main.css`
- `tests/uiCopy.test.ts`
- `docs/merge/NEXT_DEVELOPMENT_QUEUE.md`
- `docs/merge/S11_BUG_LIST.md`
- `docs/merge/MERGE_TO_MASTER_DECISION_REPORT.md`
- `docs/merge/INTERNAL_ALPHA_READINESS_REPORT.md`
- `docs/merge/PHASE_S12_UX_DOCUMUSE_STUDIO_SHELL_REPORT.md`

## Test Results

- `npm run build`: passed.
- `npm test`: first run hit the known PDF fixture/pdfjs timeout fluctuation; rerun passed, 52 test files / 211 tests.
- `npm run release:check`: first run hit the same PDF timeout fluctuation inside test; rerun passed.

Updated tests:

- `tests/uiCopy.test.ts` now checks the DocuMuse Studio workspace shell, contextual translation labels, PDF HOLD copy, and new empty-state copy.

## Release Check Result

`npm run release:check` passed after rerun:

- build passed
- tests passed
- audit found 0 vulnerabilities
- repository safety scan passed

## Dev Smoke Result

`npm run dev` smoke was run:

- Vite ready: PASS.
- TypeScript watch: PASS, 0 errors.
- Electron process startup: PASS_PROCESS_SMOKE; Electron main, GPU, utility, and renderer processes were observed.
- stderr: empty.
- Real desktop click-through: still `BLOCKED_MANUAL`.

## Unfinished Capabilities

- Real Windows desktop click-through of the redesigned shell.
- S11 packaging blocker around `release\win-unpacked`.
- Selected-unit multi-select UI.
- Translation version diff/compare.
- XHTML-preserving selected EPUB chapter translation.
- Bilingual PDF.
- OCR, vector DB, cloud sync, SQLite, login, and multi-user auth.

## Modification Impact Analysis

- Backend services were not changed.
- IPC/preload contracts were not changed.
- EPUB translation remains reachable.
- Analysis, chat, export, translation versions, and document details remain reachable.
- PDF translation remains experimental / HOLD.
- No release was created.
- No public alpha was published.
- No real documents, export artifacts, release artifacts, or API keys are committed.

## Current System Status

DocuMuse Studio merge branch UI has shifted from a translation wizard to a document workbench. The left rail now focuses on document library and task status, the center focuses on EPUB/PDF reading, and the right panel carries AI assistant, export, translation versions, and details. Translation remains available but is no longer the global product spine; PDF translation remains clearly marked experimental / HOLD. This stage did not add backend capabilities and mainly resolves product-line and information architecture confusion.

## Next Stage Recommendation

Proceed to S13 blocker fixes / manual validation rerun:

1. Start from a clean Windows PowerShell session.
2. Stop stale Electron/Vite/electron-builder processes.
3. Clean ignored `release\win-unpacked`.
4. Re-run `npm run pack`.
5. Complete real Windows click-through on the redesigned workspace shell.
6. Keep PDF translation public release as HOLD.
