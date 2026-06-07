# Manual Desktop Validation Checklist

Use non-sensitive synthetic fixtures only.

Suggested local fixture paths:

- `temp/manual-fixtures/synthetic-reading.epub`
- `temp/manual-fixtures/synthetic-paper.pdf`

## EPUB Manual Validation

- [ ] Import synthetic EPUB.
- [ ] EPUB appears in document library.
- [ ] Open EPUB in unified workspace.
- [ ] Title, filename, document kind, chapter count, unit count, analysis status, chat count, and updated time are visible.
- [ ] Chapter selector works.
- [ ] Selected chapter state is visually clear.
- [ ] Chapter text is visible and readable.
- [ ] Quick analysis completes.
- [ ] Analysis summary, key points, keywords, and metadata are visible.
- [ ] Ask one question.
- [ ] Chat answer returns sources.
- [ ] Sources show chapter/unit/source information.
- [ ] Export Document Markdown succeeds.
- [ ] Export Document JSON succeeds.
- [ ] Export Chat Markdown succeeds.
- [ ] Export Analysis Markdown succeeds.
- [ ] Close the app.
- [ ] Restart the app.
- [ ] Reopen EPUB from document library.
- [ ] Analysis result persists.
- [ ] Chat history persists.
- [ ] Existing EPUB translation flow is still reachable.

## PDF Manual Validation

- [ ] Import synthetic text PDF.
- [ ] PDF appears in document library.
- [ ] Open PDF in unified workspace.
- [ ] Title, filename, document kind, page count, unit count, analysis status, chat count, and updated time are visible.
- [ ] PDF translation status shows Experimental / HOLD.
- [ ] Page selector works.
- [ ] Selected page state is visually clear.
- [ ] Page paragraphs are visible and readable.
- [ ] sourceHint / role are visible without crowding text.
- [ ] Unit id / bbox metadata is available in folded source metadata.
- [ ] Quick analysis completes.
- [ ] Ask one question.
- [ ] Chat answer returns page/source/unit sources.
- [ ] Export Document Markdown succeeds.
- [ ] Export Document JSON succeeds.
- [ ] Export Chat Markdown succeeds.
- [ ] Export Analysis Markdown succeeds.
- [ ] Close the app.
- [ ] Restart the app.
- [ ] Reopen PDF from document library.
- [ ] Analysis result persists.
- [ ] Chat history persists.
- [ ] PDF translation still shows Experimental / HOLD.

## Required Commands

```powershell
cd D:\WSL\Codex\booktrans-desk
git checkout merge-documuse-studio
git pull
npm run dev
```
