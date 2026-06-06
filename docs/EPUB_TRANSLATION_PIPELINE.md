# EPUB Translation Pipeline

1. Read `META-INF/container.xml`.
2. Locate the OPF rootfile.
3. Parse metadata, manifest, and spine.
4. Read XHTML or HTML items referenced by the spine.
5. Extract body text from headings, paragraphs, list items, block quotes, and captions.
6. Split extracted text into chunks.
7. Translate chunks with either the mock translator or configured OpenAI-compatible API.
8. Join translated chunks and replace text inside the original XHTML structure.
9. Preserve all other ZIP entries.
10. Update metadata to `zh-CN` and append `（中文翻译版）` to the title.
11. Write a new `.zh.epub`.
