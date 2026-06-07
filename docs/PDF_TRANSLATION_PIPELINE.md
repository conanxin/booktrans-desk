# PDF Translation Pipeline

Phase 3A adds a first PDF translation MVP for text PDFs.

Phase 3B adds translation output quality hardening after real testing found model reasoning and prompt commentary in exported PDFs.

Phase 3C adds startup diagnostics after real MiniMax testing found raw `Translation canceled` errors at the translation start/provider-call stage.

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
- MiniMax Token Plan provider preset with `thinking.type = disabled`.
- Mock translator.
- Glossary.
- Style setting.
- Existing chunking logic.
- Cancellation via AbortController.

Each chunk now runs through:

1. strict translation-engine prompt with `<source_text>` isolation,
2. output sanitizing,
3. output validation,
4. repair retry up to two times,
5. visible failed-chunk placeholder if the output remains invalid.

Before provider calls, the PDF pipeline builds a chunk plan. If no extractable text exists it returns `PDF_NO_TEXT`; if text exists but no chunks can be generated it returns `PDF_CHUNKING_FAILED`.

Provider and cancellation failures are mapped to structured codes:

- `USER_CANCELLED`
- `PROVIDER_AUTH_FAILED`
- `PROVIDER_RATE_LIMITED`
- `PROVIDER_TIMEOUT`
- `PROVIDER_REQUEST_FAILED`
- `TRANSLATION_OUTPUT_INVALID`

Diagnostic logs include page count, text length, chunk count, provider preset, model, request text length, and error code. They do not include API keys, Authorization headers, full source text, or full translations.

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

Before export, translated paragraphs are checked again. If reasoning or prompt leakage such as `<think>`, `The user wants`, or `Translation:` remains, export is blocked with `PDF_EXPORT_BLOCKED_TRANSLATION_INVALID`.

PDF titles are cleaned before writing metadata. Noisy titles such as `Microsoft Word - Draft.doc` are converted to a clean title or replaced with the source filename basename.

Layout uses A4 sizing, Chinese-friendly font candidates, measured line wrapping, pre-wrap style behavior, break-word behavior, and non-monospace body text.

## Validation

Lightweight validation checks:

- File exists.
- File size is greater than 0.
- PDF parser can open the file.
- Page count is greater than 0.
- Metadata is readable when available.

This is not PDF/A validation.
