# PDF Support Limitations

Current PDF support is an MVP for text PDFs only.

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

- OCR.
- Bilingual side-by-side export.
- Layout-aware translation.
- Better table handling.
- Selected pages translation.
- Reader compatibility validation for exported PDFs.
