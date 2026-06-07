# S11 Manual Windows Validation Plan

## Purpose

S11 validates the DocuMuse Studio merge branch in a real Windows desktop window. This is the main gate before considering merge to `master` or an internal alpha tag.

## Environment Preparation

```bash
cd D:\WSL\Codex\booktrans-desk
git checkout merge-documuse-studio
git pull
npm install
npm run dev
```

Use only synthetic or non-sensitive documents.

Recommended existing synthetic fixtures:

- `temp/manual-fixtures/synthetic-reading.epub`
- `temp/manual-fixtures/synthetic-paper.pdf`

Do not commit generated exports, release artifacts, real documents, or API keys.

## EPUB Flow

| Step | Result | Notes |
| --- | --- | --- |
| Import `synthetic-reading.epub` | TBD | |
| Confirm EPUB appears in document library | TBD | |
| Open unified workspace | TBD | |
| Confirm title, filename, document kind, chapter count, unit count | TBD | |
| Select Chapter 1 | TBD | |
| Select Chapter 2 | TBD | |
| Confirm chapter text changes | TBD | |
| Run quick analysis | TBD | |
| Confirm summary, key points, keywords | TBD | |
| Ask one question | TBD | |
| Confirm answer and sources with chapter/unit hints | TBD | |
| Translate full book | TBD | |
| Confirm full translation job completes or records issue | TBD | |
| Translate current chapter | TBD | |
| Confirm chapter-scoped translation version appears | TBD | |
| Export translated EPUB | TBD | |
| Export Document Markdown | TBD | |
| Export Document JSON | TBD | |
| Export Full Archive ZIP | TBD | |
| Export Baseline PPTX | TBD | |
| Export bilingual Markdown full | TBD | |
| Export bilingual HTML full | TBD | |
| Export bilingual Markdown current chapter | TBD | |
| Export bilingual HTML current chapter | TBD | |
| Close app | TBD | |
| Restart app | TBD | |
| Reopen EPUB from library | TBD | |
| Confirm analysis persists | TBD | |
| Confirm chat persists | TBD | |
| Confirm translation versions persist | TBD | |
| Confirm export history persists | TBD | |

## PDF Flow

| Step | Result | Notes |
| --- | --- | --- |
| Import `synthetic-paper.pdf` | TBD | |
| Confirm PDF appears in document library | TBD | |
| Open unified workspace | TBD | |
| Confirm page count, unit count, document kind | TBD | |
| Select page 1 | TBD | |
| Select page 2 if available | TBD | |
| Confirm page text changes | TBD | |
| Confirm sourceHint / role / bbox metadata is visible but not noisy | TBD | |
| Run quick analysis | TBD | |
| Confirm summary, key points, keywords | TBD | |
| Ask one question | TBD | |
| Confirm answer and sources with page/source/unit hints | TBD | |
| Run experimental current page translation | TBD | |
| Confirm page-scoped `pdf-experimental` translation version appears | TBD | |
| Confirm PDF translation HOLD / experimental messaging remains visible | TBD | |
| Export Document Markdown | TBD | |
| Export Document JSON | TBD | |
| Export Full Archive ZIP | TBD | |
| Export Baseline PPTX | TBD | |
| Export bilingual Markdown full | TBD | |
| Export bilingual HTML full | TBD | |
| Export bilingual Markdown current page | TBD | |
| Export bilingual HTML current page | TBD | |
| Close app | TBD | |
| Restart app | TBD | |
| Reopen PDF from library | TBD | |
| Confirm analysis persists | TBD | |
| Confirm chat persists | TBD | |
| Confirm translation versions persist | TBD | |
| Confirm export history persists | TBD | |

## Packaged Flow

```bash
npm run pack
```

Then open:

```text
release\win-unpacked\BookTrans Desk.exe
```

Repeat the minimum flow:

- Import synthetic EPUB.
- Open workspace.
- Run quick analysis.
- Ask one question.
- Export Markdown.
- Restart packaged app.
- Confirm persistence.
- Import synthetic text PDF.
- Open workspace.
- Run quick analysis.
- Ask one question.
- Export Markdown.
- Confirm PDF translation remains HOLD.

## External Open Validation

| Artifact | Tool | Result | Notes |
| --- | --- | --- | --- |
| Translated EPUB | EPUB reader / Calibre | TBD | |
| Full Archive ZIP | Explorer / unzip tool | TBD | |
| Baseline PPTX | PowerPoint / WPS / LibreOffice | TBD | |
| Bilingual HTML | Browser | TBD | |
| Markdown exports | Markdown editor | TBD | |
| JSON export | JSON parser/editor | TBD | |

## Result Legend

- PASS: completed and visually confirmed.
- FAIL: attempted and failed; include reproduction notes.
- BLOCKED: could not execute due to environment/tooling.
- NOTES: behavior was acceptable but needs follow-up.

## Release Boundary

Passing S11 does not automatically publish a release. It only unlocks merge-to-master planning and possible internal alpha tag discussion.

PDF translation public release remains HOLD.
