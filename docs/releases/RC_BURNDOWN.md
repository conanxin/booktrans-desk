# RC Burn-down

## Release Blocker Criteria

### P0 Blocker

- App cannot launch.
- Import EPUB crashes.
- Export EPUB is always invalid.
- API key leaks into logs, diagnostics, or git.
- Release check fails.
- Test suite fails.
- Packed app cannot start on target platform.

### P1 Blocker

- Common reflowable EPUB cannot import.
- Retry/resume breaks job state.
- Exported EPUB loses manifest resources.
- Diagnostic bundle includes sensitive data.
- Release notes or security docs are inaccurate.

### P2 Non-blocker

- UI polish.
- Unsigned Windows warning.
- Limited EPUBCheck parsing.
- Manual label sync.
- macOS packaging not configured.

## Current RC Status

- P0: none known.
- P1: none known.
- P2: known limitations documented.

## Phase 2.7 Validation Results

| Item | Result | Notes |
| --- | --- | --- |
| Automatic checks | PASS | build/test/audit/release:check passed |
| Pack | PASS | Generated `release/win-unpacked/` |
| Manual launch | PARTIAL_PROCESS_STARTED_UI_NOT_VERIFIED | Process started and stayed alive during smoke check; visible UI not verified |
| Manual reader validation | NOT_RUN_ENVIRONMENT_LIMITED | Calibre/Thorium/SumatraPDF not run in this environment |
| Checksum | NO_INSTALLER_ARTIFACT_GENERATED | Unpacked exe hashes recorded; no installer artifact generated |

## Phase 2.7 Open Issues

- P0 issues: none known from automated checks.
- P1 issues: none known from automated checks.
- P2 known limitations: Windows unsigned warning, manual reader validation pending, visible UI verification pending, no installer artifact generated, macOS packaging not configured.

## Final Decision

CONDITIONAL_GO

Automatic verification passed and the packed process starts, but public alpha publishing still requires manual reader validation, visible UI verification, and final upload artifact checksum generation.

## Phase 2.8 Final Public Alpha Status

| Item | Result | Notes |
| --- | --- | --- |
| Automatic checks | PASS | build/test/audit/release:check passed |
| Dist artifact generation | PASS | NSIS installer and portable exe generated |
| Checksums | GENERATED_FOR_WINDOWS_ARTIFACTS | SHA256 recorded for installer, portable exe, and blockmap |
| Manual launch | PARTIAL_PROCESS_STARTED_UI_NOT_VERIFIED | Unpacked and portable processes started; visual UI not verified |
| Manual reader validation | NOT_RUN_ENVIRONMENT_LIMITED | Calibre/Thorium/SumatraPDF not run |

Final decision remains CONDITIONAL_GO. This is not a full GO until visual UI and reader validation are completed or explicitly accepted as release limitations.

## Phase 2.9 Final Validation Burn-down

| Item | Result | Notes |
| --- | --- | --- |
| Automatic checks | PASS | build/test/audit/release:check passed |
| Pack/dist | PASS | Windows unpacked, NSIS installer, portable exe, and blockmap generated |
| Checksums | GENERATED_FOR_WINDOWS_ARTIFACTS | SHA256 recorded for final generated artifacts |
| Manual launch | BLOCKED_BY_ENVIRONMENT | App and portable processes started, but visual UI could not be verified |
| Manual reader validation | PARTIAL | Calibre ebook-viewer process opened a temporary exported minimal EPUB; visual content was not verified |
| Security | PASS | No tracked release artifacts or secret patterns |

FINAL_DECISION: CONDITIONAL_GO

The GitHub Release can be published only with explicit conditional validation wording. Upgrade to GO requires visual app UI verification plus at least one baseline exported EPUB visibly opening in Calibre or Thorium.

## Decision Rule

`v0.2.5-alpha-rc` can proceed to public alpha if:

- build/test/audit/release:check pass.
- pack pass or limitation is documented.
- no P0/P1 open issues.
- security docs are current.
- release notes are ready.
