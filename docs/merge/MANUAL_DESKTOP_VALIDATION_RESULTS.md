# Manual Desktop Validation Results

## Environment

- Date: 2026-06-07
- Branch: `merge-documuse-studio`
- Commit under validation: `d45ce8e docs: frame DocuMuse Studio merge readiness`
- Synthetic EPUB: `temp/manual-fixtures/synthetic-reading.epub`
- Synthetic PDF: `temp/manual-fixtures/synthetic-paper.pdf`
- Fixture status: present and ignored by git.
- Public release: not created.
- PDF translation public release: HOLD.

## Baseline Command Results

| Command | Result | Notes |
| --- | --- | --- |
| `git checkout merge-documuse-studio` | PASS | Already on branch. |
| `git pull` | PASS | Already up to date with `origin/merge-documuse-studio`. |
| `git status` | PASS | Clean before S11 docs. |
| `npm install` | PASS | Up to date, 0 vulnerabilities. |
| `npm run build` | PASS | TypeScript and Vite build passed. |
| `npm test` | PASS_AFTER_RERUN | One early run failed in `packagedRendererPaths`; immediate rerun passed. Final validation later hit the known PDF fixture/pdfjs timeout fluctuation; immediate rerun passed, 52 files / 211 tests. |
| `npm run release:check` | PASS | Build, tests, audit, and repository safety scan passed. |
| `npm run pack` | BLOCKED_ENVIRONMENT_PROCESS_LOCK | Multiple retries failed or timed out while electron-builder operated on `release/win-unpacked`. See S11 bug list. |

## Dev App Smoke

| Item | Result | Notes |
| --- | --- | --- |
| Vite ready | PASS | `http://127.0.0.1:5173/`. |
| TypeScript watch | PASS | `Found 0 errors. Watching for file changes.` |
| Electron process launched | PASS_PROCESS_SMOKE | Electron main, GPU, utility, and renderer processes were observed. |
| Real interactive window click-through | BLOCKED_MANUAL | No user-operated Windows desktop click-through was performed in this run. |
| stderr | PASS | Empty in captured smoke logs. |
| Residual dev processes cleanup | PASS | Matching processes were stopped after smoke. |

## Packaged App Smoke

| Item | Result | Notes |
| --- | --- | --- |
| `release/win-unpacked` generated | BLOCKED | Pack command did not complete cleanly. |
| `BookTrans Desk.exe` generated | FAIL | Only partial `electron.exe` output was observed during timed-out pack attempts. |
| Packaged app launches | BLOCKED_PACK | No valid packaged executable was available from this S11 run. |
| White screen check | BLOCKED_PACK | Not run. |
| File picker check | BLOCKED_PACK | Not run. |
| Save dialog check | BLOCKED_PACK | Not run. |

## EPUB Checklist

All EPUB real desktop items remain `BLOCKED_MANUAL` because the user did not complete a Windows desktop click-through during this run.

| Item | Result | Notes |
| --- | --- | --- |
| App can import synthetic-reading.epub | BLOCKED_MANUAL | |
| Imported EPUB appears in document library | BLOCKED_MANUAL | |
| User can open EPUB workspace | BLOCKED_MANUAL | |
| Header shows title / source format / document kind / analysis status / chat count | BLOCKED_MANUAL | |
| Chapter selector works | BLOCKED_MANUAL | |
| Chapter text is readable | BLOCKED_MANUAL | |
| Quick analysis starts | BLOCKED_MANUAL | |
| Quick analysis completes | BLOCKED_MANUAL | |
| Analysis result is displayed | BLOCKED_MANUAL | |
| User can ask one question | BLOCKED_MANUAL | |
| Assistant answer appears | BLOCKED_MANUAL | |
| Chat sources show chapter/sourceHint/unit information | BLOCKED_MANUAL | |
| Document Markdown export succeeds | BLOCKED_MANUAL | |
| Document JSON export succeeds | BLOCKED_MANUAL | |
| Chat Markdown export succeeds | BLOCKED_MANUAL | |
| Analysis Markdown export succeeds | BLOCKED_MANUAL | |
| Study Notes export succeeds | BLOCKED_MANUAL | |
| Research Digest export succeeds | BLOCKED_MANUAL | |
| Presentation Outline export succeeds | BLOCKED_MANUAL | |
| Podcast Prep export succeeds | BLOCKED_MANUAL | |
| Full Archive ZIP export succeeds | BLOCKED_MANUAL | |
| Baseline PPTX export succeeds | BLOCKED_MANUAL | |
| Bilingual Markdown full export succeeds | BLOCKED_MANUAL | |
| Bilingual HTML full export succeeds | BLOCKED_MANUAL | |
| Bilingual Markdown current chapter export succeeds | BLOCKED_MANUAL | |
| Bilingual HTML current chapter export succeeds | BLOCKED_MANUAL | |
| EPUB full translation starts | BLOCKED_MANUAL | |
| EPUB full translation completes or fails with clear user-facing error | BLOCKED_MANUAL | |
| EPUB translated export still works, if translation completes | BLOCKED_MANUAL | |
| Translation version appears after successful translation | BLOCKED_MANUAL | |
| Current chapter translation baseline works or gives clear error | BLOCKED_MANUAL | |
| Close app | BLOCKED_MANUAL | |
| Reopen app | BLOCKED_MANUAL | |
| Reopen same EPUB from document library | BLOCKED_MANUAL | |
| Analysis result persists | BLOCKED_MANUAL | |
| Chat history persists | BLOCKED_MANUAL | |
| Translation version persists | BLOCKED_MANUAL | |
| Export history persists | BLOCKED_MANUAL | |
| Open exported Markdown in editor | BLOCKED_MANUAL | |
| Open exported JSON or parse it | BLOCKED_MANUAL | |
| Unzip exported ZIP | BLOCKED_MANUAL | |
| Open exported HTML in browser | BLOCKED_MANUAL | |
| Open exported PPTX in PowerPoint/WPS/LibreOffice, if available | BLOCKED_MANUAL | |

