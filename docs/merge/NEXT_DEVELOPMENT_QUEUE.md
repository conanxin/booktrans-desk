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

Status: complete.

Goal:

- Selecting a PDF snapshot opens a PDF-oriented reader workspace.
- PDF reader shows pages, paragraph counts, document kind, outline, page/paragraph sources, and text preview.
- Quick analysis and document chat work against PDF units and source pages.
- Markdown/JSON/Chat Markdown export works for PDF snapshots.
- PDF translation remains HOLD for public release.

Completion standard:

- `npm run build` passes.
- `npm test` passes.
- `npm run release:check` passes.
- S3 report is recorded in `docs/merge/PHASE_S3_PDF_READING_ANALYSIS_CHAT_REPORT.md`.

Result:

- PDF snapshots open in the unified workspace with a page-oriented reader.
- Page selection displays page paragraphs with sourceHint, role, unit id, page number, and available bbox metadata.
- Quick analysis and document chat reuse the existing local lightweight services for PDF units.
- Markdown, JSON, Chat Markdown, and Analysis Markdown export work for PDF snapshots.
- PDF translation remains experimental and public release remains HOLD.

## Stage S4: Persistent Analysis / Chat State

Status: complete.

Goal:

- Persist analysis records and chat histories per UnifiedDocument snapshot instead of keeping them only in memory.
- Reopen the app and recover the latest analysis/chat state from the local document library.
- Keep API keys out of persisted analysis/chat records.
- Add clear/delete controls for analysis and chat state.

Completion standard:

- EPUB and PDF documents can be reopened with their saved analysis/chat records.
- `npm run build`, `npm test`, and `npm run release:check` pass.
- Existing EPUB translation and PDF experimental translation flows remain unchanged.
- PDF translation remains HOLD for public release.

Result:

- UnifiedDocument snapshots now carry `analysisState` and `chatMessages`.
- `analysis:start`, `analysis:get`, `chat:ask`, `chat:list`, and `chat:clear` use the local document library as the source of truth.
- Markdown/JSON/Chat Markdown/Analysis Markdown exports can use persisted analysis and chat state.
- The workspace shows analysis status, chat message count, and document updated time.
- Chat history can be cleared from the UI and the change is persisted.

## Stage S5: Real Desktop Validation / Reading UX Polish

Status: complete with BLOCKED_MANUAL items.

Goal:

- Run manual desktop validation with non-sensitive EPUB and text PDF fixtures.
- Confirm analysis/chat persistence across real app restart.
- Polish reader affordances for long EPUB chapters and multi-page PDFs.
- Improve source display for chat and analysis panels.
- Keep PDF translation public release as HOLD.

Completion standard:

- Manual EPUB import, analysis, chat, restart/reopen, and export pass.
- Manual text PDF import, analysis, chat, restart/reopen, and export pass.
- `npm run build`, `npm test`, and `npm run release:check` pass.
- `npm run pack` is evaluated if the validation window allows.

Result:

- Added focused display helpers for workspace status, analysis status, chat source labels, and export labels.
- Polished reader status cards for EPUB/PDF with format, kind, analysis, chat count, updated time, and PDF HOLD status.
- Improved selected chapter/page visual state.
- Folded PDF unit metadata behind details.
- Added chat clear confirmation before deleting persisted chat history.
- Added manual validation checklist and results documents.
- Dev smoke passed, but real desktop click-through remains `BLOCKED_MANUAL` in this Codex environment.

## Stage S6: Export System Expansion / PPTX Migration Baseline

Status: planned.

Goal:

- Expand export center around persisted UnifiedDocument knowledge state.
- Revisit PPTX migration notes and decide whether to add a minimal PPTX exporter.
- Improve export presets for document, analysis, chat, and bilingual materials.
- Keep PDF translation public release as HOLD.

Completion standard:

- Export scope and file formats are documented.
- Markdown/JSON exports remain stable.
- PPTX migration either lands as a small baseline or stays documented as deferred.
- `npm run build`, `npm test`, and `npm run release:check` pass.
