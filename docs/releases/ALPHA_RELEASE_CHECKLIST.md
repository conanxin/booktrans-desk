# Alpha Release Checklist

Use this checklist before publishing an alpha build.

## Version

- `package.json` version is `0.2.4-alpha.0`.
- `package-lock.json` root version matches `0.2.4-alpha.0`.
- README, CHANGELOG, release notes, and phase report reference `v0.2.4-alpha-stabilization`.

## Privacy And Security

- No `.env` files, API keys, Authorization headers, EPUB files, exported EPUBs, diagnostic zips, logs, or packaged binaries are tracked by git.
- Diagnostic bundles state that original EPUB files, exported EPUB files, API keys, Authorization headers, and full book text are excluded.
- Test fixtures remain synthetic and copyright-safe.

## Verification

- `npm run build`
- `npm test`
- `npm audit`
- `npm run release:check`
- `npm run labels:print`
- `npm run pack`
- `git diff --check`

## Packaging

- Windows alpha packaging remains unsigned.
- `release/` output is ignored by git.
- Testers should read `docs/alpha/ALPHA_TESTER_GUIDE.md` and `docs/alpha/PRIVACY_NOTICE.md`.

## Triage

- GitHub issue templates are present.
- Label taxonomy exists in `docs/triage/LABELS.md`.
- Optional label sync source exists in `scripts/github-labels.json`.
