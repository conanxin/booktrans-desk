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

## Decision Rule

`v0.2.5-alpha-rc` can proceed to public alpha if:

- build/test/audit/release:check pass.
- pack pass or limitation is documented.
- no P0/P1 open issues.
- security docs are current.
- release notes are ready.
