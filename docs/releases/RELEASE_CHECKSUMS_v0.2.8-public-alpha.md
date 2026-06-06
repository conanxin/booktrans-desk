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
| `BookTrans Desk Setup 0.2.8-alpha.0.exe` | 112846274 | `0C8C4C78E4F94F429385EF3C0EF0C740E6AC6B68540C2A99D73C9DFDCF1EF6AB` |
| `BookTrans Desk 0.2.8-alpha.0.exe` | 112679105 | `9E6EC374C5BCEFF0DA1C417BB38A6E4D04C323A81B9147E984882F2E631F14EE` |
| `BookTrans Desk Setup 0.2.8-alpha.0.exe.blockmap` | 119880 | `6810600B90ED15D7DB5EF75369928AF9FBCA51BC60F094AEBC85F37F7DD35D5F` |

## Notes

- Artifacts are not committed to git.
- `release/` remains ignored.
- The Windows build remains unsigned.
- The release publisher should recompute checksums immediately before uploading artifacts to GitHub Release.
