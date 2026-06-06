# Manual Reader Validation Checklist

Use this checklist before publishing a public alpha. Current CI does not automatically open reader applications, and generated exported EPUB files must not be committed.

## Test Environment

Record one row per fixture and reader combination.

| Field | Value |
| --- | --- |
| OS |  |
| App version | 0.2.8-alpha.0 |
| Install mode | dev / packed |
| Reader name |  |
| Reader version |  |
| Fixture name |  |
| Export validation status | PASS / WARNING / FAIL |
| External EPUBCheck status | PASS / WARNING / FAIL / unavailable |
| Result | PASS / WARNING / FAIL |
| Notes |  |

## Required Manual Readers

| Reader | Platform | Required for Alpha? | Notes |
| --- | --- | --- | --- |
| Calibre | Windows / Linux / macOS | Yes | Recommended baseline |
| Thorium Reader | Windows / Linux / macOS | Yes | EPUB3 baseline |
| SumatraPDF | Windows | Optional | Lightweight smoke test |
| Apple Books | macOS / iOS | Optional | Manual future check |
| Kindle Previewer | Windows / macOS | Optional | Conversion may alter EPUB |

## Required Fixture Checks

- `minimal-epub3`
- `epub2-ncx`
- `images-and-css`
- `footnotes-inline`
- `cjk-source`
- `nested-sections`
- `split-text-inline`
- `entities-special-chars`
- `nav-landmarks`
- `duplicate-hrefs`
- `large-chapter-chunking`

## Manual Flow

1. Import fixture.
2. Translate with mock/test provider.
3. Export EPUB.
4. View validation report.
5. Open exported EPUB in reader.
6. Confirm chapter order.
7. Confirm images/CSS retained if applicable.
8. Confirm footnotes/links retained if applicable.
9. Confirm CJK text not corrupted if applicable.
10. Record PASS/WARNING/FAIL.

## Rules

- Current CI does not open reader applications.
- Do not commit generated exported EPUB files.
- Manual validation results should be recorded in docs, release notes, or issues without attaching test artifacts.
- Do not upload commercial EPUB files, exported copyrighted EPUBs, API keys, Authorization headers, or full book text.
