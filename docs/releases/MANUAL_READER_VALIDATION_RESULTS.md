# Manual Reader Validation Results

## Run Metadata

| Field | Value |
| --- | --- |
| Date | 2026-06-06 |
| App version | 0.2.6-alpha.0 |
| Release prep tag | v0.2.6-public-alpha-prep |
| Install mode | packed smoke check |
| Environment | Windows PowerShell automation without interactive reader validation |

## Summary

MANUAL_READER_VALIDATION_RESULT: NOT_RUN_ENVIRONMENT_LIMITED

No Calibre, Thorium Reader, SumatraPDF, Apple Books, or Kindle Previewer validation was completed in this environment. This result is intentionally not recorded as PASS.

## Required Baseline Fixtures

| Fixture | Reader | Import result | Translate result | Export validation status | External EPUBCheck status | Reader open result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| minimal-epub3 | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |
| epub2-ncx | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |
| images-and-css | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |
| footnotes-inline | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |
| cjk-source | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |
| nested-sections | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |
| split-text-inline | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |
| entities-special-chars | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |
| nav-landmarks | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |
| duplicate-hrefs | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |
| large-chapter-chunking | Calibre / Thorium Reader | Not run | Not run | Not run | not configured | Not run | Environment limited |

## Required Follow-up

- Run Calibre validation for at least the baseline fixture set.
- Run Thorium Reader validation for EPUB3 baseline coverage.
- Optionally run SumatraPDF as a lightweight Windows smoke test.
- Do not commit exported EPUB files or reader-generated artifacts.
