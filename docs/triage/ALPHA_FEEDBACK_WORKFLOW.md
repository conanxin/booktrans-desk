# Alpha Feedback Workflow

1. Collect issue using the GitHub templates.
2. Apply type, area, compatibility, priority, and status labels.
3. Request a safe minimal reproduction if needed.
4. Convert the reproduction into a fixture or regression test.
5. Fix the issue.
6. Update the compatibility matrix and docs.
7. Release a patch alpha when the fix is verified.

Keep reports local-first and privacy-safe: no uploaded user files, no API keys, no full book text.

For `v0.2.5-alpha-rc`, run `npm run labels:print` to print optional GitHub label sync instructions. The script is print-only and does not call the GitHub API or read tokens.
