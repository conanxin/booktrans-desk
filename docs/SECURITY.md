# Security

BookTrans Desk is local-first.

- The app does not upload EPUB files during import.
- Source text is sent only after the user starts translation and has configured an API provider.
- API keys are not hard-coded, committed, or printed in logs.
- `.env` files are ignored by git; `.env.example` contains no real secret.
- Translation job cache files are written under the app user data directory, not the source tree.
- Job cache files store source path, book fingerprint, chapter status, failed chunk metadata, and translated XHTML, but never API keys.
- OpenAI-compatible errors redact Bearer tokens and do not expose the Authorization header.
- Request cancellation uses `AbortSignal`; timeout and retry handling do not log secrets.
- Tests use `MockTranslator` and never call a real external API.
- The app contains no telemetry, auto-update, cloud sync, login, online store, or account system.

Users should review the privacy policy of their configured OpenAI-compatible provider before translating copyrighted or sensitive books.
