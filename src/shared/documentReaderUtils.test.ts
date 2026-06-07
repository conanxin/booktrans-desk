import { describe, expect, it } from "vitest";
import { fromImportedBook, fromImportedPdfDocument } from "./documentAdapters.js";
import { formatBoundingBox, getDocumentChapters, getDocumentPages, getUnitSourceHint, getUnitsForChapter, getUnitsForPage } from "./documentReaderUtils.js";
import type { ImportedBook, ImportedPdfDocument } from "./types.js";

describe("document reader utils", () => {
  it("groups PDF units by page in stable order", () => {
    const document = fromImportedPdfDocument(pdfFixture());
    const pages = getDocumentPages(document);

    expect(pages.map((page) => ({ pageNumber: page.pageNumber, unitCount: page.unitCount }))).toEqual([
      { pageNumber: 1, unitCount: 2 },
      { pageNumber: 2, unitCount: 1 }
    ]);
    expect(getUnitsForPage(document, 1).map((unit) => unit.text)).toEqual(["Executive Summary", "Revenue increased on page one."]);
    expect(getUnitSourceHint(getUnitsForPage(document, 1)[0])).toBe("Page 1 - title - paragraph 1");
    expect(formatBoundingBox(getUnitsForPage(document, 1)[1])).toBe("x:10 y:25 w:250 h:16");
  });

  it("returns EPUB chapters and units for chapter reading", () => {
    const document = fromImportedBook(bookFixture());
    const chapters = getDocumentChapters(document);
    const units = getUnitsForChapter(document, chapters[1].id);

    expect(chapters.map((chapter) => chapter.title)).toEqual(["Intro", "Findings"]);
    expect(units).toHaveLength(1);
    expect(units[0].text).toContain("chapter two");
    expect(getUnitSourceHint(units[0])).toBe("Findings");
  });
});

function bookFixture(): ImportedBook {
  return {
    type: "epub",
    filePath: "C:/books/reader.epub",
    rootFilePath: "OPS/content.opf",
    opfDir: "OPS",
    metadata: { title: "Reader EPUB", author: "Tester", language: "en" },
    chapters: [
      {
        id: "intro",
        href: "intro.xhtml",
        absolutePath: "OPS/intro.xhtml",
        title: "Intro",
        text: "This is chapter one.",
        html: "<h1>Intro</h1>",
        mediaType: "application/xhtml+xml",
        order: 0
      },
      {
        id: "findings",
        href: "findings.xhtml",
        absolutePath: "OPS/findings.xhtml",
        title: "Findings",
        text: "This is chapter two with findings.",
        html: "<h1>Findings</h1>",
        mediaType: "application/xhtml+xml",
        order: 1
      }
    ],
    bookFingerprint: "reader-fixture"
  };
}

function pdfFixture(): ImportedPdfDocument {
  return {
    type: "pdf",
    title: "Reader PDF",
    filePath: "C:/docs/reader.pdf",
    pageCount: 2,
    textLength: 80,
    isScannedLike: false,
    pages: [
      { pageNumber: 1, textLength: 50, paragraphCount: 2, status: "pending" },
      { pageNumber: 2, textLength: 30, paragraphCount: 1, status: "pending" }
    ],
    pageTexts: [
      {
        pageNumber: 1,
        text: "Executive Summary\n\nRevenue increased on page one.",
        paragraphs: [
          { id: "p1-title", pageNumber: 1, index: 0, text: "Executive Summary", role: "title" },
          { id: "p1-body", pageNumber: 1, index: 1, text: "Revenue increased on page one.", role: "body-left-column", bbox: { x: 10, y: 25, width: 250, height: 16 } }
        ]
      },
      {
        pageNumber: 2,
        text: "Risks remain manageable.",
        paragraphs: [{ id: "p2-body", pageNumber: 2, index: 0, text: "Risks remain manageable.", role: "body-right-column" }]
      }
    ]
  };
}
