# Release Checksums: v0.2.8-public-alpha

## Summary

CHECKSUM_RESULT: GENERATED_FOR_WINDOWS_ARTIFACTS

`npm run dist` generated Windows NSIS installer and portable executable artifacts. These files are ignored by git and must not be committed.

## Generated At

2026-06-06

## Command Used

```powershell
npm run dist
Get-FileHash -LiteralPath <artifact> -Algorithm SHA256
```

## Artifacts

| Artifact name | Size bytes | SHA256 |
| --- | ---: | --- |
| `BookTrans Desk Setup 0.2.8-alpha.0.exe` | 112846271 | `14C706DE4C648DBD0293D4E1112DEF1F9A449313DB3C6DF1345E127DFEECB34B` |
| `BookTrans Desk 0.2.8-alpha.0.exe` | 112679108 | `B2BAA8A22F33C2862775A8D2D889B4B77D49B3FF70EC4142F84ABE35B084D8C5` |
| `BookTrans Desk Setup 0.2.8-alpha.0.exe.blockmap` | 119879 | `2E4E6B4AB8157F8D19FC3751D7D907CEB0729BEDADBB3BAB38A4EC031ADB888C` |

## Notes

- Artifacts are not committed to git.
- `release/` remains ignored.
- The Windows build remains unsigned.
- The release publisher should recompute checksums immediately before uploading artifacts to GitHub Release.
