# BookTrans Desk

BookTrans Desk is an open source desktop MVP for translating EPUB books into Simplified Chinese. It imports a local EPUB, extracts chapter text in spine order, translates body text through an OpenAI-compatible API, writes translated text back into the original XHTML files, and exports a new Chinese EPUB while preserving non-text resources.

## Current Features

- Import local `.epub` files.
- Read title, author, language, manifest, spine, and XHTML chapters.
- Extract chapter body text without sending files anywhere during import.
- Configure OpenAI-compatible `baseUrl`, `apiKey`, and `model` locally.
- Configure optional glossary mappings and translation style.
- Translate XHTML text nodes in place while preserving tags, attributes, links, images, comments, anchors, and inline formatting.
- Persist chapter-level task state in the Electron user data directory for retry/resume.
- Validate exported EPUB files and show PASS/WARNING/FAIL in the UI.
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

In the desktop app, open AI Settings and enter:

- `baseUrl`, for example `https://api.openai.com/v1`
- `apiKey`, stored only in local Electron settings
- `model`, for example `gpt-4o-mini`
- optional glossary lines such as `agent => 智能体`
- optional style: faithful, fluent, academic, or popular

Do not commit `.env` files. Use `.env.example` only as a template.

## Security

- No telemetry, cloud sync, login, online store, or auto-update code is included.
- EPUB files stay local unless the user starts translation with API settings.
- The API key is never hard-coded and is not printed in task logs.
- Translation job files are stored under the app user data directory and do not include API keys.
- OpenAI-compatible requests use timeout, cancellation, retry, and redacted errors.
- Tests use the mock translator and do not call external APIs.
- Original source text is sent only to the configured API during an explicit translation task.

## Current Limitations

- Phase 1 targets EPUB only.
- Translation quality depends on the configured model.
- EPUB validation is structural and XML-focused; it is not a full epubcheck replacement.
- Resume currently works at chapter level, with completed translated XHTML persisted per job.
- No batch translation, library database, online reader, plugin system, installer publishing, or GitHub Actions.

## Roadmap

- Add full epubcheck integration or optional external validator.
- Add explicit resume/retry job picker UI.
- Add optional local-only history of exported files.

## License

MIT. See `LICENSE`.
