# Product Framing: DocuMuse Studio Merge Branch

## One-sentence Positioning

DocuMuse Studio is a local-first desktop workbench for AI reading, translation, analysis, Q&A, and knowledge export across EPUB and PDF documents.

## Why BookTrans Desk Expands into DocuMuse Studio

BookTrans Desk began as a focused EPUB translation desktop app. That foundation is valuable: it already has Electron packaging, local IPC, provider settings, chapter-level translation jobs, retry/resume, quality gates, EPUB export, export history, and release checks.

DocuMuse adds the missing knowledge-work layer: document structure, reading workspace, outline thinking, document type detection, analysis, chat, and multi-format export. The merge branch combines these into one local-first desktop project without replacing the stable EPUB translation path.

## Core Theory

### Documents Are Local Knowledge Objects

An imported EPUB or PDF should become a `UnifiedDocument`, not just a transient file. The document snapshot can carry structure, units, chapters/pages, analysis state, chat history, translation versions, exports, and diagnostics.

### Translation Is Part of a Larger Workflow

Translation is not the only endpoint. A user may read first, analyze the document, ask questions, translate only a section, export study notes, create a presentation outline, or generate bilingual Markdown/HTML for editing.

### EPUB and PDF Belong in One Workspace

EPUB chapters and PDF pages have different source structures, but they can share the same workspace concepts:

- library entry
- reader selection
- source units
- document kind
- analysis
- chat with sources
- export center
- translation versions

### AI Results Must Be Persistent, Traceable, and Exportable

Analysis, chat, and translation are saved back into local snapshots. Exporters read persisted state instead of only in-memory state. Generated knowledge materials can be traced back to source units, chapters, pages, and translation versions.

## Current Product Capability Map

- Unified document library for EPUB/PDF snapshots.
- EPUB chapter reading, analysis, chat, translation, and translated EPUB export.
- PDF text reading, layout-aware units, analysis, chat, and knowledge export.
- Persisted analysis/chat state.
- Persisted translation versions.
- Export presets: document Markdown/JSON, chat, analysis, study notes, research digest, presentation outline, podcast prep.
- Full Archive ZIP.
- Baseline PPTX.
- Bilingual Markdown/HTML.
- Export validation and export history.

## User Flow

1. Import EPUB or PDF.
2. Open the document from the local library.
3. Read chapters or pages.
4. Inspect structure, source hints, document kind, and metadata.
5. Run quick analysis.
6. Ask questions and inspect sources.
7. Translate the full EPUB, current EPUB chapter, or experimental current PDF page.
8. Save translation versions.
9. Export Markdown, JSON, ZIP, PPTX, bilingual Markdown, or bilingual HTML.
10. Reopen later and continue from persisted analysis, chat, and translation state.

## Design Boundaries

- No cloud sync.
- No login or multi-user auth.
- No database.
- No vector DB or embeddings.
- No OCR.
- No DRM handling.
- No public PDF translation release.
- No complex plugin system.
- No automatic publishing.
- No generated export artifacts committed to git.

## Relationship to BookTrans Desk

BookTrans Desk remains the historical project name, package name, and public alpha history. The merge branch keeps BookTrans Desk's Electron shell, IPC design, EPUB translation engine, retry/resume job behavior, export history, provider settings, and packaging setup.

## Relationship to DocuMuse

DocuMuse contributes the product direction and knowledge-work capabilities: unified document modeling, reading workspace, document kind/outline concepts, analysis/chat ideas, structured exports, and a broader local knowledge workbench model.

## Next Product Direction

The branch is close to an internal alpha candidate, but should not merge to `master` before S11 real Windows desktop click-through validation. After S11, the next product decisions are:

- whether to rename package metadata/productName to DocuMuse Studio
- whether to open a merge PR
- whether to create an internal alpha tag
- how much selected-unit UX and translation-version polish to complete before wider testing

PDF translation remains experimental and public release remains HOLD.
