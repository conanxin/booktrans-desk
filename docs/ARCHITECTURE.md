# Architecture

BookTrans Desk is an Electron desktop app with a React renderer and a Node.js main process.

- Renderer: imports books, edits local API settings, starts or cancels translation, displays progress, and exports completed EPUBs.
- Main process: owns local file access, EPUB parsing, translation orchestration, settings persistence, and export.
- Shared types: define book metadata, chapters, translation settings, and progress events.

No cloud service, account system, telemetry, auto-update, or remote storage is part of Phase 1.
