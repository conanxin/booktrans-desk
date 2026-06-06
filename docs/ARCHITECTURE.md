# Architecture

BookTrans Desk is an Electron desktop app with a React renderer and a Node.js main process.

- Renderer: imports books, edits local API settings, starts or cancels translation, displays progress, manages jobs, and shows validation reports.
- Main process: owns local file access, EPUB parsing, XHTML text-node translation orchestration, task-state persistence, settings persistence, export, internal EPUB validation, optional external EPUBCheck execution, and Markdown report saving.
- Shared types: define book metadata, chapters, translation settings, job summaries, validation reports, export results, IPC results, and progress events.

## Main Modules

- `src/main/epub/readEpub.ts`: reads container.xml, OPF metadata, manifest, spine, and XHTML chapter content.
- `src/main/epub/translateXhtmlTextNodes.ts`: parses XHTML and translates eligible body text nodes while preserving structure and skipped tags.
- `src/main/epub/writeTranslatedEpub.ts`: writes the translated EPUB with `mimetype` as the first uncompressed ZIP entry.
- `src/main/epub/validateEpub.ts`: validates exported EPUB structure and parseability.
- `src/main/epub/runExternalEpubCheck.ts`: optionally runs user-configured EPUBCheck without shell execution.
- `src/main/translate/translationJobStore.ts`: stores chapter-level retry/resume state under the Electron user data directory.
- `src/main/translate/jobManager.ts`: exposes structured job list/get/retry/delete operations for IPC and tests.
- `src/main/translate/openaiCompatibleTranslator.ts`: sends OpenAI-compatible chat completion requests with timeout, retry, cancellation, and sanitized errors.
- `src/renderer/components/JobManagerPanel.tsx`: displays job history, actions, and chapter details.
- `src/renderer/components/ValidationReportPanel.tsx`: displays internal and external validation details and exports Markdown.

No cloud service, account system, telemetry, auto-update, or remote storage is part of Phase 2.
