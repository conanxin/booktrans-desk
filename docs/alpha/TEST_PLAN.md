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
- API failure/timeout/cancel: confirm error messages do not leak credentials.
- Security check: run `npm run release:check`.

Do not commit commercial EPUB files or test outputs.
