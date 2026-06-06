# Privacy Notice

BookTrans Desk runs locally on your computer.

- The app has no telemetry.
- The app has no cloud sync.
- The app has no account system.
- Importing an EPUB does not upload the file.
- When you start translation with a configured AI provider, the text to translate is sent to that provider.
- API keys are stored in local Electron settings.
- Job cache, export history, and translation profile stores do not save API keys.
- External EPUBCheck, if configured, runs as a local command.
- Diagnostic bundles are generated locally and are designed to omit original EPUB files, exported EPUB files, API keys, Authorization headers, and full book text. The app shows this summary before export and writes it into `diagnostic-summary.md`.

You are responsible for confirming that you have the right to process and translate EPUB content with your selected model provider.
