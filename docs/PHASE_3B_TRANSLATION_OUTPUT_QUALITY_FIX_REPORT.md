# Phase 3B Translation Output Quality Fix Report

## Summary

Phase 3B fixes translation output contamination found during real PDF testing. The observed exported PDF contained model reasoning, prompt commentary, English assistant explanations, and a noisy source metadata title. The PDF feature remains HOLD until a visible packaged UI workflow and external reader-open validation pass.

Target tag: `v0.3.1-translation-quality-fix`

## Root Cause

- The previous prompt looked too much like a chat task and did not strongly separate global instructions from source text.
- MiniMax-M3 could return `<think>` reasoning unless provider-specific thinking output was disabled.
- Translation output was accepted without a central sanitize/validate/retry quality gate.
- PDF export did not block contaminated translated paragraphs before writing the PDF.
- PDF export used raw metadata titles such as `Microsoft Word - ...doc`.
- PDF text wrapping was based on a coarse character count rather than measured line width.

## Implementation

- Added a provider preset field with `openai-compatible` and `minimax`.
- Added MiniMax Token Plan defaults: `https://api.minimaxi.com/v1` and `MiniMax-M3`.
- Added MiniMax request body support for `thinking.type = disabled`.
- Replaced the translation prompt with a strict translation-engine protocol using `<source_text>` isolation.
- Added translation output sanitizer for `<think>` blocks, code fences, and common translation prefixes.
- Added translation output validator for reasoning leakage, prompt leakage, high English ratio warnings, and suspiciously short output.
- Added a shared quality wrapper that sanitizes, validates, retries with repair prompt up to two times, and returns a visible failed-translation placeholder instead of polluted model output.
- Wired the quality wrapper into both EPUB XHTML text-node translation and PDF paragraph chunk translation.
- Added progress quality stats for cleaned reasoning output count, retry count, failed chunk count, and quality status.
- Added a PDF export quality gate that blocks export when polluted translated paragraphs are detected.
- Added PDF title cleaning for Microsoft Word and `.doc` / `.docx` metadata noise.
- Improved PDF export layout with A4 sizing, Chinese-friendly font candidates, measured line wrapping, non-monospace body text, wider margins, and safer pagination.

## Verification

- Prompt tests cover strict engine instructions and repair prompts.
- Sanitizer tests cover `<think>`, fences, prefixes, reasoning starts, and normal proper nouns.
- Validator tests cover hard failures, English ratio warnings, and too-short output warnings.
- MiniMax preset tests confirm `thinking.type = disabled` only appears for MiniMax.
- Retry tests confirm invalid assistant commentary retries and failed retries produce a placeholder.
- PDF title tests confirm metadata cleanup.
- PDF export quality gate tests confirm contaminated output is blocked.
- PDF layout tests confirm Chinese font stack, A4, wrapping, break-word behavior, and no monospace body style.

## Security Check

- No API keys are logged or stored in job/export files by this change.
- Provider preset does not write or infer an API key.
- Authorization headers remain redacted from errors.
- No telemetry, account system, cloud sync, or auto-update was added.
- No PDF, EPUB, screenshots, logs, or release artifacts should be committed.

## Release Decision

FINAL_DECISION: HOLD

This fix is required before further PDF testing, but it does not make PDF ready for public release. The PDF feature still requires real packaged UI validation and exported PDF external reader-open validation.

## Known Limitations

- English ratio validation is heuristic and may warn on texts with many proper nouns.
- Failed chunks use a visible placeholder and require user retry.
- PDF export remains reflowed and does not preserve exact original layout.
- OCR, encrypted PDFs, exact table/formula reconstruction, selected-page translation, and batch PDF translation remain unsupported.

## Next Steps

- Re-run real MiniMax-M3 PDF translation with the MiniMax preset.
- Confirm no `<think>`, `Translation:`, `The user wants`, or English prompt commentary appears in exported content.
- Open the exported PDF in at least one external reader.
- Keep PDF release status HOLD until visible UI and reader validation pass.

## Phase 3C Follow-up

Real packaged UI testing then found PDF translation start failures reported as raw `Translation canceled` IPC errors. Phase 3C adds structured cancellation/provider/PDF chunk diagnostics and a MiniMax connection test. PDF remains HOLD.
