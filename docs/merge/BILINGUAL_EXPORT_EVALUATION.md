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
