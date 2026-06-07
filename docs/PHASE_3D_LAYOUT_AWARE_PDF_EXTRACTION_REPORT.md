# Phase 3D Layout-aware PDF Extraction Report

## Summary

Phase 3D addresses real PDF translation failures where two-column academic PDFs were translated from scrambled page text. The PDF pipeline now extracts coordinate-aware text blocks, classifies page regions, reconstructs reading order, rebuilds paragraph units, and translates structured paragraphs by stable ids.

Target tag: `v0.3.3-layout-aware-pdf-extraction`

FINAL_DECISION: HOLD

PDF functionality is still not public-release ready. This phase improves extraction and translation structure, but packaged UI visual validation and exported PDF external-reader validation must still pass before any public PDF release.

## Implementation

- Added layout block extraction from PDF text spans and coordinates.
- Added page region classification for `title`, `subtitle`, `body-left-column`, `body-right-column`, `quote-box`, `header`, `footer`, and `references`.
- Added reading-order reconstruction that excludes headers and footers from body translation, orders title/subtitle first, reads left body column top-down before right body column, and preserves quote boxes and references as separate roles.
- Added paragraph reconstruction with wrapped-line merging, hyphenated word repair, short split-name repair, and citation marker preservation.
- Changed PDF translation to send structured paragraph arrays with `id`, `role`, `pageNumber`, and `sourceText`.
- Added JSON translation response validation for complete ids, no added ids, no reordered ids, string translations, no prompt leakage, and no `<think>` output.
- Updated mock translation to return structured JSON for structured PDF prompts.
- Updated translated PDF export to preserve structured roles and write an adjacent HTML preview file for structure review.

## Verification

- Added layout-aware extraction tests for two-column reading order.
- Added header/footer exclusion coverage.
- Added quote-box and references role coverage.
- Added hyphenated word and short split-name repair coverage.
- Added a synthetic Nature-style two-column article fixture.
- Added structured paragraph translation tests for complete JSON return, missing ids, reordered ids, and `<think>` rejection.

## Security Check

- No API keys are stored in PDF job, preview, or export metadata.
- Provider prompts include only selected source paragraph text and structural ids.
- Diagnostic paths continue to avoid full source text, full translations, Authorization headers, and API keys.
- No telemetry, account system, cloud sync, auto-update, PDF artifact, EPUB artifact, release artifact, or log file is intentionally added.

## Known Limitations

- Region classification is heuristic and optimized for reflowing text PDFs, not arbitrary poster-like layouts.
- Tables, equations, figures, captions, and dense sidebar layouts are not fully reconstructed.
- Headers and footers are excluded from body translation by default.
- Export remains a readable reflowed PDF, not an exact visual overlay of the source PDF.
- HTML preview is generated next to the PDF output for tester review, but the app does not yet include a dedicated visual preview pane.
- PDF support remains HOLD until a real packaged Windows UI run and exported PDF external-reader open test pass.

## Suggested Next Steps

- Run a real packaged UI validation session with a non-sensitive two-column text PDF.
- Open exported PDFs in Microsoft Edge, Chrome, Adobe Acrobat Reader, and SumatraPDF.
- Add visual preview in the app before export.
- Add figure/caption/table detection after the paragraph flow is manually validated.
- Keep PDF public release blocked until the full manual gate passes.
