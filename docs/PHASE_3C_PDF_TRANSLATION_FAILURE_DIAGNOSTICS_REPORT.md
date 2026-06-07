# Phase 3C PDF Translation Failure Diagnostics Report

## Summary

Real user testing confirmed the packaged Windows UI can open and import PDFs, but starting MiniMax-M3 PDF translation failed immediately with a raw Electron IPC message:

```text
Error invoking remote method 'translation:start': Error: Translation canceled.
```

Phase 3C fixes cancellation and diagnostics so provider failures, timeouts, PDF chunking problems, and user cancellation are reported with structured error codes and friendly Chinese messages.

Target tag: `v0.3.2-pdf-diagnostics-fix`

## Root Cause

- Provider request timeout used an `AbortController`, and the resulting `AbortError` was treated the same as user cancellation.
- The renderer called `translation:start` as a throwing IPC method, so Electron wrapped failures in `Error invoking remote method`.
- The IPC failure path overwrote real progress with `0 / 0`, hiding previously computed PDF chunk totals.
- PDF translation did not expose a separately testable chunk plan, so no-text and chunking failures were hard to distinguish.
- Provider HTTP failures were not mapped to actionable user-facing codes.

## Implementation

- Added structured translation error codes including `USER_CANCELLED`, `PDF_NO_TEXT`, `PDF_CHUNKING_FAILED`, `PROVIDER_AUTH_FAILED`, `PROVIDER_RATE_LIMITED`, `PROVIDER_TIMEOUT`, `PROVIDER_REQUEST_FAILED`, and `TRANSLATION_OUTPUT_INVALID`.
- Added safe error redaction for Authorization headers, bearer tokens, and API key patterns.
- Added a translation cancellation manager so each new task receives a fresh abort controller.
- Changed `translation:start` to return `IpcResult` instead of throwing raw IPC errors to the renderer.
- Preserved the latest progress snapshot on failure so the UI does not collapse to meaningless `0 / 0` after chunks were computed.
- Added PDF chunk planning before provider calls, with explicit `PDF_NO_TEXT` and `PDF_CHUNKING_FAILED` errors.
- Added safe diagnostic log entries for PDF import size, translation start, page chunk counts, provider request length, and structured error code.
- Added `translator:testConnection` IPC and a settings-panel button for a short model connection test.
- Added renderer error mapping to hide raw Electron IPC wrappers and show Chinese messages plus copyable error codes.

## Verification

- `translationCancellation.test.ts` covers fresh signals after cancellation and `USER_CANCELLED`.
- `pdfChunkingFailure.test.ts` covers `PDF_NO_TEXT`, `PDF_CHUNKING_FAILED`, and non-zero chunk planning.
- `providerErrorMapping.test.ts` covers 401, 429, timeout, and redaction.
- `translatorConnectionTest.test.ts` covers mock connection test and MiniMax thinking-disabled request body.
- `uiErrorMapping.test.ts` confirms raw IPC wrappers are not shown.
- Existing translator, PDF, EPUB, export, and release-check tests remain covered.

## Security Check

- Diagnostic logs record provider preset, model, text length, page counts, chunk counts, and error code only.
- API keys, Authorization headers, full source text, and full translated text are not logged.
- No telemetry, account system, cloud sync, or auto-update was added.
- No PDF, EPUB, screenshots, logs, or release artifacts should be committed.

## Release Decision

FINAL_DECISION: HOLD

This fix improves diagnosis and startup reliability, but it does not claim public PDF readiness. PDF remains HOLD until real MiniMax PDF workflow validation passes and exported PDFs are opened in an external reader.

## Next Steps

- Re-test MiniMax-M3 PDF translation in the packaged Windows UI.
- Use the new model connection test before running a full PDF translation.
- If translation still fails, record the structured error code and progress log instead of screenshots containing API keys or source text.
- Keep PDF release blocked until the full workflow and reader-open checks pass.
