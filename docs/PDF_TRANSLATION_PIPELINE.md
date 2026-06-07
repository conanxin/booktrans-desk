# PDF Translation Pipeline

Phase 3A adds a first PDF translation MVP for text PDFs.

## Scope

Supported flow:

1. Import PDF.
2. Extract readable text per page.
3. Split text into page, paragraph, and chunk units.
4. Translate with the configured translator, glossary, and style.
5. Export a new readable translated PDF.
6. Run lightweight PDF validation.

## Text Extraction

PDF parsing runs in the Electron main process with `pdfjs-dist`. The importer reads metadata, page count, text items, and page text. Text items are sorted by approximate y/x coordinates, merged into lines, then grouped into paragraphs.

## Scanned-like Detection

The app marks a PDF as scanned-like when extractable text is extremely low or most pages contain almost no text. Scanned-like PDFs are not translated in Phase 3A because OCR is not implemented.

User-facing message:

```text
这个 PDF 可能是扫描版或图片型 PDF。当前版本暂不支持 OCR，请等待后续版本。
```

## Translation

PDF translation reuses:

- OpenAI-compatible translator.
- Mock translator.
- Glossary.
- Style setting.
- Existing chunking logic.
- Cancellation via AbortController.

The unit model is:

```text
page -> paragraph -> chunk
```

## Export

The exporter creates a new reflowed translated PDF. It does not attempt in-place overlay or exact original layout preservation.

Output naming:

```text
original-name.zh.pdf
```

The exported PDF includes title, original filename, translation model, style, generated time, page markers, and translated paragraphs.

## Validation

Lightweight validation checks:

- File exists.
- File size is greater than 0.
- PDF parser can open the file.
- Page count is greater than 0.
- Metadata is readable when available.

This is not PDF/A validation.
