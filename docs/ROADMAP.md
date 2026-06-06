# Roadmap

## Phase 1

- EPUB import, translation, progress, and export.
- Local OpenAI-compatible settings.
- Mock translator and roundtrip tests.

## Phase 1.5

- Structural EPUB validation after export.
- XHTML DOM text-node translation with inline structure preservation.
- Chapter-level retry/resume state persisted in user data.
- Glossary and style prompt controls.
- OpenAI-compatible timeout, retry, cancellation, and safer error handling.

## Phase 2

- Explicit job picker for resume/retry workflows.
- Optional full epubcheck integration.
- Detailed validation report UI with Markdown copy/save.
- Internal EPUB compatibility matrix.

## Phase 2.1

- More language targets and per-book translation profiles.
- Export history without adding a full library database.
- Real-world reader compatibility fixtures.

## Current Format Scope

- Current target: reflowable EPUB.
- Not supported: fixed-layout EPUB, DRM EPUB, PDF, MOBI, and AZW3.
- Out of scope: Calibre integration, batch translation, book library database, user login, cloud sync, online reader, paid systems, plugins, CI, and auto publishing.
