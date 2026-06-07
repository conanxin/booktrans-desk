# Phase 3A Manual PDF Workflow Validation Report

## Test Environment

- Date: 2026-06-07
- OS: Windows 10.0.19045
- Shell: PowerShell
- App version: 0.3.0-alpha.0
- Base commit: a7b5554
- Base tag: v0.3.0-pdf-translation-mvp
- Install mode: packed / win-unpacked process smoke only
- Reader used: not run in this environment
- Fixture/source PDF: not selected through the packaged UI in this environment

## Automatic Verification

- build: PASS
- test: PASS, 23 files / 91 tests
- audit: PASS, 0 vulnerabilities
- release:check: PASS
- labels:print: PASS
- pack: PASS
- dist: PASS

## Packaged UI Result

PACKAGED_UI_RESULT: BLOCKED_BY_ENVIRONMENT

The packed executable at `release/win-unpacked/BookTrans Desk.exe` was started as a process smoke test. The process stayed alive beyond the startup window and closed cleanly after the smoke check.

This does not count as visible UI validation. The current execution environment did not provide a reliable way to visually confirm the rendered desktop window, Chinese UI text, tab switching, or the presence of the EPUB / PDF file picker control.

## PDF Workflow Result

- PDF_IMPORT_RESULT: BLOCKED_MANUAL_UI_NOT_AVAILABLE
- PDF_TEXT_EXTRACTION_RESULT: BLOCKED_MANUAL_UI_NOT_AVAILABLE
- PDF_TRANSLATION_RESULT: BLOCKED_MANUAL_UI_NOT_AVAILABLE
- PDF_EXPORT_RESULT: BLOCKED_MANUAL_UI_NOT_AVAILABLE
- PDF_EXTERNAL_READER_RESULT: BLOCKED

Automated PDF tests continue to cover synthetic text PDF import, text extraction, mock translation, export readability, lightweight validation, scanned-like PDF rejection, and export history safety. The requested manual packed-app workflow was not completed because the packaged UI could not be visually operated in this environment.

## Known Issues

- Packaged UI visual verification remains incomplete.
- Manual PDF import, translate, and export through the packed UI remains incomplete.
- Exported PDF external reader-open verification remains incomplete.
- PDF support remains limited to copyable text PDFs.
- OCR, encrypted PDFs, exact layout preservation, table/formula reconstruction, selected page translation, and batch PDF translation remain unsupported.

## Final Decision

FINAL_DECISION: HOLD

The Phase 3A PDF MVP remains suitable for internal automated validation only. It is not ready for public PDF release until a real Windows desktop session verifies the packed UI visually and opens an exported translated PDF in at least one external reader.

## Next Steps

- Run the packed app in a visible Windows desktop session.
- Confirm the Translate, Jobs, Exports, and Settings tabs manually.
- Import a small owned or synthetic text PDF through the packed UI.
- Translate with the mock provider and export a translated PDF.
- Open the exported PDF in Microsoft Edge, Chrome, Adobe Acrobat Reader, SumatraPDF, or the system default PDF reader.
- Update this decision to `GO_FOR_INTERNAL_TESTING` only if both packaged UI visible validation and external reader-open validation pass.
