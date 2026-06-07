# PPTX Export Migration Notes

## Source Dependency

DocuMuse uses `pptxgenjs` for PPTX generation.

The current DocuMuse exporter is `src/lib/exporters/pptxExporter.ts`. It creates a multi-slide reading report with cover styles, themes, summary slides, key points, keywords, section analysis, generated PPT outline, podcast/image prompt slides, and chat source slides.

## Dependency Decision

`booktrans-desk` does not currently depend on `pptxgenjs`.

Adding it is reasonable later, but the first DocuMuse Studio merge should not introduce the dependency until Markdown/JSON export, analysis/chat, and packaged validation are stable.

## Electron Main Process Integration

The preferred integration point is Electron main:

- Add `src/main/export/pptxExporter.ts`.
- Keep renderer interaction through IPC.
- Generate a `Buffer` in main and write it through a save dialog.
- Add a small `export:documentPptx` IPC handler.
- Track the output through the unified `ExportRecord` path later.

The exporter should accept `UnifiedDocument`, `DocumentAnalysisRecord`, and chat messages instead of DocuMuse `ParsedDocument`.

## Chinese Font And Mojibake Risk

The DocuMuse exporter currently uses Arial as the PPTX theme font. For Chinese output, this can be acceptable on many systems but is not guaranteed across Windows/macOS/Linux or external readers.

Risks:

- Missing CJK glyph fallback in some readers.
- Inconsistent line wrapping for Chinese text.
- Existing repository console output has shown encoding-sensitive display issues, so PPTX text sanitization must be tested with real Chinese strings.

Mitigation:

- Prefer Microsoft YaHei / SimSun fallback notes for Windows builds.
- Keep text short and use `fit: "shrink"` where needed.
- Manually open generated PPTX in PowerPoint, WPS, LibreOffice, and web preview before public release.

## First Version PPTX Scope

If implemented, the first version should only include:

- Cover
- Summary
- Key points
- Outline
- Chat sources

It should not yet include:

- Advanced themes
- Creative prompts
- Podcast script slides
- Complex section pagination
- Export preset packs

## Migration Steps

1. Add `pptxgenjs`.
2. Create `src/main/export/pptxExporter.ts`.
3. Map `UnifiedDocument` outline, units, document kind, quick analysis, and chat sources into a small slide plan.
4. Add unit tests for option normalization and text truncation.
5. Add IPC save handler.
6. Add renderer export button.
7. Run `npm run build`, `npm test`, `npm run release:check`, and packaged manual validation.

## Current Decision

Do not migrate PPTX code in the initial implementation round.

Reason: the migration is feasible but not low enough risk to add during the first merge pass. The Markdown/JSON Export Center now provides the safer baseline, and PPTX should follow after workspace UI and packaged validation settle.

