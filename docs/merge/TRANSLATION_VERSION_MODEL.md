# Translation Version Model

## Purpose

Translation versions make translated text part of the local `UnifiedDocument` snapshot instead of leaving it only in transient EPUB/PDF job state. This allows bilingual Markdown/HTML export to reuse real translations, choose between versions, and fall back honestly when translation is missing.

## Core Fields

`TranslationVersion` now records:

- `id`
- `label`
- `documentId`
- `sourceFormat`: `epub` / `pdf`
- `source`: `epub-translation` / `pdf-experimental` / `manual` / `imported` / `missing`
- `scope`: `full`, `chapter`, `page`, or `units`
- `status`: `completed`, `partial`, `failed`, or `stale` plus legacy running states
- `provider`
- `model`
- `style`
- `jobId`
- `translatedUnitCount`
- `totalUnitCount`
- `missingUnitCount`
- `units`
- `unitTranslations` for compatibility
- `createdAt`
- `updatedAt`

## Translated Units

Each translated unit records:

- `sourceUnitId`
- `sourceHash`
- `sourceTextPreview`
- `translatedText`
- `status`: `translated`, `missing`, `failed`, or `experimental`
- `source`
- `error`
- `updatedAt`

The full source text remains available through `sourceText` for compatibility, but exporters primarily resolve translations by `sourceUnitId`.

## Scope Resolution

Bilingual export resolves translations in this order:

1. specific `translationVersionId`, if selected
2. latest version matching the requested scope
3. latest full-document version
4. latest completed/partial version
5. missing placeholder fallback

If the user chooses no translation, exporters skip version lookup and emit placeholders.

## EPUB Snapshot

Completed EPUB translations create a version with `source: epub-translation`. The current baseline maps translated chapter HTML back to chapter-level `UnifiedDocument` units by original chapter id.

## PDF Snapshot

PDF translation versions are marked `source: pdf-experimental`. They can support internal bilingual export, but PDF public release remains HOLD.

## Known Limits

- EPUB retry/resume paths refresh snapshots through completed job results where available, but deeper chunk-level merge/diff is still future work.
- Selected unit multi-select UI is not implemented yet.
- There is no complex version diff UI.
- Bilingual PDF export remains out of scope.
