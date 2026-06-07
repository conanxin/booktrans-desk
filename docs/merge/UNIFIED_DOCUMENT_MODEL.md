# Unified Document Model

## Goals

The merged product needs one document model that covers EPUB chapters, PDF pages and layout blocks, future DOCX sections, analysis output, chat history, translation versions, and export records.

The model must be local-first, serializable to JSON, independent of Next.js, and usable from Electron main services and renderer views.

## Core Types

```ts
type SourceFormat = "pdf" | "epub" | "docx";

interface UnifiedDocument {
  id: string;
  sourceFormat: SourceFormat;
  sourcePath: string;
  title: string;
  metadata: Record<string, string | number | boolean | null>;
  units: DocumentUnit[];
  chapters: DocumentChapter[];
  outline: UnifiedDocumentOutlineNode[];
  documentKind?: UnifiedDocumentKind;
  translations: TranslationVersion[];
  exports: ExportRecord[];
  diagnostics: UnifiedParseDiagnostics;
  createdAt: string;
  updatedAt: string;
}
```

### DocumentUnit

`DocumentUnit` is the smallest stable reading, analysis, chat-source, and translation anchor.

- EPUB: usually one unit per chapter at first, later paragraphs or HTML blocks.
- PDF: one unit per paragraph or layout block, preserving page and coordinate metadata.
- DOCX: future paragraphs, headings, tables, or sections.

Important fields:

- `id`
- `documentId`
- `sourceFormat`
- `role`
- `text`
- `order`
- `chapterId`
- `pageNumber`
- `bbox`
- `sourceHref`
- `metadata`

### DocumentChapter

`DocumentChapter` groups units into a human navigation structure.

- EPUB chapter maps directly to `DocumentChapter`.
- PDF page can become a synthetic chapter when no outline is available.
- PDF detected heading ranges can later become richer chapters.

### TranslationVersion

`TranslationVersion` records translated content without replacing original source units.

It stores:

- provider and model
- target language
- status
- translated unit count
- job id when created by the BookTrans job system
- unit-level translation records

### ExportRecord

`ExportRecord` tracks generated artifacts across knowledge export and translated export.

Formats include:

- `epub`
- `pdf`
- `markdown`
- `json`
- `pptx`
- `zip`
- `html`

### DocumentKind

Document kind describes the likely genre:

- `paper`
- `interview`
- `business-report`
- `fiction`
- `manual`
- `book-chapter`
- `article`
- `unknown`

It includes confidence, reasons, signals, and `detectedAt`.

### Outline

Outline nodes are shared by EPUB table-of-contents style navigation and PDF detected structure.

Each node can point to:

- a `DocumentUnit`
- a `DocumentChapter`
- a page number
- source coordinates

### ParseDiagnostics

Diagnostics keep parse quality visible:

- warning and error lists
- parser name and version
- text length
- page count
- chapter count
- scanned-like PDF flag
- unsupported feature notes

## Mapping From Existing Projects

### DocuMuse ParsedDocument To UnifiedDocument

DocuMuse pages, paragraphs, sections, outline, document kind, analysis results, chat source anchors, and coordinate metadata map into:

- pages / paragraphs -> `DocumentUnit`
- sections -> `DocumentChapter` or outline nodes
- outline -> `UnifiedDocument.outline`
- document kind -> `UnifiedDocument.documentKind`
- analysis -> future analysis store keyed by `UnifiedDocument.id`
- chat -> future chat store keyed by `UnifiedDocument.id`
- coordinates -> `DocumentUnit.bbox` and metadata

### BookTrans ImportedBook To UnifiedDocument

BookTrans EPUB import maps as:

- `ImportedBook.filePath` -> `sourcePath`
- `ImportedBook.metadata` -> `metadata`
- `ImportedBook.metadata.title` -> `title`
- `Chapter` -> `DocumentChapter`
- `Chapter.text` -> initial chapter-level `DocumentUnit`
- `Chapter.href` / `absolutePath` -> unit metadata and source href

### BookTrans ImportedPdfDocument To UnifiedDocument

BookTrans PDF import maps as:

- `ImportedPdfDocument.filePath` -> `sourcePath`
- `title` / `author` -> title and metadata
- `pageTexts[].paragraphs[]` -> `DocumentUnit`
- `pageTexts[].pageNumber` -> unit `pageNumber`
- `paragraph.role` -> unit `role`
- `paragraph.bbox` -> unit `bbox`
- `pages` and `isScannedLike` -> diagnostics

## Attachment Points

- Outline: stored on `UnifiedDocument.outline`.
- Document kind: stored on `UnifiedDocument.documentKind`.
- Chat: stored in a local chat service keyed by document id; answers cite unit ids, pages, and chapters.
- Analysis: stored in a local analysis service keyed by document id; prompts receive document kind and outline hints.
- Translation: stored as `TranslationVersion` records while preserving existing BookTrans job data.
- Export: stored as `ExportRecord` and existing export history entries.

