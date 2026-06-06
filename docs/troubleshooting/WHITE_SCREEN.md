# Packaged App White Screen Troubleshooting

This page is for the Windows packaged app opening to a blank white window.

## Symptoms

- The app window opens, but the React UI does not appear.
- DevTools Console may show an error about the preload script.
- DevTools Console may show missing `index-*.js` or `index-*.css` files.

## Open DevTools

1. Focus the BookTrans Desk window.
2. Press `Ctrl+Shift+I`.
3. Open the Console tab.
4. Copy the first error message and include it in a GitHub issue.

Do not paste API keys, Authorization headers, private book text, commercial EPUB files, local diagnostic zips, or full local filesystem paths.

## Common Causes

- Preload ESM/CommonJS mismatch: Electron runs the preload script as CommonJS, but the packaged file contains a top-level `import`.
- Vite asset path mismatch: packaged `index.html` uses `/assets/...` instead of `./assets/...`.
- Renderer assets missing from the package.
- Production `loadFile` points to the wrong renderer `index.html`.

## Hotfix Coverage

The `v0.2.12-white-screen-hotfix` build changes the preload output to `dist/main/preload.cjs`, updates the packaged preload path, makes Vite renderer assets relative, and adds regression tests for those packaged paths.

## Report an Issue

Include:

- App version.
- Windows version.
- Whether you used installer or portable exe.
- The first sanitized DevTools Console error.
- Whether the issue happens in the latest hotfix release.

Do not upload copyrighted EPUBs, exported EPUBs, API keys, Authorization headers, or logs containing private text.
