# Phase 1.5 EPUB Hardening Report

## Implementation

- Added `validateEpub` for local structural EPUB validation.
- Added export-time validation and UI PASS/WARNING/FAIL display.
- Replaced paragraph text rebuild with XHTML DOM text-node translation.
- Preserved tags, attributes, images, anchors, comments, and inline formatting during translation.
- Added skipped text zones for `script`, `style`, `svg`, `math`, `code`, `pre`, and `noscript`.
- Added chapter-level translation job persistence under the app user data directory.
- Added retry support for failed chapters and cache clearing.
- Added glossary and style controls in the renderer and translator prompt.
- Hardened OpenAI-compatible requests with timeout, retry, cancellation, empty response checks, JSON parse errors, and redacted Authorization data.

## Verification Results

- `npm run build`: PASS
- `npm test`: PASS
- `npm audit`: PASS, 0 vulnerabilities.

## Test Coverage

- `validateEpub.test.ts`: minimal legal EPUB, missing container, bad spine idref, missing manifest href.
- `translateXhtmlTextNodes.test.ts`: inline tags, attributes, skipped tags, text-node-only replacement, parseable output.
- `translationJobStore.test.ts`: create, update, save/read, retry failed chapter, no API key persistence.
- `openaiCompatibleTranslator.test.ts`: 429 retry success, empty response error, request cancellation.
- Existing chunking, mock translator, and EPUB roundtrip tests remain covered.

## Known Limitations

- Validation is lightweight and does not replace full `epubcheck`.
- Resume is automatic for matching unfinished jobs; there is not yet a dedicated job picker UI.
- Persisted translated chapter XHTML can increase job cache size for large books.
- Text-node grouping depends on delimiter preservation; unsafe grouped translations fall back to one text node per request.

## Next Phase Recommendations

- Add optional epubcheck integration or a stricter validator mode.
- Add an explicit resume/retry screen for unfinished jobs.
- Add per-book translation profiles without introducing full library management.
- Add fixture EPUBs that cover nav documents, NCX, footnotes, ruby text, and heavily nested inline formatting.
