# Alpha Release Checklist

Use this checklist before publishing an alpha build.

## Version

- `package.json` version is `0.2.6-alpha.0`.
- `package-lock.json` root version matches `0.2.6-alpha.0`.
- README, CHANGELOG, release prep docs, and phase report reference `v0.2.6-public-alpha-prep`.

## Privacy And Security

- No `.env` files, API keys, Authorization headers, EPUB files, exported EPUBs, diagnostic zips, logs, or packaged binaries are tracked by git.
- Diagnostic bundles state that original EPUB files, exported EPUB files, API keys, Authorization headers, and full book text are excluded.
- Test fixtures remain synthetic and copyright-safe.
- No commercial EPUB fixtures are committed.
- No generated EPUB files are committed.
- No release artifacts are committed.

## Verification

- `npm run build`
- `npm test`
- `npm audit`
- `npm run release:check`
- `npm run labels:print`
- `npm run pack`
- `git diff --check`

## RC Compatibility

- Synthetic fixture suite PASS.
- Compatibility matrix updated.
- Reader compatibility notes updated.
- Targeted fixtures cover nested sections, split inline text, entities/special chars, nav landmarks, duplicate resource paths, and large chapter chunking.
- Manual packed app launch checked if possible.

## Public Alpha Prep

- Manual reader validation checklist exists.
- RC burn-down is current and has no P0/P1 known blockers.
- GitHub Release draft exists.
- Installer checksum instructions exist.
- Windows unsigned warning copy exists.
- Manual reader validation status is recorded before publishing.
- Checksums are generated locally by the publisher and pasted into the GitHub Release.

## Packaging

- Windows alpha packaging remains unsigned.
- `release/` output is ignored by git.
- Testers should read `docs/alpha/ALPHA_TESTER_GUIDE.md` and `docs/alpha/PRIVACY_NOTICE.md`.

## Triage

- GitHub issue templates are present.
- Label taxonomy exists in `docs/triage/LABELS.md`.
- Optional label sync source exists in `scripts/github-labels.json`.
