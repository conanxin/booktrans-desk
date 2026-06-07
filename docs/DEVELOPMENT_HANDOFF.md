# BookTrans Desk Development Handoff

Repository:
https://github.com/conanxin/booktrans-desk

Current branch:
master

Latest known stable development tag:
v0.3.3-layout-aware-pdf-extraction

Current status:

- EPUB translation pipeline: usable alpha
- Chinese UI redesign: completed
- Packaged white-screen hotfix: completed
- MiniMax Token Plan preset: implemented
- Translation quality gate: implemented
- PDF text translation MVP: implemented but experimental
- Layout-aware PDF extraction: implemented
- PDF public release: HOLD until real packaged UI and reader validation pass

Important tags:

- v0.2.9-public-alpha-conditional
- v0.2.12-white-screen-hotfix
- v0.2.14-chinese-ui-redesign
- v0.3.0-pdf-translation-mvp
- v0.3.1-translation-quality-fix
- v0.3.2-pdf-diagnostics-fix
- v0.3.3-layout-aware-pdf-extraction

How to continue on another computer:

1. Clone:

   ```bash
   git clone https://github.com/conanxin/booktrans-desk.git
   cd booktrans-desk
   ```

2. Install:

   ```bash
   npm ci
   ```

3. Validate:

   ```bash
   npm run build
   npm test
   npm run release:check
   ```

4. Run packaged build:

   ```bash
   npm run pack
   ```

5. Development:

   ```bash
   npm run dev
   ```

Local configuration:

- Do not commit `.env`.
- API keys must be configured locally in the app.
- MiniMax Token Plan:
  - API base: `https://api.minimaxi.com/v1`
  - model: `MiniMax-M3`
- API keys are not stored in job cache or diagnostic bundles.

Release rules:

- Do not publish public release unless final decision is `GO`.
- `CONDITIONAL_GO` is only for internal RC or draft validation.
- PDF feature remains HOLD until manual packaged UI validation and external reader validation pass.

Known limitations:

- Windows builds are unsigned.
- PDF support is text-PDF only.
- OCR is not implemented.
- Exact PDF layout preservation is not implemented.
- Tables, formulas, captions, figures, and dense sidebars remain limited.
