# Reader Compatibility Notes

BookTrans Desk does not launch desktop readers in CI. Use these readers for manual checks of exported EPUB files during alpha testing.

| Reader | Platform | Status | Notes |
| --- | --- | --- | --- |
| Calibre | Windows/Linux/macOS | Recommended for alpha testing | Manual |
| Thorium Reader | Windows/Linux/macOS | Recommended for EPUB3 | Manual |
| Apple Books | macOS/iOS | Not automated | Future manual testing |
| Kindle Previewer | Windows/macOS | Not automated | Kindle conversion may alter EPUB |
| SumatraPDF | Windows | Basic EPUB viewing | Manual |

If a reader reports an error, attach the internal validation report, optional external EPUBCheck output, and a diagnostic bundle. Do not attach commercial EPUB files, exported copyrighted EPUB files, API keys, Authorization headers, or full book text.
