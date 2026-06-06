# BookTrans Desk

BookTrans Desk is an open source desktop app for translating reflowable EPUB books into Simplified Chinese. It imports a local EPUB, translates XHTML text nodes through an OpenAI-compatible API, writes translated content back into the original XHTML files, and exports a new Chinese EPUB while preserving non-text resources.

## Current Features

- Import local `.epub` files.
- Read title, author, language, manifest, spine, and XHTML chapters.
- Configure OpenAI-compatible `baseUrl`, `apiKey`, and `model` locally.
- Configure optional glossary mappings and translation style.
- Translate XHTML text nodes in place while preserving tags, attributes, links, images, comments, anchors, and inline formatting.
- Persist chapter-level task state in the Electron user data directory for retry/resume.
- Manage previous translation jobs from the Jobs tab.
- Validate exported EPUB files and show PASS/WARNING/FAIL in the UI.
- View, copy, and save detailed validation reports as Markdown.
- Optionally run an external EPUBCheck command after export.
- Review export history from the Exports tab.
- Save and auto-load per-book translation profiles.
- Run generated EPUB fixture regression tests for alpha compatibility baselines.
- Mock translator for local tests and dry runs.
- Export translated EPUB files named `OriginalTitle.zh.epub`.

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## OpenAI-Compatible API

In the Settings tab, enter:

- `baseUrl`, for example `https://api.openai.com/v1`
- `apiKey`, stored only in local Electron settings
- `model`, for example `gpt-4o-mini`
- optional glossary lines such as `agent => 智能体`
- optional style: faithful, fluent, academic, or popular
- optional EPUBCheck command, for example `epubcheck` or `java -jar /path/to/epubcheck.jar`

Do not commit `.env` files. Use `.env.example` only as a template.

## Resume, Retry, and Export Jobs

Open the Jobs tab to view local translation jobs. Each job shows source path, target language, created and updated time, chapter counts, and status. Use Resume to continue an unfinished job, Retry Failed to rerun failed chapters, Retry This Chapter from details to rerun one chapter, Export to rebuild an EPUB from cached translated chapters, and Delete Cache to remove a job.

## Export History and Profiles

The Exports tab records each export with time, book title, output path, validation status, model, and style. You can copy the path, open the containing folder, delete one history item, or clear history.

When a book is imported, BookTrans computes a local fingerprint and loads a saved translation profile if one exists. Use Save Book Profile to store the current model, base URL, glossary, and style for the imported book. API keys are not stored in profiles.

## Validation Reports

After export, the validation panel shows internal EPUB checks, checked file counts, OPF path, manifest count, spine count, XHTML count, errors, warnings, and optional external EPUBCheck output. Use Copy Markdown or Save .md to keep the report.

## Security

- No telemetry, cloud sync, login, online store, or auto-update code is included.
- EPUB files stay local unless the user starts translation with API settings.
- The API key is never hard-coded and is not printed in task logs.
- Translation job files are stored under the app user data directory and do not include API keys.
- Export history and translation profiles are stored under the app user data directory and do not include API keys.
- OpenAI-compatible requests use timeout, cancellation, retry, and redacted errors.
- External EPUBCheck runs without shell execution and has a timeout.
- Tests use the mock translator and do not call external APIs.
- Original source text is sent only to the configured API during an explicit translation task.

## Current Limitations

- Current support targets reflowable EPUB.
- Fixed-layout EPUB, DRM EPUB, PDF, MOBI, and AZW3 are not supported.
- Translation quality depends on the configured model.
- EPUB validation is structural and XML-focused; it is not a full epubcheck replacement.
- Resume works at chapter level, with completed translated XHTML persisted per job.
- No batch translation, library database, online reader, plugin system, installer publishing, or GitHub Actions.

## Roadmap

- Add real-world EPUB fixture coverage for NCX, footnotes, CJK source text, and image-heavy books.
- Add release packaging and CI.
- Improve external EPUBCheck parsing into richer issue categories.
- Add optional local-only history of exported files.

## License

MIT. See `LICENSE`.
