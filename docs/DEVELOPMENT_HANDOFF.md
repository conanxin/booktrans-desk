# BookTrans Desk Development Handoff

Repository:
https://github.com/conanxin/booktrans-desk

Current branch:
merge-documuse-studio

Latest known stable development tag:
v0.3.3-layout-aware-pdf-extraction

Latest merge branch commit:
8f148b1 feat: persist translation versions and selected translation baseline

Current status:

- EPUB translation pipeline: usable alpha
- Chinese UI redesign: completed
- Packaged white-screen hotfix: completed
- MiniMax Token Plan preset: implemented
- Translation quality gate: implemented
- PDF text translation MVP: implemented but experimental
- Layout-aware PDF extraction: implemented
- PDF public release: HOLD until real packaged UI and reader validation pass
- DocuMuse Studio merge branch: internal alpha candidate after manual Windows click-through validation
- Unified document library: implemented for EPUB/PDF snapshots
- EPUB/PDF reading, analysis, chat, persistence, and knowledge export: implemented on merge branch
- Bilingual Markdown/HTML and translation versions: implemented as baseline on merge branch
- Real desktop click-through: BLOCKED_MANUAL

Current rules:

- Do not merge `merge-documuse-studio` into `master` yet.
- Do not create a GitHub Release from this branch yet.
- Do not publish a public alpha from this branch yet.
- Do not change PDF translation public release from HOLD.
- Do not commit API keys, real user EPUB/PDF files, generated export artifacts, or release artifacts.

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

2. Switch to the merge branch:

   ```bash
   git checkout merge-documuse-studio
   git pull
   ```

3. Install:

   ```bash
   npm ci
   ```

4. Validate:

   ```bash
   npm run build
   npm test
   npm run release:check
   ```

5. Run packaged build:

   ```bash
   npm run pack
   ```

6. Development:

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
- For the DocuMuse Studio merge branch, current merge-to-master decision is `NO_MERGE_YET`.
- Current internal alpha readiness is conditional after S11 manual Windows validation.

Known limitations:

- Windows builds are unsigned.
- PDF support is text-PDF only.
- OCR is not implemented.
- Exact PDF layout preservation is not implemented.
- Tables, formulas, captions, figures, and dense sidebars remain limited.
- Bilingual PDF is not implemented.
- Selected units multi-select UI is not implemented.
- Translation version diff/compare is not implemented.
