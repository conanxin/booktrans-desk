# Phase 2.12 White Screen Hotfix Report

## Problem

The packaged Windows app could open to a blank white renderer window after installation.

Observed DevTools errors included:

- `Unable to load preload script ... dist/main/preload.js`
- `SyntaxError: Cannot use import statement outside a module`
- Missing packaged renderer resources such as `index-*.css` and `index-*.js`.

## Root Cause

- The preload script was emitted as ESM (`import { contextBridge, ipcRenderer } from "electron"`), while the packaged Electron preload path was executed as CommonJS.
- The Vite renderer build emitted absolute `/assets/...` URLs, which do not resolve correctly from packaged `file://` HTML inside the app.
- The previous build did not clear stale `dist/` output, so renamed preload artifacts could leave old files behind.

## Fixes

- Changed preload source to TypeScript `.cts`, producing `dist/main/preload.cjs`.
- Updated the BrowserWindow preload path to `dist/main/preload.cjs`.
- Added `base: "./"` to the Vite renderer config so packaged HTML uses relative asset URLs.
- Added `npm run clean:dist` before build to remove stale `dist/` output.
- Added a renderer `ErrorBoundary` so React render failures show a concise error panel instead of a pure white screen.
- Added packaged renderer path regression tests.
- Added white screen troubleshooting documentation.

## Verification Targets

- `dist/renderer/index.html` must contain `./assets/...` script and CSS references.
- `dist/main/preload.cjs` must exist and use CommonJS `require("electron")`.
- `dist/main/preload.js` must not remain after a clean build.
- Production main process must load `dist/renderer/index.html` and `dist/main/preload.cjs`.

## Verification Results

- Build output path check: PASS.
- Renderer asset path check: PASS, generated HTML uses `./assets/...`.
- Preload format check: PASS, generated preload is `dist/main/preload.cjs` with `require("electron")`.
- Packaged asar structure check: PASS, `app.asar` contains `dist/main/preload.cjs`, `dist/renderer/index.html`, and renderer assets.
- Packaged process smoke: PARTIAL_PROCESS_STARTED_UI_NOT_VERIFIED. The Windows unpacked process started and closed cleanly, but visible UI content could not be confirmed in this environment.

## GitHub Release Impact

Yes, a new hotfix release is recommended. The existing `v0.2.9-public-alpha-conditional` prerelease should be considered superseded for packaged Windows users because it can show the white screen issue.

## Known Limitations

- Windows builds remain unsigned.
- Manual visual UI validation is still required on a real Windows desktop after installing the hotfix package.
- Manual reader validation remains partial.
- Only reflowable EPUB is supported.

## Next Steps

- Publish `v0.2.12-white-screen-hotfix` as a prerelease hotfix.
- Ask testers who saw the white screen to upgrade to the hotfix.
- Complete visible UI verification and Calibre or Thorium reader validation before changing the decision from CONDITIONAL_GO to GO.
- After the hotfix, Phase 2.14 addresses Chinese localization and product-grade UI polish based on tester feedback that the previous English UI felt like an internal tool.
