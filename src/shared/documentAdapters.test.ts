import { describe, expect, it } from "vitest";
import { fromImportedBook, fromImportedPdfDocument } from "./documentAdapters.js";
import type { ImportedBook, ImportedPdfDocument } from "./types.js";

describe("document adapters", () => {
  it("converts an EPUB ImportedBook to a UnifiedDocument", () => {
    const book = createBook();
    const document = fromImportedBook(book);

    expect(document.sourceFormat).toBe("epub");
    expect(document.sourcePath).toBe(book.filePath);
    expect(document.title).toBe("Example Book");
    expect(document.chapters.map((chapter) => chapter.title)).toEqual(["Chapter 1", "Chapter 2"]);
    expect(document.units.map((unit) => unit.text)).toEqual(["First chapter text", "Second chapter text"]);
    expect(document.units[0].chapterId).toBe(document.chapters[0].id);
    expect(document.diagnostics.chapterCount).toBe(2);
  });

  it("converts a PDF ImportedPdfDocument to a UnifiedDocument", () => {
    const pdf = createPdf();
    const document = fromImportedPdfDocument(pdf);

    expect(document.sourceFormat).toBe("pdf");
    expect(document.sourcePath).toBe(pdf.filePath);
    expect(document.title).toBe("PDF Sample");
    expect(document.chapters.map((chapter) => chapter.title)).toEqual(["Page 1", "Page 2"]);
    expect(document.units.map((unit) => unit.text)).toEqual(["Heading", "Body one", "Second page"]);
    expect(document.units[0].role).toBe("title");
    expect(document.units[1].pageNumber).toBe(1);
    expect(document.units[2].pageNumber).toBe(2);
    expect(document.diagnostics.pageCount).toBe(2);
  });

  it("uses source filename as an empty title fallback", () => {
    const book = createBook({ title: "" });
    const pdf = createPdf({ title: "" });

    expect(fromImportedBook(book).title).toBe("fallback-book");
    expect(fromImportedPdfDocument(pdf).title).toBe("fallback-pdf");
  });

  it("keeps chapter, page, and unit order stable", () => {
    const book = createBook();
    const firstBook = fromImportedBook(book);
    const secondBook = fromImportedBook(book);
    const pdf = createPdf();
    const firstPdf = fromImportedPdfDocument(pdf);
    const secondPdf = fromImportedPdfDocument(pdf);

    expect(firstBook.id).toBe(secondBook.id);
    expect(firstBook.units.map((unit) => unit.id)).toEqual(secondBook.units.map((unit) => unit.id));
    expect(firstBook.units.map((unit) => unit.order)).toEqual([0, 1]);
    expect(firstPdf.id).toBe(secondPdf.id);
    expect(firstPdf.units.map((unit) => unit.id)).toEqual(secondPdf.units.map((unit) => unit.id));
    expect(firstPdf.units.map((unit) => unit.order)).toEqual([0, 1, 2]);
  });
});

function createBook(overrides: Partial<ImportedBook["metadata"]> = {}): ImportedBook {
  return {
    type: "epub",
    filePath: "C:/books/fallback-book.epub",
    rootFilePath: "OPS/content.opf",
    opfDir: "OPS",
    metadata: {
      title: "Example Book",
      author: "Tester",
      language: "en",
      ...overrides
    },
    chapters: [
      {
        id: "c1",
        href: "chapter1.xhtml",
        absolutePath: "OPS/chapter1.xhtml",
        title: "Chapter 1",
        text: "First chapter text",
        html: "<h1>Chapter 1</h1>",
        mediaType: "application/xhtml+xml",
        order: 0
      },
      {
        id: "c2",
        href: "chapter2.xhtml",
        absolutePath: "OPS/chapter2.xhtml",
        title: "Chapter 2",
        text: "Second chapter text",
        html: "<h1>Chapter 2</h1>",
        mediaType: "application/xhtml+xml",
        order: 1
      }
    ],
    bookFingerprint: "fingerprint"
  };
}

function createPdf(overrides: Partial<ImportedPdfDocument> = {}): ImportedPdfDocument {
  return {
    type: "pdf",
    title: "PDF Sample",
    author: "Tester",
    filePath: "C:/books/fallback-pdf.pdf",
    pageCount: 2,
    textLength: 28,
    isScannedLike: false,
    pages: [
      { pageNumber: 1, textLength: 16, paragraphCount: 2, status: "pending" },
      { pageNumber: 2, textLength: 11, paragraphCount: 1, status: "pending" }
    ],
    pageTexts: [
      {
        pageNumber: 1,
        text: "Heading\n\nBody one",
        paragraphs: [
          { id: "p1-title", pageNumber: 1, index: 0, text: "Heading", role: "title" },
          { id: "p1-body", pageNumber: 1, index: 1, text: "Body one", role: "body-left-column" }
        ]
      },
      {
        pageNumber: 2,
        text: "Second page",
        paragraphs: [{ id: "p2-body", pageNumber: 2, index: 0, text: "Second page", role: "body-right-column" }]
      }
    ],
    ...overrides
  };
}

