# DocuMuse Studio Merge Plan

## Project

DocuMuse Studio is the planned merged desktop application for DocuMuse and BookTrans Desk.

- New product name: DocuMuse Studio
- Main repository: `booktrans-desk`
- Absorbed project: `DocuMuse`
- Merge branch: `merge-documuse-studio`

## Product Positioning

DocuMuse Studio is a local-first desktop workbench for AI reading, translation, analysis, question answering, and knowledge export.

The target flow is:

1. Import PDF / EPUB
2. Parse into a unified document structure
3. Read original text, outline, pages, and chapters
4. Run AI summary, analysis, and document Q&A
5. Translate full books, chapters, pages, or selected units
6. Export EPUB, PDF, Markdown, JSON, PPTX, ZIP, and HTML previews

## Why BookTrans Desk Is The Main Shell

BookTrans Desk already provides the desktop-first foundation that the merged product needs:

- Electron main process and renderer shell
- IPC boundaries between UI and local services
- Local EPUB read/write/validate flows
- Translation job system with retry and resume behavior
- Translation quality gates
- MiniMax and OpenAI-compatible provider settings
- PDF layout-aware extraction and experimental translation chain
- Export history and translation profile storage
- `electron-builder`, `pack`, `dist`, and `release:check`

Keeping BookTrans Desk as the main repository lets DocuMuse Studio preserve the working desktop distribution path while adding reading, analysis, and export depth incrementally.

## Why DocuMuse Is Migrated In As Reading / Analysis / Export Core

DocuMuse already contains the strongest document-understanding layer:

- PDF text parsing into pages, paragraphs, and sections
- Editable outline concepts
- Document kind detection
- PDF coordinate and source-anchor concepts
- Original text workspace design
- AI analysis and document chat flows
- Markdown, JSON, PPTX, ZIP, and preset export concepts
- Workspace UI ideas including sidebar, original text panel, and chat panel

DocuMuse capabilities should be migrated through shared models and services, not by copying an entire Next.js app into the Electron app.

## First Version Goal

The first runnable merged version should support:

- PDF / EPUB import
- Unified local document library snapshots
- Original reading views for EPUB chapters and PDF page paragraphs
- Document kind and outline extraction
- Quick analysis and lightweight document Q&A
- Existing EPUB translation and export behavior
- Existing PDF extraction and internal experimental translation behavior
- Markdown and JSON export for unified documents

## Explicitly Out Of Scope For The Initial Merge

The initial merge will not add:

- OCR
- Cloud sync
- Login, teams, or multi-user auth
- Vector database or embeddings
- Complex plugin systems
- Database server or remote persistence
- Automatic public release
- DRM removal or DRM bypass

## PDF Release Policy

PDF public release remains HOLD.

PDF import, layout-aware extraction, reading, analysis, and internal validation can continue on the merge branch, but public PDF translation release requires packaged UI validation and external reader verification first.

