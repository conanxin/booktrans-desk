# Contributing

Thanks for helping improve BookTrans Desk.

## Local Development

```bash
npm install
npm run dev
```

## Validation

```bash
npm run build
npm test
npm audit
npm run release:check
```

## Rules

- Do not commit `.env` files or API keys.
- Do not commit commercial or copyrighted EPUB files.
- Do not commit generated installers, `release/`, `dist/`, or `node_modules/`.
- Use generated fixtures or clearly redistributable public-domain/open-source samples.
- Keep tests local: no real AI API, no network EPUB downloads, no required external EPUBCheck.

## Issues and Pull Requests

Describe the EPUB type, operating system, steps to reproduce, expected result, actual result, and validation report when relevant. Keep PRs focused and include tests for behavior changes.
