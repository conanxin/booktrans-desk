# Triage Guide

## Classify Feedback

- Bug: behavior is broken against current documented scope.
- Feature: new workflow or capability request.
- Compatibility: a specific EPUB structure or reader fails.
- Question: usage, configuration, or expectation clarification.

## Safe Reproduction Requests

Ask for the smallest possible synthetic fixture. Do not request full commercial EPUBs, full book text, or private credentials. Prefer generated XHTML snippets, validation reports, and diagnostic bundles.

## Copyrighted Content

If a report includes copyrighted content, ask the reporter to remove it and replace it with a minimal copyright-safe fixture. Do not commit user EPUBs.

## API Keys

If a report includes an API key or Authorization header, ask the reporter to revoke the key and edit the issue. Do not quote the secret in follow-up comments.

## Priority

- P0: data loss, credential leak, app cannot start, or exported diagnostics include sensitive content.
- P1: common EPUB workflow blocked, repeatable export failure, or validation/reporting broken.
- P2: edge compatibility issue, UI polish, docs gap, or feature request.

## Turning Real EPUB Bugs Into Fixtures

Reduce the issue to generated OPF/container/XHTML/resources. Preserve the structural cause, not the copyrighted content. Add the reduced fixture to `tests/helpers/createEpubFixtures.ts` and add a regression test.
