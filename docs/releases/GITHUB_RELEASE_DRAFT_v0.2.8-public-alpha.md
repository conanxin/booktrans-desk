# GitHub Release Draft: v0.2.8-public-alpha

## Release Title

BookTrans Desk v0.2.8 Public Alpha

## Suggested Tag

`v0.2.8-public-alpha`

## Final Decision

CONDITIONAL_GO

Automatic checks passed and Windows release artifacts were generated with checksums. This is not a full GO because visual UI validation and real reader validation with Calibre or Thorium Reader were not completed in this environment.

## What This Alpha Can Do

- Import reflowable EPUB files.
- Translate XHTML text nodes while preserving inline markup and resources.
- Use a mock translator for local dry runs.
- Use an OpenAI-compatible provider configured by the user.
- Resume and retry chapter-level translation jobs.
- Export translated EPUB files.
- Show internal validation reports and optional external EPUBCheck output.
- Export redacted diagnostic bundles.

## What This Alpha Cannot Do

- It is not production-ready.
- It does not support fixed-layout EPUB, DRM EPUB, PDF, MOBI, or AZW3.
- It does not include telemetry, auto-update, cloud sync, accounts, or a book library service.
- It does not automate desktop reader validation in CI.
- It does not grant permission to process copyrighted books.

## Download Artifacts

Upload artifacts must be attached by the release publisher in GitHub Releases. They are not stored in this git repository.

- `BookTrans Desk Setup 0.2.8-alpha.0.exe`
- `BookTrans Desk 0.2.8-alpha.0.exe`

## Checksums

```text
BookTrans Desk Setup 0.2.8-alpha.0.exe
SHA256: 4F9B464036A767D159F6CAA70DD8E3B9AE86DCEA006EF864786ACA160E9988A0

BookTrans Desk 0.2.8-alpha.0.exe
SHA256: 2FF232BDB6B041E34802DD78716A0547745602634A0196078E101CAC86BC2092
```

## Windows Unsigned Warning

The Windows package is unsigned. Windows SmartScreen may show an unknown publisher warning. Download only from the project GitHub Release page, verify checksums, or build from source. Do not disable system security features to run files from unknown sources.

## Privacy Model

- Importing an EPUB is local and does not upload the file.
- AI translation sends selected book text to the user-configured model provider only when the user starts translation.
- API keys are stored locally in Electron settings.
- Diagnostic bundles are redacted and do not include original EPUB files, exported EPUB files, API keys, Authorization headers, or full book text.
- Users should review their provider privacy terms before translating private or copyrighted content.

## AI Provider Text Transmission Warning

When a real provider is configured, selected book text is sent to that provider for translation. Users should only process EPUBs they have the right to process.

## Supported EPUB Scope

Supported: reflowable EPUB.

Unsupported: fixed-layout EPUB, DRM EPUB, PDF, MOBI, AZW3.

## Known Limitations

- Final decision is CONDITIONAL_GO, not full GO.
- Visual UI launch verification remains pending.
- Calibre and Thorium Reader validation remains pending.
- Windows build is unsigned.
- macOS packaging is not configured.
- Translation quality depends on the configured provider.

## Manual Validation Summary

- Automatic checks: PASS.
- Artifact generation: PASS.
- Checksums: GENERATED_FOR_WINDOWS_ARTIFACTS.
- Packed process smoke launch: PARTIAL_PROCESS_STARTED_UI_NOT_VERIFIED.
- Reader validation: NOT_RUN_ENVIRONMENT_LIMITED.

## How To Report Issues

Use GitHub issue templates. Attach internal validation report Markdown, optional external EPUBCheck output, a redacted diagnostic bundle, or a minimal copyright-safe fixture if available.

Do not upload copyrighted EPUBs or API keys. Also do not upload commercial EPUB files, exported copyrighted EPUB files, Authorization headers, private provider logs, or full book text.
