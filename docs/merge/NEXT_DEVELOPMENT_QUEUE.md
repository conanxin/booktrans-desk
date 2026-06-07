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

Stage S1 should focus on the UnifiedDocument library UI:

- Refresh the library after import/delete/export.
- Add document selection persistence.
- Add current document details independent of current translation object.
- Keep the current EPUB translation path untouched.

## Stage S1 Result

Planned implementation:

- Add manual library refresh.
- Add document snapshot delete action.
- Clear current analysis/chat state when the selected snapshot is removed.
- Keep current EPUB/PDF import and translation behavior unchanged.
