import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { readEpub } from "../src/main/epub/readEpub.js";
import { writeTranslatedEpub } from "../src/main/epub/writeTranslatedEpub.js";
import { translateBook } from "../src/main/translationJob.js";

describe("EPUB roundtrip", () => {
  it("writes translated chapter text and keeps non-text resources", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "booktrans-"));
    const source = path.join(tempDir, "sample.epub");
    const output = path.join(tempDir, "sample.zh.epub");
    createMinimalEpub(source);

    const book = await readEpub(source);
    expect(book.metadata.title).toBe("Sample Book");
    expect(book.chapters).toHaveLength(1);

    const result = await translateBook(
      book,
      { baseUrl: "", apiKey: "", model: "", useMock: true },
      new AbortController().signal,
      () => undefined
    );
    await writeTranslatedEpub(result.book, result.translatedChapters, output);

    const reread = await readEpub(output);
    expect(reread.metadata.language).toBe("zh-CN");
    expect(reread.chapters[0].text).toContain("【中文】Hello world.");

    const zip = new AdmZip(output);
    expect(zip.getEntries()[0].entryName).toBe("mimetype");
    expect(zip.getEntry("mimetype")?.header.method).toBe(0);
    expect(zip.getEntry("OPS/styles/main.css")).toBeTruthy();
    expect(zip.getEntry("OPS/images/pixel.png")).toBeTruthy();
  });
});

function createMinimalEpub(filePath: string): void {
  const zip = new AdmZip();
  zip.addFile("mimetype", Buffer.from("application/epub+zip"));
  zip.addFile(
    "META-INF/container.xml",
    Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`)
  );
  zip.addFile(
    "OPS/content.opf",
    Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">sample</dc:identifier>
    <dc:title>Sample Book</dc:title>
    <dc:creator>Tester</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    <item id="chap1" href="chapters/chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="styles/main.css" media-type="text/css"/>
    <item id="pixel" href="images/pixel.png" media-type="image/png"/>
  </manifest>
  <spine>
    <itemref idref="chap1"/>
  </spine>
</package>`)
  );
  zip.addFile(
    "OPS/chapters/chapter1.xhtml",
    Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml">
  <head><title>Chapter One</title><link rel="stylesheet" href="../styles/main.css"/></head>
  <body>
    <h1>Chapter One</h1>
    <p>Hello world.</p>
    <p><em>Keep inline format.</em></p>
    <img src="../images/pixel.png" alt="pixel"/>
  </body>
</html>`)
  );
  zip.addFile("OPS/styles/main.css", Buffer.from("body { font-family: serif; }"));
  zip.addFile("OPS/images/pixel.png", Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  zip.writeZip(filePath);
}
