# Architecture

BookTrans Desk is an Electron desktop app with a React renderer and a Node.js main process.

- Renderer: imports books, edits local API settings, starts or cancels translation, displays progress, and exports completed EPUBs.
- Main process: owns local file access, EPUB parsing, XHTML text-node translation orchestration, task-state persistence, settings persistence, export, and EPUB validation.
- Shared types: define book metadata, chapters, translation settings, validation reports, export results, and progress events.

## Main Modules

- `src/main/epub/readEpub.ts`: reads container.xml, OPF metadata, manifest, spine, and XHTML chapter content.
- `src/main/epub/translateXhtmlTextNodes.ts`: parses XHTML and translates eligible body text nodes while preserving structure and skipped tags.
- `src/main/epub/writeTranslatedEpub.ts`: writes the translated EPUB with `mimetype` as the first uncompressed ZIP entry.
- `src/main/epub/validateEpub.ts`: validates exported EPUB structure and parseability.
- `src/main/translate/translationJobStore.ts`: stores chapter-level retry/resume state under the Electron user data directory.
- `src/main/translate/openaiCompatibleTranslator.ts`: sends OpenAI-compatible chat completion requests with timeout, retry, cancellation, and sanitized errors.

No cloud service, account system, telemetry, auto-update, or remote storage is part of Phase 1.5.
