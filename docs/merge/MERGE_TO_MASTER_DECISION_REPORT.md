# Merge-to-master Decision Report

## Decision

Current recommendation: **NO_MERGE_YET**.

The `merge-documuse-studio` branch is a strong code-complete internal alpha candidate, but it should not be merged to `master` until S11 real Windows desktop click-through validation is complete and the current packaging blocker is resolved.

## S11 Outcome

S11 did not clear the merge gate:

- build: PASS
- test: PASS after rerun, 52 test files / 211 tests
- release:check: PASS
- dev process smoke: PASS
- pack: BLOCKED by process/file lock in `release\win-unpacked`
- real desktop click-through: BLOCKED_MANUAL

Result: keep `NO_MERGE_YET`.

## S12 UX Outcome

S12 addressed the major product-shell feedback:

- The workspace no longer presents a global import/configure/translate/export wizard.
- The left rail now focuses on import, document library, selected document, and task status.
- The center stage focuses on EPUB/PDF reading.
- The right context panel contains AI, Export, Translation, and Details tabs.
- Translation remains available as a task capability rather than the global product spine.
- PDF translation remains clearly labeled `Experimental / HOLD`.

S12 improves merge-branch product coherence, but it does not clear the S11 manual validation blockers.

## Current Branch Strengths

- Maintains the existing BookTrans Desk Electron shell, IPC boundaries, EPUB translation engine, retry/resume jobs, export history, and packaging setup.
- Adds UnifiedDocument snapshots and a local document library.
- Adds EPUB/PDF reading, analysis, chat, and persisted AI state.
- Adds knowledge exports, Full Archive ZIP, Baseline PPTX, bilingual Markdown/HTML, and export validation.
- Adds persisted translation versions and selected translation baselines.
- Keeps API keys out of snapshots and export history.
- Keeps PDF translation public release as HOLD.
- Automated validation is passing: build, tests, release check.

## Current Risks

- Real Windows desktop click-through remains `BLOCKED_MANUAL`.
- S11 pack is currently blocked by an environment/process lock around `release\win-unpacked`.
- Packaged UI needs direct human validation after the merge work.
- The redesigned workspace shell needs real Windows click-through validation.
- PPTX baseline has structural validation but still needs visual validation in PowerPoint/WPS/LibreOffice.
- Bilingual HTML should be opened in a real browser with generated synthetic fixtures.
- Selected EPUB chapter translation is a text-unit snapshot baseline, not an XHTML-preserving translated chapter export.
- PDF translation snapshots are internal and experimental.
- Product/package metadata still says BookTrans Desk.

## Manual Items Required Before Merge

- EPUB import, reading, analysis, chat, full translation, current chapter translation, restart persistence, and export validation.
- PDF import, reading, analysis, chat, experimental current page translation, restart persistence, and export validation.
- Save dialogs and export history for Markdown, JSON, ZIP, PPTX, bilingual Markdown, and bilingual HTML.
- External opening:
  - translated EPUB in an EPUB reader
  - ZIP archive in unzip tooling
  - PPTX in PowerPoint/WPS/LibreOffice
  - HTML in a browser
  - Markdown in an editor
  - JSON in a parser
- Packaged app launch from `release/win-unpacked`.
- Visible confirmation that PDF translation is still experimental/HOLD.

## Merge-to-master Checklist

- [ ] S11 manual Windows validation complete.
- [ ] No generated exports committed.
- [ ] No release artifacts committed.
- [ ] No real user EPUB/PDF files committed.
- [ ] No API keys or local settings committed.
- [ ] `npm run build` passes.
- [ ] `npm test` passes.
- [ ] `npm run release:check` passes.
- [ ] `npm run pack` passes if package metadata changes.
- [ ] README and handoff clearly state release status.
- [ ] Product metadata rename decision made.

## Expected Impact After Merge

Merging to `master` would move the public development branch from a focused BookTrans Desk EPUB/PDF translation project toward DocuMuse Studio. That is desirable only after manual validation, because the README and UI now describe a broader product promise.

## Product Metadata Decision

Do not rename package metadata in S10. Keep:

- package name: `booktrans-desk`
- productName: `BookTrans Desk`
- appId: `dev.booktrans.desk`

Recommended next step: decide after S11 whether the first internal alpha should keep BookTrans Desk metadata or switch productName to DocuMuse Studio in a dedicated change with packaged validation.

## Public Alpha History

Keep BookTrans Desk public alpha history separate. Earlier public alpha releases do not imply DocuMuse Studio merge branch readiness.

## Internal Tag Decision

Do not create a tag now. After S11 passes, consider:

`v0.4.0-documuse-studio-alpha-internal`

Only tag after manual validation results are recorded.

## Final Recommendation

- Merge decision: **NO_MERGE_YET**
- Internal alpha decision: **BLOCKED_BY_MANUAL_VALIDATION**
- Public release decision: **NO_PUBLIC_RELEASE**
- PDF translation release decision: **HOLD**
