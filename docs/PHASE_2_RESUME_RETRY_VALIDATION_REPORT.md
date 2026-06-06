# Phase 2 Resume, Retry, and Validation Report

## Implementation

- Committed Phase 1.5 as `feat: harden epub translation pipeline` and tagged `v0.1.5-epub-hardening`.
- Added a Jobs tab with job history, summary counts, chapter details, Resume, Retry Failed, Retry This Chapter, Export, Delete Cache, and Clear Completed.
- Added structured main-process job IPC through `jobs:list`, `jobs:get`, `jobs:resume`, `jobs:retryFailed`, `jobs:retryChapter`, `jobs:delete`, and `jobs:clearCompleted` style handlers.
- Added a detailed validation report panel with status, summary, errors, warnings, checked files, OPF path, manifest count, spine count, XHTML checked count, and external EPUBCheck output.
- Added Markdown report generation, clipboard copy, and save-to-local `.md` workflow.
- Added optional external EPUBCheck command support with timeout and `spawn` execution without shell.
- Added an EPUB compatibility matrix focused on reflowable EPUB support boundaries.

## Verification Results

- `npm run build`: PASS
- `npm test`: PASS
- `npm audit`: PASS

## Test Coverage

- Job Manager: list, get, retry failed chapters, retry one chapter, delete job, clear completed jobs.
- Validation report Markdown: status, errors, warnings, checked files, and counts.
- External EPUBCheck: unavailable, pass, fail, timeout, and sensitive output redaction.
- Regression coverage remains for chunking, mock translator, EPUB validation, XHTML text-node translation, job store, OpenAI-compatible translator, and EPUB roundtrip.

## Known Limitations

- External EPUBCheck output is displayed as captured stdout/stderr; issue-level parsing is intentionally minimal.
- Jobs are tied to the original source EPUB path, so moving the source file can prevent resume/export.
- Retry This Chapter targets failed chapters; broader per-chapter retranslation controls can be added later.
- Compatibility matrix still needs real-world EPUB 2, NCX, CJK, footnote, and image-heavy fixtures.

## Next Phase Recommendations

- Add fixture packs for common EPUB producers and reader compatibility checks.
- Add richer external EPUBCheck issue parsing.
- Add local export history without creating a full library database.
- Add per-book translation profiles and language target selection.
