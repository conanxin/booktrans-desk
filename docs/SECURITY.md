# Security

BookTrans Desk is local-first.

- The app does not upload EPUB files during import.
- Source text is sent only after the user starts translation and has configured an API provider.
- API keys are not hard-coded, committed, or printed in logs.
- `.env` files are ignored by git; `.env.example` contains no real secret.
- Translation job cache files are written under the app user data directory, not the source tree.
- Job cache files store source path, book fingerprint, chapter status, failed chunk metadata, and translated XHTML, but never API keys.
- Export history stores output paths, validation statuses, model/style metadata, and glossary hash, but never API keys.
- Translation profiles store base URL, model, glossary, style, and fingerprint, but never API keys.
- OpenAI-compatible errors redact Bearer tokens and do not expose the Authorization header.
- Request cancellation uses `AbortSignal`; timeout and retry handling do not log secrets.
- Job manager IPC returns structured `{ ok, data, error }` results and sanitizes Bearer/API key patterns from errors.
- Renderer code never reads or writes job cache files directly.
- External EPUBCheck is optional, runs through `spawn` with `shell: false`, and has a timeout.
- Generated test fixtures are synthetic and contain no commercial book content.
- Diagnostic bundles omit original EPUBs, exported EPUBs, API keys, Authorization headers, and full book text, and include `diagnostic-summary.md` so testers can verify those exclusions before sharing.
- `npm run labels:print` is print-only; it does not call GitHub APIs and does not read tokens.
- `npm run release:check` verifies `v0.2.8-public-alpha` release prep documents, package version consistency, alpha warning copy, unsigned warning copy, label JSON validity, targeted compatibility matrix coverage, final decision wording, and GitHub Release draft safety wording.
- Public alpha release copy warns users not to upload copyrighted EPUBs or API keys.
- Tests use `MockTranslator` and never call a real external API.
- The app contains no telemetry, auto-update, cloud sync, login, online store, or account system.

Users should review the privacy policy of their configured OpenAI-compatible provider before translating copyrighted or sensitive books.
