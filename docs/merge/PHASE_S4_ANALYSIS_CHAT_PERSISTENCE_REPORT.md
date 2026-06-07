# Phase S4: Analysis / Chat Persistence Report

## Stage Goal

Persist analysis results and document chat history inside local UnifiedDocument snapshots so EPUB/PDF knowledge work survives app restart and document-library reopen.

## Modified Files

- `src/shared/documentModel.ts`
- `src/main/document/documentLibraryStore.ts`
- `src/main/document/documentLibraryStore.test.ts`
- `src/main/analysis/analysisService.ts`
- `src/main/analysis/analysisService.test.ts`
- `src/main/chat/documentChatService.ts`
- `src/main/chat/documentChatService.test.ts`
- `src/main/export/markdownExporter.ts`
- `src/main/export/jsonExporter.ts`
- `src/main/export/exportCenter.test.ts`
- `src/main/ipc.ts`
- `src/renderer/App.tsx`
- `src/renderer/styles/main.css`
- `docs/merge/NEXT_DEVELOPMENT_QUEUE.md`
- `docs/merge/PHASE_S4_ANALYSIS_CHAT_PERSISTENCE_REPORT.md`

## Design Rationale

S2 and S3 made EPUB and PDF usable in the unified reading, analysis, chat, and export workspace, but analysis/chat were still process memory. S4 moves that state into the local document snapshot so the UnifiedDocument becomes the durable local knowledge object, not only a parsed document structure.

## New Persistence Fields

- `analysisState`
  - `status`
  - `mode`
  - `result`
  - `error`
  - `startedAt`
  - `completedAt`
  - `updatedAt`
  - `provider`
  - `model`
- `UnifiedAnalysisResult`
  - summary fields, key points, keywords, language, document type, source ids, and source references.
- `chatMessages`
  - user/assistant messages with source references.
- `ChatSource`
  - `unitId`, `sourceHint`, `pageNumber`, `chapterId`, `chapterTitle`, `role`, `quote`, and `score`.

No API key, Authorization header, or raw provider response is written by these new paths.

## DocumentLibraryStore Changes

- Added `updateDocument`.
- Added `updateDocumentAnalysis`.
- Added `appendDocumentChatMessages`.
- Added `clearDocumentChatMessages`.
- Normalizes old snapshots that do not yet have `analysisState` or `chatMessages`.
- Continues using filesystem JSON under Electron `userData/documents`.

## Analysis Service Changes

- Keeps the existing quick analysis generator.
- Adds `startQuickAnalysisAndPersist` to write running/completed/failed analysis state.
- Adds `getPersistedAnalysis` so `analysis:get` reads the document library first.
- Stores provider/model metadata only as safe labels.

## Chat Service Changes

- Keeps the existing lightweight keyword retrieval.
- Adds `askAndPersist` to append both user and assistant messages in one document snapshot update.
- Adds `listPersisted` and `clearPersisted`.
- Chat sources keep page/chapter/unit/role hints for EPUB and PDF.

## Export Center Changes

- Unified document Markdown now includes persisted analysis and chat history sections.
- JSON export includes safe `analysisState` and `chatMessages`.
- Chat Markdown and Analysis Markdown use persisted document state through IPC.
- JSON export redacts sensitive key names and raw provider response fields.

## UI Changes

- Opening a document loads persisted analysis and chat history.
- After quick analysis or chat ask, the renderer refreshes the current document snapshot.
- Workspace overview shows analysis status, chat message count, and last updated time.
- Analysis panel shows persisted status, updated time, provider, and model.
- Chat panel shows message count, last message time, and a clear button that persists.

## Test Results

- Baseline before S4:
  - `npm run build`: passed.
  - `npm test`: passed, 47 test files / 169 tests.
  - `npm run release:check`: passed.
- After implementation:
  - `npm run build`: passed.
  - `npm test`: passed, 47 test files / 177 tests.
  - `npm run release:check`: passed.

## Dev Smoke Check Result

- `npm run dev`: smoke checked. Vite started at `http://127.0.0.1:5173/`, TypeScript watch reported 0 errors, and no dev processes were left running after cleanup.

## Manual Verification Status

- Not completed with real EPUB/PDF files in this stage.
- Recommended S5 manual validation:
  - Import a non-sensitive EPUB.
  - Run quick analysis.
  - Ask one question.
  - Restart app.
  - Reopen the EPUB from document library and confirm persisted analysis/chat.
  - Repeat with a non-sensitive text PDF.

## Known Limitations

- Analysis/chat are persisted in the document snapshot, but not yet versioned.
- No vector DB, embeddings, OCR, cloud sync, login, or database was introduced.
- Analysis remains lightweight quick analysis.
- Chat remains lightweight keyword retrieval.
- PDF reading uses extracted text paragraphs, not a visual PDF canvas.
- PDF translation remains experimental and public release remains HOLD.

## Impact Analysis

- Existing EPUB translation job store is not replaced or rewritten.
- Existing EPUB translation and export behavior is preserved.
- Existing PDF experimental translation pipeline is preserved and still marked HOLD.
- UnifiedDocument snapshots now grow with analysis/chat state, so future migrations should preserve these fields.
- Old snapshots remain readable through default `analysisState` and `chatMessages` normalization.

## Current System Status

DocuMuse Studio now not only imports EPUB and PDF as unified document objects, but also saves the analysis results and chat history generated around each document back into the local document snapshot. When users reopen the app or re-enter a document from the document library, they can continue viewing previous summaries, key points, keywords, and Q&A records. EPUB translation continues to use BookTrans existing capabilities; PDF translation remains experimental and public release remains HOLD.

## S5 Recommendation

Run real desktop validation and reading UX polish next:

- Verify EPUB analysis/chat persistence across restart.
- Verify text PDF analysis/chat persistence across restart.
- Improve long-content reading ergonomics.
- Improve source rendering in chat/analysis panels.
- Keep build/test/release checks green.
