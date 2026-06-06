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
| `BookTrans Desk Setup 0.2.8-alpha.0.exe` | 112846275 | `4F9B464036A767D159F6CAA70DD8E3B9AE86DCEA006EF864786ACA160E9988A0` |
| `BookTrans Desk 0.2.8-alpha.0.exe` | 112679111 | `2FF232BDB6B041E34802DD78716A0547745602634A0196078E101CAC86BC2092` |
| `BookTrans Desk Setup 0.2.8-alpha.0.exe.blockmap` | 119895 | `14FAE4C642CD74B09E40E8E3305C43FA4AA19CD485E1547C3C3641B9AA55C6D2` |

## Notes

- Artifacts are not committed to git.
- `release/` remains ignored.
- The Windows build remains unsigned.
- The release publisher should recompute checksums immediately before uploading artifacts to GitHub Release.
