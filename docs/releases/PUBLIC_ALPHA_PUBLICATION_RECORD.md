# Public Alpha Publication Record

## Summary

Release publication status: MANUAL_PUBLICATION_PENDING

Release decision: CONDITIONAL_GO

The local release package and documentation are prepared, but the GitHub Release was not created from this environment because no git remote is configured and GitHub CLI is unavailable.

## Release Metadata

| Field | Value |
| --- | --- |
| Release tag | `v0.2.9-public-alpha-conditional` |
| Release title | BookTrans Desk v0.2.9 Public Alpha (Conditional) |
| Release decision | CONDITIONAL_GO |
| Pushed commit | BLOCKED_NO_REMOTE_OR_PERMISSION |
| Pushed tag | BLOCKED_NO_REMOTE_OR_PERMISSION |
| Release URL | Not created |
| Prerelease status | Must be marked prerelease when manually published |

## Uploaded Artifacts

ARTIFACTS_UPLOADED: NO

Manual upload still required:

- `release/BookTrans Desk Setup 0.2.8-alpha.0.exe`
- `release/BookTrans Desk 0.2.8-alpha.0.exe`
- `release/BookTrans Desk Setup 0.2.8-alpha.0.exe.blockmap`

## Checksums

| Artifact | SHA256 |
| --- | --- |
| `BookTrans Desk Setup 0.2.8-alpha.0.exe` | `14C706DE4C648DBD0293D4E1112DEF1F9A449313DB3C6DF1345E127DFEECB34B` |
| `BookTrans Desk 0.2.8-alpha.0.exe` | `B2BAA8A22F33C2862775A8D2D889B4B77D49B3FF70EC4142F84ABE35B084D8C5` |
| `BookTrans Desk Setup 0.2.8-alpha.0.exe.blockmap` | `2E4E6B4AB8157F8D19FC3751D7D907CEB0729BEDADBB3BAB38A4EC031ADB888C` |

## Manual Steps Remaining

1. Configure a GitHub remote or open the GitHub repository in the browser.
2. Push `master` or the intended release branch.
3. Push tag `v0.2.9-public-alpha-conditional`.
4. Open GitHub Releases and draft a new release.
5. Choose tag `v0.2.9-public-alpha-conditional`.
6. Use title `BookTrans Desk v0.2.9 Public Alpha (Conditional)`.
7. Paste body from `docs/releases/GITHUB_RELEASE_DRAFT_v0.2.8-public-alpha.md`.
8. Mark the release as prerelease.
9. Upload the three artifacts listed above.
10. Confirm checksums match this record before publishing.

## Next Validation Work

- Complete visual UI verification.
- Complete visible Calibre or Thorium reader validation for at least one baseline exported EPUB.
- Keep `CONDITIONAL_GO` wording unless those checks are completed.

## Security Notes

- No release artifacts are committed to git.
- No API keys, tokens, copyrighted EPUBs, exported EPUBs, logs, or diagnostic zips should be uploaded to issues.
