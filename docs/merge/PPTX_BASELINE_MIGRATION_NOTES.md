# PPTX Baseline Migration Notes

## Source Reference

The original DocuMuse project uses `pptxgenjs` in `src/lib/exporters/pptxExporter.ts`. That exporter includes themes, cover variants, summary slides, key points, keywords, section analysis, generated presentation outlines, podcast/image prompt slides, and chat/source slides.

## S6 Decision

S6 implements a baseline PPTX export without adding `pptxgenjs`.

Reason:

- The current repo already has `adm-zip`.
- The S6 target is a minimal proof of export shape, not DocuMuse full template migration.
- Avoiding a new dependency keeps the release check smaller and reduces migration risk.

## Baseline Scope

Implemented baseline slides:

- Cover slide
- Summary slide
- Key points slide
- Presentation outline slide
- Chat highlights slide
- Sources slide

## Not Included

- Full DocuMuse theme system
- Cover style selector
- Advanced layouts
- Images
- Animations
- Speaker notes system
- Template editor
- Complex section pagination
- Rich CJK font fallback testing

## Implementation Notes

- File: `src/main/export/pptxExporter.ts`
- Output: `Buffer`
- Packaging: minimal OpenXML parts written into a ZIP package
- IPC: `export:pptx`
- Renderer label: `Baseline PPTX`

## Validation

Automated validation:

- Build a PPTX buffer.
- Open it as a ZIP.
- Confirm `ppt/presentation.xml` and slide XML parts exist.

Manual validation still required:

- Open generated PPTX in PowerPoint.
- Open generated PPTX in WPS or LibreOffice.
- Check Chinese text rendering.
- Check line wrapping and slide overflow.

## Known Risks

- Minimal OpenXML generation may be less robust than `pptxgenjs`.
- CJK font rendering can vary across systems.
- External readers may repair or reinterpret minimal PPTX structure.
- This baseline should be treated as experimental until packaged manual validation is complete.
