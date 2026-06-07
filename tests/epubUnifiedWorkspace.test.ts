import { describe, expect, it } from "vitest";
import { AnalysisService } from "../src/main/analysis/analysisService.js";
import { DocumentChatService } from "../src/main/chat/documentChatService.js";
import { ExportCenter } from "../src/main/export/exportCenter.js";
import { extractOutline } from "../src/main/document/outlineExtractor.js";
import { fromImportedBook } from "../src/shared/documentAdapters.js";
import type { ImportedBook } from "../src/shared/types.js";

describe("EPUB unified reading, analysis, chat, and export loop", () => {
  it("adapts EPUB chapters into selectable reader units", () => {
    const document = { ...fromImportedBook(bookFixture()), outline: [] };
    const outline = extractOutline(document).tree;
    const firstChapter = document.chapters[0];
    const firstUnits = document.units.filter((unit) => firstChapter.unitIds.includes(unit.id));

    expect(document.sourceFormat).toBe("epub");
    expect(document.chapters.map((chapter) => chapter.title)).toEqual(["Opening", "Revenue Notes"]);
    expect(firstUnits).toHaveLength(1);
    expect(firstUnits[0].text).toContain("local-first reading");
    expect(outline.map((node) => node.title)).toEqual(["Opening", "Revenue Notes"]);
  });

  it("runs quick analysis for an EPUB unified document", () => {
    const document = { ...fromImportedBook(bookFixture()), documentKind: { kind: "book-chapter" as const, confidence: 0.8, reasons: [], signals: [], detectedAt: "2024-01-01T00:00:00.000Z" } };
    const analysis = new AnalysisService().startQuickAnalysis(document);

    expect(analysis.documentKind).toBe("book-chapter");
    expect(analysis.language).toBe("en");
    expect(analysis.summary).toContain("local-first reading");
    expect(analysis.keyPoints.length).toBeGreaterThan(0);
    expect(analysis.keywords).toContain("translation");
  });

  it("answers EPUB questions with chapter and source hints", () => {
    const document = fromImportedBook(bookFixture());
    const answer = new DocumentChatService().ask(document, "What changed about revenue?");

    expect(answer.content).toContain("Revenue changed");
    expect(answer.sources?.[0]).toMatchObject({
      chapterTitle: "Revenue Notes",
      sourceHint: "Revenue Notes"
    });
  });

  it("exports EPUB unified documents and chat as Markdown/JSON", () => {
    const document = fromImportedBook(bookFixture());
    const chat = new DocumentChatService();
    chat.ask(document, "revenue");
    const center = new ExportCenter();

    expect(center.documentMarkdown(document)).toContain("## Content");
    expect(center.documentMarkdown(document)).toContain("Opening");
    expect(JSON.parse(center.documentJson(document))).toMatchObject({ sourceFormat: "epub", title: "S2 EPUB" });
    expect(center.chatMarkdown(document, chat.list(document.id))).toContain("Revenue Notes");
  });
});

function bookFixture(): ImportedBook {
  return {
    type: "epub",
    filePath: "C:/books/s2.epub",
    rootFilePath: "OPS/content.opf",
    opfDir: "OPS",
    metadata: { title: "S2 EPUB", author: "Tester", language: "en" },
    chapters: [
      {
        id: "opening",
        href: "opening.xhtml",
        absolutePath: "OPS/opening.xhtml",
        title: "Opening",
        text: "This chapter introduces local-first reading, analysis, chat, and translation in one desktop workspace.",
        html: "<h1>Opening</h1>",
        mediaType: "application/xhtml+xml",
        order: 0
      },
      {
        id: "revenue",
        href: "revenue.xhtml",
        absolutePath: "OPS/revenue.xhtml",
        title: "Revenue Notes",
        text: "Revenue changed because enterprise adoption grew and translation workflows became easier to review.",
        html: "<h1>Revenue Notes</h1>",
        mediaType: "application/xhtml+xml",
        order: 1
      }
    ],
    bookFingerprint: "s2-fingerprint"
  };
}

