# Release Decision Policy

This policy defines when a build can be publicly released.

## General Alpha Gate

- `npm run build` PASS.
- `npm test` PASS.
- `npm audit` PASS.
- `npm run release:check` PASS.
- `npm run pack` PASS or limitation documented.
- No tracked release artifacts, `.env`, EPUB/PDF test artifacts, logs, API keys, or Bearer tokens.
- No P0/P1 blockers.

## PDF Public Release Gate

Before publicly releasing PDF translation, all of the following must be true:

- packaged UI visible PASS.
- PDF import minimal-text PASS.
- PDF translate with mock/test provider PASS.
- PDF export PASS.
- exported PDF opens in at least one reader PASS.
- no P0/P1 blockers.

If these are not complete, the PDF build must be marked internal RC, CONDITIONAL_GO, or HOLD. It must not be described as fully public-release ready.
