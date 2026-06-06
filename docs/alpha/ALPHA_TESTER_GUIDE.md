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

Use `docs/alpha/BUG_REPORT_TEMPLATE.md`. Do not paste API keys, full copyrighted book text, or private model-provider credentials.
