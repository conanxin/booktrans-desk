# EPUB Translation Pipeline

1. Read `META-INF/container.xml`.
2. Locate the OPF rootfile.
3. Parse metadata, manifest, and spine.
4. Read XHTML or HTML items referenced by the spine.
5. Create or resume a local translation job in the app user data directory.
6. Parse each chapter as XHTML DOM.
7. Traverse body text nodes under headings, paragraphs, list items, block quotes, definitions, and captions.
8. Skip text inside `script`, `style`, `svg`, `math`, `code`, `pre`, and `noscript`.
9. Translate eligible text nodes, merging short adjacent runs only when they can be mapped back safely.
10. Preserve original tags, attributes, ids, classes, links, images, anchors, comments, and inline formatting.
11. Persist completed chapter XHTML and failed chunk metadata for retry/resume.
12. Preserve all non-chapter ZIP entries.
13. Update metadata language to `zh-CN` and append a Chinese translation title suffix.
14. Write a new `.zh.epub` with `mimetype` as the first uncompressed ZIP entry.
15. Validate the exported EPUB and return a structured PASS/WARNING/FAIL report to the UI.
16. If configured, run external EPUBCheck with a timeout and append the result to the export report.
17. Let the user copy or save the combined validation report as Markdown.

The validator checks basic EPUB structure, OPF manifest and spine consistency, manifest file presence, and XHTML XML parseability. It is intentionally local and lightweight; it does not replace a full EPUB conformance suite.

The Jobs tab reads the same user-data job store through main-process IPC. It can resume unfinished jobs, retry all failed chapters, retry one failed chapter, export cached translated chapters, delete one cache, or clear completed job caches.
