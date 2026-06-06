# EPUB Compatibility Matrix

| Category | Example | Status | Notes |
| --- | --- | --- | --- |
| Minimal EPUB 3 | test fixture | PASS | Used in tests |
| EPUB 2 NCX | TODO | Not tested | Future fixture |
| EPUB with images | roundtrip fixture | Partial | Non-text resources are preserved; need more real fixtures |
| EPUB with footnotes | TODO | Partial | Anchors are preserved; need fixture |
| EPUB with complex inline tags | Unit test | PASS | text-node preservation |
| EPUB with CJK source | TODO | Not tested | Need fixture |
| EPUB with RTL language | TODO | Not supported | Future |
| Fixed layout EPUB | TODO | Not supported | Future |
| DRM EPUB | TODO | Not supported | Cannot process encrypted content |
| PDF/MOBI/AZW3 | TODO | Not supported | Out of current scope |

Current engineering target is reflowable EPUB. The internal validator checks ZIP structure, container.xml, OPF manifest/spine consistency, manifest file presence, and XHTML parseability. Optional external EPUBCheck can be configured for stricter local validation.
