# PDF Support Limitations

Current PDF support is an MVP for text PDFs only.

## Validation Status

Phase 3A-V decision: HOLD.

Automated PDF import, translation, validation, and export tests pass, and the packed executable passed a process smoke check. Visible packaged UI validation and exported PDF external reader-open validation were blocked by the current environment, so no public PDF release readiness is claimed.

Phase 3B adds output quality protection after real testing found MiniMax reasoning and prompt commentary in translated PDFs. The app now disables MiniMax thinking output, sanitizes and validates model output, retries invalid chunks, and blocks PDF export if polluted translated text remains. PDF release status is still HOLD until a real manual workflow passes.

## Supported

- Import PDFs with copyable/extractable text.
- Extract page text and metadata when available.
- Translate text by page and paragraph.
- Export a readable translated PDF.
- Detect likely scanned/image-only PDFs and show a friendly unsupported message.

## Not Supported

- OCR.
- Scanned PDF translation.
- Image-only PDF translation.
- In-place layout overlay.
- Exact original PDF layout preservation.
- Precise table reconstruction.
- Formula layout preservation.
- PDF editor features.
- PDF encryption/decryption or DRM handling.
- Batch PDF translation.
- Selected-page translation.

## Export Notes

Exported PDFs are reflowed translated documents. They are intended to be readable, not visually identical to the source PDF.

Complex multi-column, table-heavy, formula-heavy, or poster-like PDFs may translate with limited structure quality. Start with small files when testing.

## Roadmap

- Visible packaged UI validation.
- Exported PDF external reader-open validation.
- OCR.
- Bilingual side-by-side export.
- Layout-aware translation.
- Better table handling.
- Selected pages translation.
- Reader compatibility validation for exported PDFs.
