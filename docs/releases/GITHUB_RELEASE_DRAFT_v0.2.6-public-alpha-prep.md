# GitHub Release Draft: v0.2.6-public-alpha-prep

## Release Title Suggestion

BookTrans Desk v0.2.6 Public Alpha Prep

## Tag Suggestion

`v0.2.6-public-alpha-prep`

## Summary

BookTrans Desk is an open source desktop alpha for translating reflowable EPUB books into Simplified Chinese with an OpenAI-compatible provider. This release prepares the project for public alpha testing with manual reader validation guidance, RC burn-down criteria, checksum instructions, and clearer unsigned Windows package messaging.

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
- It does not provide legal permission to process copyrighted books.
- It does not automate desktop reader validation in CI.

## Download/Install Notes

- Download packages only from the project GitHub Release page.
- Windows package is unsigned.
- Keep backups of original EPUB files.
- Users may build from source if they prefer not to run a prebuilt alpha package.

## Windows Unsigned Warning

The Windows alpha build is unsigned. Windows SmartScreen may show an unknown publisher warning. Do not disable system security features to run files from unknown sources. Only use packages from the project GitHub Release page or build from source.

## Privacy Model

- Importing an EPUB is local and does not upload the file.
- AI translation sends selected book text to the user-configured model provider only when the user starts translation.
- API keys are stored locally in Electron settings.
- Diagnostic bundles are redacted and do not include original EPUB files, exported EPUB files, API keys, Authorization headers, or full book text.
- Users should review their provider privacy terms before translating private or copyrighted content.

## Supported EPUB Scope

Supported: reflowable EPUB.

Unsupported: fixed-layout EPUB, DRM EPUB, PDF, MOBI, AZW3.

Users should only process EPUBs they have the right to process.

## Known Limitations

- Windows packages are unsigned.
- macOS packaging is not configured.
- Reader validation is manual.
- EPUBCheck integration is optional and depends on local user configuration.
- Translation quality depends on the configured provider and prompt settings.

## How To Report Bugs

Use the GitHub issue templates. Attach:

- Internal validation report Markdown.
- Optional external EPUBCheck output.
- Redacted diagnostic bundle.
- Minimal copyright-safe fixture if available.

## What Not To Upload In Issues

Do not upload copyrighted EPUBs or API keys. Also do not upload commercial EPUB files, exported copyrighted EPUB files, Authorization headers, private provider logs, or full book text.

## Checksums

SHA256 checksums will be added by the release publisher after local package generation.

```text
BookTrans-Desk-Setup.exe: SHA256_PLACEHOLDER
BookTrans-Desk.AppImage: SHA256_PLACEHOLDER
```

## Manual Reader Validation

Manual reader validation should follow `docs/releases/MANUAL_READER_VALIDATION_CHECKLIST.md`. Calibre and Thorium Reader are recommended baseline readers for public alpha prep.

## Links

- `README.md`
- `docs/alpha/ALPHA_TESTER_GUIDE.md`
- `docs/alpha/PRIVACY_NOTICE.md`
- `docs/READER_COMPATIBILITY_NOTES.md`
- `docs/releases/MANUAL_READER_VALIDATION_CHECKLIST.md`
- `docs/releases/INSTALLER_CHECKSUMS.md`
- `docs/releases/WINDOWS_UNSIGNED_WARNING.md`
- `docs/releases/RC_BURNDOWN.md`
