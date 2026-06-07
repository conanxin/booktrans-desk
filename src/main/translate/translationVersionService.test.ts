import { describe, expect, it } from "vitest";
import type { ImportedBook, PdfTranslationJobResult, TranslationJobResult, TranslationSettings } from "../../shared/types.js";
import type { TranslationScope, UnifiedDocument } from "../../shared/documentModel.js";
import { MockTranslator } from "./mockTranslator.js";
import {
  buildTranslationVersionForSelectedUnits,
  buildTranslationVersionFromEpubResult,
  buildTranslationVersionFromPdfResult,
  findLatestMatchingTranslationVersion,
  resolveTranslationForUnit,
  summarizeTranslationVersion
} from "./translationVersionService.js";

const settings: TranslationSettings = { baseUrl: "", apiKey: "", model: "mock", useMock: true, style: "faithful" };

describe("translationVersionService", () => {
  it("builds an EPUB full translation version from translated chapters", () => {
    const document = documentFixture("epub");
    const result: TranslationJobResult = {
      book: bookFixture(),
      jobId: "job-1",
      translatedChapters: [{ chapterId: "book-chapter-1", href: "one.xhtml", html: "<html><body><p>[zh]First original</p></body></html>" }]
    };

    const version = buildTranslationVersionFromEpubResult(document, result, settings);
    expect(version.scope).toEqual({ type: "full" });
    expect(version.source).toBe("epub-translation");
    expect(version.translatedUnitCount).toBe(1);
    expect(version.missingUnitCount).toBe(1);
    expect(version.unitTranslations[0].translatedText).toContain("[zh]First original");
  });

  it("builds a PDF experimental page translation version", () => {
    const document = documentFixture("pdf");
    const result: PdfTranslationJobResult = {
      document: {
        type: "pdf",
        filePath: "/tmp/doc.pdf",
        pageCount: 1,
        textLength: 12,
        pages: [],
        isScannedLike: false,
        pageTexts: []
      },
      jobId: "pdf-job",
      translatedPages: [{ pageNumber: 2, paragraphs: [{ id: "para-2", index: 0, source: "Second original", translated: "[zh]Second original" }] }]
    };

    const version = buildTranslationVersionFromPdfResult(document, result, settings, { type: "page", pageNumber: 2 });
    expect(version.source).toBe("pdf-experimental");
    expect(version.scope).toEqual({ type: "page", pageNumber: 2 });
    expect(version.unitTranslations[0].status).toBe("experimental");
  });

  it("resolves exact scoped versions before full fallback and supports none", () => {
    const document = documentFixture("epub");
    const full = manualVersion(document, "full", { type: "full" }, "Full translation", "2024-01-01T00:00:00.000Z");
    const chapter = manualVersion(document, "chapter", { type: "chapter", chapterId: "chapter-2" }, "Chapter translation", "2024-01-02T00:00:00.000Z");
    document.translations = [full, chapter];

    expect(findLatestMatchingTranslationVersion(document, { type: "chapter", chapterId: "chapter-2" })?.id).toBe("chapter");
    expect(findLatestMatchingTranslationVersion(document, { type: "page", pageNumber: 9 })?.id).toBe("full");
    expect(findLatestMatchingTranslationVersion(document, { type: "full" }, { translationResolution: "none" })).toBeUndefined();
    expect(resolveTranslationForUnit(document, document.units[1], { type: "chapter", chapterId: "chapter-2" })?.translatedText).toBe("Chapter translation");
    expect(summarizeTranslationVersion(chapter)).toMatchObject({ translatedUnitCount: 1, totalUnitCount: 1, missingUnitCount: 0 });
  });

  it("translates selected units with the mock translator", async () => {
    const document = documentFixture("epub");
    const version = await buildTranslationVersionForSelectedUnits(document, { type: "units", unitIds: ["unit-1"] }, new MockTranslator(), settings);
    expect(version.scope).toEqual({ type: "units", unitIds: ["unit-1"] });
    expect(version.unitTranslations).toHaveLength(1);
    expect(version.unitTranslations[0].translatedText).toContain("[zh]First original");
  });
});

function documentFixture(sourceFormat: "epub" | "pdf"): UnifiedDocument {
  return {
    id: `doc-${sourceFormat}`,
    sourceFormat,
    sourcePath: `/tmp/doc.${sourceFormat}`,
    title: "Translation Fixture",
    metadata: {},
    units: [
      {
        id: "unit-1",
        documentId: `doc-${sourceFormat}`,
        sourceFormat,
        role: "chapter",
        text: "First original",
        order: 0,
        chapterId: "chapter-1",
        chapterTitle: "One",
        pageNumber: sourceFormat === "pdf" ? 1 : undefined,
        metadata: sourceFormat === "epub" ? { originalChapterId: "book-chapter-1" } : { originalParagraphId: "para-1" }
      },
      {
        id: "unit-2",
        documentId: `doc-${sourceFormat}`,
        sourceFormat,
        role: "chapter",
        text: "Second original",
        order: 1,
        chapterId: "chapter-2",
        chapterTitle: "Two",
        pageNumber: sourceFormat === "pdf" ? 2 : undefined,
        metadata: sourceFormat === "epub" ? { originalChapterId: "book-chapter-2" } : { originalParagraphId: "para-2" }
      }
    ],
    chapters: [
      { id: "chapter-1", documentId: `doc-${sourceFormat}`, title: "One", order: 0, unitIds: ["unit-1"], pageNumber: sourceFormat === "pdf" ? 1 : undefined },
      { id: "chapter-2", documentId: `doc-${sourceFormat}`, title: "Two", order: 1, unitIds: ["unit-2"], pageNumber: sourceFormat === "pdf" ? 2 : undefined }
    ],
    outline: [],
    translations: [],
    exports: [],
    diagnostics: { parser: "test", textLength: 30, unitCount: 2, warnings: [], errors: [] },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  };
}

function bookFixture(): ImportedBook {
  return {
    filePath: "/tmp/book.epub",
    rootFilePath: "OPS/package.opf",
    opfDir: "OPS",
    metadata: { title: "Book", author: "Tester", language: "en" },
    chapters: []
  };
}

function manualVersion(document: UnifiedDocument, id: string, scope: TranslationScope, translatedText: string, updatedAt: string) {
  return {
    id,
    documentId: document.id,
    label: id,
    sourceFormat: document.sourceFormat,
    source: "manual" as const,
    scope,
    targetLanguage: "zh-CN",
    status: "completed" as const,
    translatedUnitCount: 1,
    totalUnitCount: 1,
    missingUnitCount: 0,
    units: [
      {
        unitId: scope.type === "chapter" ? "unit-2" : "unit-1",
        sourceUnitId: scope.type === "chapter" ? "unit-2" : "unit-1",
        sourceText: "Source",
        translatedText,
        status: "translated" as const,
        source: "manual" as const,
        updatedAt
      }
    ],
    unitTranslations: [
      {
        unitId: scope.type === "chapter" ? "unit-2" : "unit-1",
        sourceUnitId: scope.type === "chapter" ? "unit-2" : "unit-1",
        sourceText: "Source",
        translatedText,
        status: "translated" as const,
        source: "manual" as const,
        updatedAt
      }
    ],
    createdAt: updatedAt,
    updatedAt
  };
}
