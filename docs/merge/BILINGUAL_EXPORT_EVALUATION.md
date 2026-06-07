# Bilingual Export Evaluation

## Purpose

S7 keeps bilingual export as an evaluated next step instead of folding it into export polish. The goal is to avoid mixing export validation/history work with a new translation-persistence surface.

## Bilingual Markdown Target

- Pair original `UnifiedDocument.units` with translated text when a translation version exists.
- Support whole document first, then selected chapter/page.
- Preserve `sourceHint`, chapter title, page number, role, and unit id.
- Use a simple block format:
  - source locator
  - original paragraph
  - translated paragraph
- Work for EPUB chapters and text PDF pages.

## Bilingual HTML Target

- Use the same data as bilingual Markdown.
- Prefer a readable two-column or stacked paragraph layout.
- Include restrained source metadata near each unit.
- Keep the HTML self-contained enough for local preview.
- Avoid a heavy template system in the baseline.

## Data Sources

- Original text: `UnifiedDocument.units`.
- Source position: chapter/page/unit metadata and `sourceHint`.
- Translation text:
  - existing EPUB translation job results for translated EPUB workflows.
  - future `TranslationVersion` records on `UnifiedDocument`.
  - selected chapter/page translation output once that stage exists.

## Not In Scope

- Bilingual PDF export.
- Exact PDF layout preservation.
- OCR document bilingual output.
- Complex EPUB inline structure reconstruction.
- Cloud sharing or remote preview.

## Risks

- PDF paragraph order can be imperfect when extraction is layout-aware but not semantically complete.
- EPUB inline markup may be flattened in the unified model.
- Translation results are not yet consistently persisted as `UnifiedDocument.translationVersions`.
- Selected chapter/page translation needs a stable storage contract before export can be reliable.
- Long bilingual documents can become too large for a single Markdown/HTML file without navigation.

## S8 Recommendation

S8 should implement bilingual Markdown baseline first. It should use existing UnifiedDocument units and add a small translation lookup layer that can read persisted `TranslationVersion` records when available. After Markdown is stable, add bilingual HTML preview/export with the same source pairing. Bilingual PDF should remain deferred.

## S8 Implementation Result

S8 implemented the recommended baseline:

- Bilingual Markdown export supports full document, selected chapter, selected page, and selected units.
- Bilingual HTML export supports the same scope model and uses inline CSS with side-by-side layout by default.
- HTML output escapes source text, translation text, and source hints; it does not include scripts or external assets.
- Missing translations render as an explicit placeholder: `【暂无译文，请先完成翻译或在后续版本生成。】`.
- EPUB translation completion now creates a lightweight `TranslationVersion` snapshot when the current UnifiedDocument can be matched.
- PDF translation snapshot support exists only for internal experimental results; PDF public release remains HOLD.
- Export history records bilingual export kind, scope, and translation summary.

## Remaining Follow-Up

- Persist translation snapshots for EPUB resume/retry/job export flows.
- Add user-facing translation-version selection when multiple versions exist.
- Improve selected unit UI beyond chapter/page selection.
- Keep bilingual PDF deferred.

## S9 Implementation Result

S9 strengthened the translation-version layer:

- `TranslationVersion` now supports explicit source, scope, status, provider/model/style, job id, unit counts, and translated unit records.
- EPUB full translation and export paths can refresh persisted `epub-translation` snapshots.
- EPUB retry/resume paths use the completed job result when available; single-result jobs can become scoped chapter versions, while broader job results refresh the full version.
- PDF snapshots remain internal and are marked `pdf-experimental`; PDF public release remains HOLD.
- Bilingual Markdown/HTML export can resolve latest matching versions, a specific selected version, or a no-translation placeholder mode.
- The workspace UI exposes translation versions and selected chapter/page translation actions.

## Remaining Follow-Up After S9

- Improve EPUB XHTML-preserving selected chapter translation; the S9 selected chapter baseline translates text units for snapshot/export use.
- Add richer selected-unit multi-select UI.
- Add translation version diff/compare tools.
- Keep bilingual PDF deferred until PDF translation validation is ready.
