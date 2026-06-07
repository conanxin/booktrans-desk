# BookTrans Desk / DocuMuse Studio Merge Branch

[![CI](https://img.shields.io/badge/CI-GitHub%20Actions-lightgrey)](.github/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Branch](https://img.shields.io/badge/branch-merge--documuse--studio-orange)](docs/merge/PRODUCT_FRAMING.md)

This README describes the `merge-documuse-studio` branch. The historical `master` branch and earlier public alpha releases remain BookTrans Desk: a local-first Electron EPUB translation tool. This merge branch is the in-progress transition toward **DocuMuse Studio**, a local-first desktop workbench for AI reading, translation, analysis, Q&A, and knowledge export.

No GitHub Release has been created from this branch. It has not been merged to `master` and is not a public alpha. Real Windows desktop click-through validation is still pending and tracked as `BLOCKED_MANUAL`.

## Product Positioning

DocuMuse Studio treats an imported EPUB or PDF as a local knowledge object, not just a file to translate. The same workspace can read the source text, inspect document structure, run quick analysis, ask questions with sources, translate content, persist AI state, and export reusable materials.

Core principles:

- Local-first desktop app.
- No account system, no telemetry, no cloud sync.
- Existing BookTrans EPUB translation remains the usable translation alpha path.
- DocuMuse-style reading, analysis, chat, outline, export, and document model ideas are merged into the desktop shell.
- PDF reading, analysis, chat, and knowledge export are available on this branch.
- PDF translation remains experimental and public release is HOLD.

## Current Branch Status

- Branch: `merge-documuse-studio`
- Historical stable handoff tag: `v0.3.3-layout-aware-pdf-extraction`
- Latest S10 base commit before this documentation phase: `8f148b1 feat: persist translation versions and selected translation baseline`
- Package name and product metadata still use `booktrans-desk` / `BookTrans Desk`.
- Suggested product name for this merge branch: DocuMuse Studio.
- Release status: no release, no public alpha, no merge to `master`.
- Manual desktop validation: `BLOCKED_MANUAL` until a real Windows click-through is completed.

## Capability Matrix

| Capability | EPUB | PDF | Status |
| --- | --- | --- | --- |
| Import | Pass | Pass for text PDFs | Implemented on merge branch |
| Unified document library | Pass | Pass | Local JSON snapshots in Electron userData |
| Reading workspace | Pass by chapter | Pass by page and unit | Implemented |
| Structure metadata | Chapters and units | Pages, roles, source hints, bbox where available | Implemented |
| Quick analysis | Pass | Pass | Persisted per document |
| Chat with sources | Pass | Pass | Persisted per document |
| Analysis/chat recovery after restart | Pass | Pass | Stored in UnifiedDocument snapshot |
| Full translation | Usable alpha | Experimental | PDF public release HOLD |
| Selected translation | Chapter baseline | Page experimental baseline | Stored as translation versions |
| Translation versions | Pass | Internal experimental | Multiple versions can be persisted and selected |
| Document Markdown / JSON | Pass | Pass | Save dialog, validation, export history |
| Chat / Analysis Markdown | Pass | Pass | Uses persisted state |
| Study Notes / Research Digest / Presentation / Podcast presets | Pass | Pass | Markdown presets |
| Full Archive ZIP | Pass | Pass | Structural validation included |
| Baseline PPTX | Pass | Pass | OpenXML baseline, visual validation pending |
| Bilingual Markdown / HTML | Baseline | Baseline with HOLD warning | Uses translation versions or explicit missing placeholders |
| Packaged app | `npm run pack` passes in prior S7 validation | Same | Real packaged UI click-through pending |

## Current Features

- UnifiedDocument model for EPUB/PDF snapshots.
- Local document library backed by Electron userData.
- EPUB import, chapter reading, document kind, analysis, chat, translation, and translated EPUB export.
- PDF import, page reading, layout-aware unit metadata, document kind, analysis, chat, and knowledge export.
- Persisted analysis results and chat histories.
- Persisted translation versions for EPUB and internal PDF experimental results.
- Selected EPUB chapter translation baseline.
- Selected PDF page translation baseline marked experimental.
- Markdown, JSON, Chat Markdown, Analysis Markdown, Study Notes, Research Digest, Presentation Outline, Podcast Prep, ZIP archive, and baseline PPTX export.
- Bilingual Markdown and single-file bilingual HTML export.
- Export save dialogs, export validation, and export history.
- Existing BookTrans translation profiles, retry/resume job behavior, and EPUB export path remain in place.

## Quick Start

```bash
npm install
npm run dev
```

Use Settings to configure a compatible provider, or use the mock translator for local dry runs. Do not commit local settings, API keys, imported books, imported PDFs, or generated export artifacts.

## Validation Commands

```bash
npm run build
npm test
npm run release:check
npm run pack
```

`npm run release:check` runs build, tests, audit, release document checks, label JSON validation, and a repository safety scan for tracked `.env`, generated build folders, EPUB/PDF binaries, and common credential patterns.

Packaging uses electron-builder. Artifacts are written to `release/`, which is ignored by git. Do not commit release artifacts.

## Privacy Model

- Imports are local.
- No telemetry is sent by the app.
- No account, login, or cloud sync exists.
- API keys are stored in local Electron settings.
- Text is sent to the configured provider only when the user starts translation, analysis, or chat.
- Document snapshots do not store API keys.
- Analysis/chat/translation snapshots do not store Authorization headers or raw provider responses.
- Export history does not store API keys.
- Diagnostics and manual validation artifacts must use synthetic or non-sensitive documents.

See [docs/alpha/PRIVACY_NOTICE.md](docs/alpha/PRIVACY_NOTICE.md) and [docs/SECURITY.md](docs/SECURITY.md).

## Not Supported / HOLD

- PDF translation public release: HOLD.
- Real Windows desktop click-through: pending.
- PPTX visual validation in PowerPoint/WPS/LibreOffice: pending.
- OCR: not supported.
- Scanned/image-only PDF translation: not supported.
- Exact PDF layout preservation: not supported.
- Bilingual PDF export: not supported.
- Fixed-layout EPUB: not supported.
- DRM EPUB/PDF: not supported.
- Vector database / embeddings / RAG: not implemented.
- Cloud sync, login, multi-user auth: not implemented.
- Selected units multi-select UI: pending.
- Translation version diff/compare: pending.

## Merge Readiness

Current recommendation: do not merge this branch to `master` yet.

Recommended gate:

1. Complete S11 real Windows desktop click-through validation.
2. Confirm EPUB import, translation, export, reading, analysis, chat, restart recovery, bilingual export, ZIP, PPTX, and export history.
3. Confirm PDF import, reading, analysis, chat, restart recovery, bilingual export, ZIP, PPTX, and visible PDF translation HOLD messaging.
4. Decide whether to keep package metadata as BookTrans Desk for the first internal alpha or rename product metadata to DocuMuse Studio in a dedicated change.

See [docs/merge/MERGE_TO_MASTER_DECISION_REPORT.md](docs/merge/MERGE_TO_MASTER_DECISION_REPORT.md).

## Documentation

- [Product Framing](docs/merge/PRODUCT_FRAMING.md)
- [Merge-to-Master Decision Report](docs/merge/MERGE_TO_MASTER_DECISION_REPORT.md)
- [Internal Alpha Readiness Report](docs/merge/INTERNAL_ALPHA_READINESS_REPORT.md)
- [S11 Manual Windows Validation Plan](docs/merge/S11_MANUAL_WINDOWS_VALIDATION_PLAN.md)
- [Next Development Queue](docs/merge/NEXT_DEVELOPMENT_QUEUE.md)
- [Translation Version Model](docs/merge/TRANSLATION_VERSION_MODEL.md)
- [Bilingual Export Evaluation](docs/merge/BILINGUAL_EXPORT_EVALUATION.md)
- [Roadmap](docs/ROADMAP.md)
- [Development Handoff](docs/DEVELOPMENT_HANDOFF.md)
- [PDF Translation Pipeline](docs/PDF_TRANSLATION_PIPELINE.md)
- [PDF Support Limitations](docs/PDF_SUPPORT_LIMITATIONS.md)
- [Alpha Tester Guide](docs/alpha/ALPHA_TESTER_GUIDE.md)
- [Test Plan](docs/alpha/TEST_PLAN.md)
- [Triage Guide](docs/triage/TRIAGE_GUIDE.md)
- [Compatibility Matrix](docs/EPUB_COMPATIBILITY_MATRIX.md)
- [Reader Compatibility Notes](docs/READER_COMPATIBILITY_NOTES.md)

## Historical BookTrans Desk Public Alpha Notes

Earlier BookTrans Desk public alpha history remains separate from this merge branch. The historical prerelease was published as [BookTrans Desk v0.2.9 Public Alpha (Conditional)](https://github.com/conanxin/booktrans-desk/releases/tag/v0.2.9-public-alpha-conditional). That does not imply this DocuMuse Studio merge branch is public-release ready.

Current Windows alpha packages are unsigned. Download only from the project GitHub Release page, verify checksums when provided, or build from source.

> Alpha warning: this merge branch is still intended for technical testers. Keep backups of original EPUB/PDF files and review provider privacy terms before translating, analyzing, or chatting with private or copyrighted content.

> Windows unsigned warning: current Windows alpha packages are unsigned. Download only from the project GitHub Release page, verify checksums when provided, or build from source.

## License

MIT. See [LICENSE](LICENSE).
