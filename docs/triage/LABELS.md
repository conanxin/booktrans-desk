# Labels

Recommended labels for alpha feedback:

- `type: bug`
- `type: feature`
- `type: docs`
- `type: question`
- `area: epub-import`
- `area: translation`
- `area: export`
- `area: validation`
- `area: job-manager`
- `area: packaging`
- `area: ci`
- `area: privacy`
- `compat: epub2`
- `compat: epub3`
- `compat: images`
- `compat: footnotes`
- `compat: cjk`
- `compat: fixed-layout`
- `priority: p0`
- `priority: p1`
- `priority: p2`
- `status: needs-repro`
- `status: needs-info`
- `status: confirmed`
- `status: wontfix`
- `good first issue`

For `v0.2.5-alpha-rc`, the same label set is stored in `scripts/github-labels.json`. Run `npm run labels:print` to print manual sync instructions and optional `gh label create` commands. The script does not call GitHub APIs or read tokens.
