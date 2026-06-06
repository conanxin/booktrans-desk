# Phase 2.1 Alpha Quality Baseline Report

## Implementation

- Added generated EPUB fixture pack for minimal EPUB 3, EPUB 2 NCX, images/CSS, footnotes/inline markup, CJK source, and malformed missing resource cases.
- Added regression tests for fixture validation, text-node preservation, CJK export, resource preservation, and validator failures.
- Enhanced external EPUBCheck parsing with issue extraction, raw output, duration, sanitized command display, and issue counts.
- Added export history store under app user data with list/get/delete/clear and renderer Export History UI.
- Added per-book translation profile store under app user data with fingerprint matching, save, auto-load on import, and reset.
- Updated tabs to Translate, Jobs, Exports, and Settings.
- Updated compatibility, fixture, architecture, pipeline, security, README, and roadmap docs.

## Verification

- `npm run build`: PASS
- `npm test`: PASS
- `npm audit`: PASS

## Test Coverage

- `epubFixtures.test.ts`
- `runExternalEpubCheck.parse.test.ts`
- `exportHistoryStore.test.ts`
- `translationProfileStore.test.ts`
- Existing regression tests for chunking, mock translator, validator, XHTML translation, job store, job manager, OpenAI-compatible translator, and roundtrip export.

## Known Limitations

- External EPUBCheck parser covers common line formats and keeps raw output for anything unparsed.
- Export history records paths but does not verify files still exist.
- Profiles match by source path, metadata, chapter hrefs, and chapter HTML lengths; heavily edited EPUBs produce new fingerprints.
- Fixed-layout EPUB, DRM EPUB, PDF, MOBI, and AZW3 remain unsupported.

## Next Phase Recommendations

- Add signed release packaging and GitHub Actions.
- Add optional existence checks and cleanup for export history.
- Add richer EPUBCheck issue grouping and filtering.
- Add user-facing alpha test checklist and sample issue template.