## PDF Checklist

All PDF real desktop items remain `BLOCKED_MANUAL` because the user did not complete a Windows desktop click-through during this run.

| Item | Result | Notes |
| --- | --- | --- |
| App can import synthetic-paper.pdf | BLOCKED_MANUAL | |
| Imported PDF appears in document library | BLOCKED_MANUAL | |
| User can open PDF workspace | BLOCKED_MANUAL | |
| Header shows title / source format / document kind / analysis status / chat count | BLOCKED_MANUAL | |
| PDF shows Experimental / HOLD translation status | BLOCKED_MANUAL | |
| Page selector works | BLOCKED_MANUAL | |
| Page text is readable | BLOCKED_MANUAL | |
| Paragraph/unit sourceHint is visible | BLOCKED_MANUAL | |
| Role metadata is visible where available | BLOCKED_MANUAL | |
| Bbox metadata is visible/collapsible where available | BLOCKED_MANUAL | |
| Quick analysis starts | BLOCKED_MANUAL | |
| Quick analysis completes | BLOCKED_MANUAL | |
| Analysis result is displayed | BLOCKED_MANUAL | |
| User can ask one question | BLOCKED_MANUAL | |
| Assistant answer appears | BLOCKED_MANUAL | |
| Chat sources show page/sourceHint/unit/role information | BLOCKED_MANUAL | |
| Document Markdown export succeeds | BLOCKED_MANUAL | |
| Document JSON export succeeds | BLOCKED_MANUAL | |
| Chat Markdown export succeeds | BLOCKED_MANUAL | |
| Analysis Markdown export succeeds | BLOCKED_MANUAL | |
| Study Notes export succeeds | BLOCKED_MANUAL | |
| Research Digest export succeeds | BLOCKED_MANUAL | |
| Presentation Outline export succeeds | BLOCKED_MANUAL | |
| Podcast Prep export succeeds | BLOCKED_MANUAL | |
| Full Archive ZIP export succeeds | BLOCKED_MANUAL | |
| Baseline PPTX export succeeds | BLOCKED_MANUAL | |
| Bilingual Markdown full export succeeds | BLOCKED_MANUAL | |
| Bilingual HTML full export succeeds | BLOCKED_MANUAL | |
| Bilingual Markdown current page export succeeds | BLOCKED_MANUAL | |
| Bilingual HTML current page export succeeds | BLOCKED_MANUAL | |
| Experimental current page translation button is visible with HOLD warning | BLOCKED_MANUAL | |
| Experimental current page translation works or fails with clear user-facing error | BLOCKED_MANUAL | |
| PDF translation remains marked experimental / HOLD | BLOCKED_MANUAL | |
| Close app | BLOCKED_MANUAL | |
| Reopen app | BLOCKED_MANUAL | |
| Reopen same PDF from document library | BLOCKED_MANUAL | |
| Analysis result persists | BLOCKED_MANUAL | |
| Chat history persists | BLOCKED_MANUAL | |
| Translation version persists if experimental translation was run | BLOCKED_MANUAL | |
| Export history persists | BLOCKED_MANUAL | |
| Open exported Markdown in editor | BLOCKED_MANUAL | |
| Open exported JSON or parse it | BLOCKED_MANUAL | |
| Unzip exported ZIP | BLOCKED_MANUAL | |
| Open exported HTML in browser | BLOCKED_MANUAL | |
| Open exported PPTX in PowerPoint/WPS/LibreOffice, if available | BLOCKED_MANUAL | |

## Export External Open Validation

| File type | Result | Notes |
| --- | --- | --- |
| Markdown | BLOCKED_MANUAL | No manual export file was produced in this run. |
| JSON | BLOCKED_MANUAL | No manual export file was produced in this run. |
| ZIP | BLOCKED_MANUAL | No manual export file was produced in this run. |
| PPTX | BLOCKED_MANUAL | No manual export file was produced in this run. |
| HTML | BLOCKED_MANUAL | No manual export file was produced in this run. |
| Translated EPUB | BLOCKED_MANUAL | No manual translated EPUB was produced in this run. |

## Persistence Validation

| Area | Result | Notes |
| --- | --- | --- |
| Analysis persistence | BLOCKED_MANUAL | Requires real import, analysis, close, restart, reopen. |
| Chat persistence | BLOCKED_MANUAL | Requires real chat, close, restart, reopen. |
| Translation version persistence | BLOCKED_MANUAL | Requires real translation, close, restart, reopen. |
| Export history persistence | BLOCKED_MANUAL | Requires real export, close, restart, reopen. |

## Decision

- Merge-to-master decision: `NO_MERGE_YET`.
- Internal alpha readiness: `BLOCKED_BY_MANUAL_VALIDATION`.
- Public release: `NO`.
- PDF translation public release: `HOLD`.
