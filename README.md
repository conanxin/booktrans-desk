# BookTrans Desk

BookTrans Desk is an open source desktop MVP for translating EPUB books into Simplified Chinese. It imports a local EPUB, extracts chapter text in spine order, translates body text through an OpenAI-compatible API, writes translated text back into the original XHTML files, and exports a new Chinese EPUB while preserving non-text resources.

## Current Features

- Import local `.epub` files.
- Read title, author, language, manifest, spine, and XHTML chapters.
- Extract chapter body text without sending files anywhere during import.
- Configure OpenAI-compatible `baseUrl`, `apiKey`, and `model` locally.
- Chunk chapter text before translation.
- Preserve HTML tags as much as possible by replacing text content inside existing XHTML nodes.
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

Do not commit `.env` files. Use `.env.example` only as a template.

## Security

- No telemetry, cloud sync, login, online store, or auto-update code is included.
- EPUB files stay local unless the user starts translation with API settings.
- The API key is never hard-coded and is not printed in task logs.
- Tests use the mock translator and do not call external APIs.
- Original source text is sent only to the configured API during an explicit translation task.

## Current Limitations

- Phase 1 targets EPUB only.
- Translation quality depends on the configured model.
- Complex XHTML with deeply split inline text may not preserve every inline boundary perfectly.
- No batch translation, library database, online reader, plugin system, installer publishing, or GitHub Actions.

## Roadmap

- Improve XHTML text-node mapping for complex inline structures.
- Add chapter-level retry and resume.
- Add EPUB validation and reader compatibility checks.
- Add glossary and terminology controls.
- Add optional local-only history of exported files.

## License

MIT. See `LICENSE`.
