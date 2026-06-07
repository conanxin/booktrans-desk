# Validation Checklist

## Automated

- `npm install` / `npm ci`
- `npm run build`
- `npm test`
- `npm run release:check`
- `npm run pack`

## Manual EPUB

- Manual import EPUB.
- Manual read EPUB chapter structure.
- Manual analyze EPUB.
- Manual ask EPUB question.
- Manual translate EPUB.
- Manual export EPUB.
- Manual Markdown export.
- Manual JSON export.
- Manual app restart and reopen document library.

## Manual PDF

- Manual import text PDF.
- Manual read PDF page paragraphs.
- Manual PDF analysis.
- Manual PDF Q&A.
- Manual document library persistence.
- Manual app restart and reopen PDF snapshot.

## Optional

- Optional PPTX export if implemented.
- Optional bilingual HTML preview if implemented.
- Optional selected chapter/page translation if implemented.

## Release Gate

Do not mark public release ready until packaged UI validation has passed with real EPUB and text-PDF files.

