import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateEpub } from "../src/main/epub/validateEpub.js";
import { buildZip, type ZipOutputEntry } from "../src/main/epub/writeTranslatedEpub.js";

describe("validateEpub", () => {
  it("passes a minimal legal EPUB", async () => {
    const file = writeFixture("pass.epub", minimalEntries());
    const report = await validateEpub(file);
    expect(report.status).toBe("pass");
    expect(report.errors).toEqual([]);
  });

  it("fails when container.xml is missing", async () => {
    const file = writeFixture(
      "missing-container.epub",
      minimalEntries().filter((entry) => entry.name !== "META-INF/container.xml")
    );
    const report = await validateEpub(file);
    expect(report.status).toBe("fail");
    expect(report.errors).toContain("Missing META-INF/container.xml.");
  });

  it("fails when spine points to a missing manifest item", async () => {
    const file = writeFixture("bad-spine.epub", minimalEntries({ spineIdref: "missing" }));
    const report = await validateEpub(file);
    expect(report.status).toBe("fail");
    expect(report.errors).toContain("Spine itemref references missing manifest id: missing.");
  });

  it("fails when a manifest href file is missing", async () => {
    const file = writeFixture(
      "missing-href.epub",
      minimalEntries().filter((entry) => entry.name !== "OPS/chapter.xhtml")
    );
    const report = await validateEpub(file);
    expect(report.status).toBe("fail");
    expect(report.errors).toContain("Manifest href for chap is missing from zip: OPS/chapter.xhtml.");
  });
});

function writeFixture(name: string, entries: ZipOutputEntry[]): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "booktrans-validate-"));
  const file = path.join(dir, name);
  fs.writeFileSync(file, buildZip(entries));
  return file;
}

function minimalEntries(options: { spineIdref?: string } = {}): ZipOutputEntry[] {
  const spineIdref = options.spineIdref ?? "chap";
  return [
    { name: "mimetype", method: 0, data: Buffer.from("application/epub+zip") },
    {
      name: "META-INF/container.xml",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`)
    },
    {
      name: "OPS/content.opf",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>Sample</dc:title><dc:language>en</dc:language></metadata>
  <manifest><item id="chap" href="chapter.xhtml" media-type="application/xhtml+xml"/></manifest>
  <spine><itemref idref="${spineIdref}"/></spine>
</package>`)
    },
    {
      name: "OPS/chapter.xhtml",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><body><p>Hello</p></body></html>`)
    }
  ];
}
