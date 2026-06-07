# Next Development Queue

## P0

- Keep existing EPUB translation usable.
- Complete UnifiedDocument library UI.
- Complete EPUB analysis/chat.
- Complete Markdown/JSON export.
- Fix obvious type conflicts.
- Keep `npm run build` and `npm test` passing.

## P1

- PDF reading workspace.
- PDF translation preview UI.
- Migrate DocuMuse outline editor.
- Migrate DocuMuse document kind override.
- Complete PPTX export migration.
- Export preset packs.

## P2

- DOCX support.
- Bilingual HTML.
- Bilingual Markdown.
- Bilingual PDF.
- Selected chapter/page translation.
- Source history.
- Original-text search.

## P3

- OCR.
- Embeddings / vector DB.
- Local model integration.
- Plugin/provider extension.
- Advanced template editor.

## Next Small Stage

Stage S1: UnifiedDocument library UI is complete.

- Refresh the library after import/delete/export.
- Add document selection persistence.
- Add current document details independent of current translation object.
- Keep the current EPUB translation path untouched.

## Stage S1 Result

- Add manual library refresh.
- Add document snapshot delete action.
- Clear current analysis/chat state when the selected snapshot is removed.
- Keep current EPUB/PDF import and translation behavior unchanged.

## Stage S2: EPUB Reading / Analysis / Chat UI Closure

Status: complete.

Goal:

- EPUB import saves a UnifiedDocument snapshot.
- Selecting an EPUB in the document library opens the unified workspace.
- Reader shows title, filename, document kind, chapter count, unit count, chapter list, and current chapter text.
- Users can select EPUB chapters.
- Quick analysis runs through existing analysis IPC/service and displays summary, key points, keywords, document type, and timestamp.
- Document chat runs through existing chat IPC/service and displays user questions, assistant answers, and sources with chapter/unit/source hints.
- Markdown, JSON, and Chat Markdown export are available from the workspace.
- Existing BookTrans EPUB import, translation, and translated EPUB export remain unchanged.

Completion standard:

- `npm run build` passes.
- `npm test` passes.
- `npm run release:check` passes.
- S2 report is recorded in `docs/merge/PHASE_S2_EPUB_READING_ANALYSIS_CHAT_REPORT.md`.

Result:

- EPUB snapshots open in the unified reader.
- Chapter selection shows the selected chapter text.
- Quick analysis has loading, success, and error states.
- Chat has empty-question handling, loading, success, error, message history, and source display.
- Markdown, JSON, Chat Markdown, and Analysis Markdown export buttons are wired to existing IPC.

## Stage S3: PDF Reading / Analysis / Chat UI Closure

Status: planned.

Goal:

- Selecting a PDF snapshot opens a PDF-oriented reader workspace.
- PDF reader shows pages, paragraph counts, document kind, outline, page/paragraph sources, and text preview.
- Quick analysis and document chat work against PDF units and source pages.
- Markdown/JSON/Chat Markdown export works for PDF snapshots.
- PDF translation remains HOLD for public release.
