# Alpha Test Plan

Run generated fixture tests first:

```bash
npm test
```

Manual scenarios:

- Minimal EPUB: import, translate with mock or real configured API, export, validate.
- EPUB 2 NCX: import and validate compatibility.
- Images and CSS: confirm exported EPUB still contains resources.
- Footnotes and inline tags: confirm links, ids, classes, `epub:type`, strong/em/span/a survive.
- CJK source: confirm import/export text is not garbled.
- Interrupted translation: cancel mid-task and resume from Jobs.
- Failed chapter retry: simulate provider failure, retry failed chapters.
- Export history: export, copy path, open folder, delete item, clear history.
- Per-book profile: save profile, reimport same book, confirm profile loads.
- External EPUBCheck: configure local command and review issue list.
- EPUBCheck grouping: confirm top codes, affected files, and grouped issue list are readable.
- Export history cleanup: move/delete an exported file, refresh status, remove missing records.
- Diagnostic bundle: export bundle and confirm it contains no EPUB files, API keys, or full book text.
- Diagnostic summary: confirm UI and `diagnostic-summary.md` state original EPUB files, exported EPUB files, API keys, Authorization headers, and full book text are excluded.
- API failure/timeout/cancel: confirm error messages do not leak credentials.
- Security check: run `npm run release:check`.
- Label print check: run `npm run labels:print` and confirm it prints instructions only.

Do not commit commercial EPUB files or test outputs.
