# Alpha Tester Guide

BookTrans Desk is a local-first desktop alpha for AI-assisted translation of reflowable EPUB books into Simplified Chinese.

## Supported Today

- Import reflowable EPUB files.
- Translate XHTML text nodes with an OpenAI-compatible API or mock translator.
- Resume and retry chapter-level translation jobs.
- Export translated EPUB files.
- View internal validation reports and optional external EPUBCheck output.
- Track export history and per-book translation profiles.

## Not Supported

- DRM EPUB.
- Fixed-layout EPUB.
- PDF, MOBI, AZW3.
- Cloud sync, accounts, telemetry, auto-update, online reader, batch library management.

## Install Dependencies

```bash
npm install
```

## Start Development Build

```bash
npm run dev
```

## Configure API

Open Settings and enter an OpenAI-compatible base URL, API key, model, optional glossary, and style. The API key stays in local Electron settings.

## Translate an EPUB

1. Open Translate.
2. Import an EPUB.
3. Review or save a book profile.
4. Start translation.
5. Cancel if needed; resume from Jobs later.
6. Export after completion.
7. Review the validation report.

## Resume and Retry

Open Jobs to resume unfinished jobs, retry failed chapters, retry one failed chapter, export cached results, or delete job cache.

## EPUBCheck

In Settings, configure `epubcheck` or `java -jar /path/to/epubcheck.jar`. External EPUBCheck is optional.

## Feedback

Use the GitHub issue templates or `docs/alpha/BUG_REPORT_TEMPLATE.md`.

You may share:

- Internal validation report Markdown.
- External EPUBCheck output.
- Diagnostic bundle exported by the app.
- A minimal synthetic EPUB fixture you created and have the right to share.

Do not share:

- API keys or Authorization headers.
- Commercial EPUB files.
- Full book text.
- Exported translated EPUB files containing copyrighted content.

## Diagnostic Bundle

Use Export Diagnostic Bundle from the validation area. The bundle is designed to include summaries, redacted logs, validation reports, job status counts, and export history filenames without original EPUB files or full book text.
