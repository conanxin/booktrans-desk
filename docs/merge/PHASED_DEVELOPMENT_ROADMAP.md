# Phased Development Roadmap

## Phase M0: Merge Docs And Architecture Baseline

Goal: create merge design documents and set the architectural boundary.

File range: `docs/merge/*`.

Not doing: runtime code changes, UI rewrites, provider changes, release publishing.

Validation commands:

- `npm run build`
- `npm test`

Done when: merge plan, unified model, reuse matrix, and roadmap are committed.

## Phase M1: Shared Unified Document Model

Goal: add Electron-safe shared types and adapters for existing EPUB/PDF imports.

File range: `src/shared/documentModel.ts`, `src/shared/documentAdapters.ts`, adapter tests.

Not doing: replacing `src/shared/types.ts`, changing import behavior, adding a database.

Validation commands:

- `npm run build`
- `npm test`

Done when: `ImportedBook` and `ImportedPdfDocument` convert to `UnifiedDocument` with stable unit order.

## Phase M2: EPUB To UnifiedDocument Adapter

Goal: harden EPUB chapter and metadata mapping.

File range: shared adapters, EPUB import call sites, tests.

Not doing: paragraph-level EPUB segmentation, EPUB writer rewrites.

Validation commands:

- `npm run build`
- `npm test`

Done when: EPUB import can produce and persist a unified snapshot without affecting translation.

## Phase M3: PDF To UnifiedDocument Adapter

Goal: harden PDF page paragraph and layout metadata mapping.

File range: shared adapters, PDF import call sites, tests.

Not doing: public PDF translation release, OCR, exact layout preservation.

Validation commands:

- `npm run build`
- `npm test`

Done when: PDF import can produce and persist a unified snapshot while PDF public release remains HOLD.

## Phase M4: Local Document Library

Goal: add local unified document snapshots under Electron `userData`.

File range: `src/main/document/*`, `src/main/ipc.ts`, tests.

Not doing: cloud sync, auth, database server, binary file copy.

Validation commands:

- `npm run build`
- `npm test`

Done when: documents can be saved, listed, read, and deleted through non-breaking IPC.

## Phase M5: DocuMuse Analysis / Chat Core Port

Goal: add quick analysis and lightweight document Q&A services for `UnifiedDocument`.

File range: `src/main/analysis/*`, `src/main/chat/*`, `src/main/ipc.ts`, tests.

Not doing: embeddings, vector DB, long-running full-book analysis UI.

Validation commands:

- `npm run build`
- `npm test`

Done when: services return analysis/chat results with cited document units.

## Phase M6: Export Center

Goal: add unified Markdown/JSON/chat/analysis exports while preserving translated export flows.

File range: `src/main/export/*`, `src/main/ipc.ts`, tests.

Not doing: full PPTX migration unless explicitly evaluated.

Validation commands:

- `npm run build`
- `npm test`

Done when: unified document Markdown and JSON export work from services and IPC.

## Phase M7: Unified Translation Center

Goal: align existing EPUB/PDF translation jobs with unified document units.

File range: translation job services, adapters, renderer panels.

Not doing: breaking existing EPUB full-book translation or publishing PDF translation.

Validation commands:

- `npm run build`
- `npm test`
- `npm run release:check`

Done when: full EPUB translation remains usable and selected-unit design is ready.

## Phase M8: Unified Workspace UI

Goal: introduce the DocuMuse Studio shell: library, reading, analysis, chat, translation, and export regions.

File range: `src/renderer/*`.

Not doing: large visual redesign detached from existing BookTrans controls.

Validation commands:

- `npm run build`
- `npm test`
- `npm run dev` when practical

Done when: users can see document library information and current EPUB/PDF structure without losing existing translation controls.

## Phase M9: Package Validation

Goal: verify the packaged desktop application.

File range: docs, packaging scripts, small bug fixes.

Not doing: GitHub release or public alpha.

Validation commands:

- `npm run release:check`
- `npm run pack`
- manual import/translate/export checks

Done when: packaged UI passes manual EPUB flow and internal PDF reading checks.

## Phase M10: Public Alpha Decision

Goal: decide whether a DocuMuse Studio alpha tag is ready.

File range: release notes, validation checklist, README transition notes.

Not doing: automatic publish or PDF public release without validation.

Validation commands:

- `npm run build`
- `npm test`
- `npm run release:check`
- `npm run pack`

Done when: release decision says GO or NO_GO with evidence.

