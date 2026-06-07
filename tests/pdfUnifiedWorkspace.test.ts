import { describe, expect, it } from "vitest";
import { AnalysisService } from "../src/main/analysis/analysisService.js";
import { DocumentChatService } from "../src/main/chat/documentChatService.js";
import { ExportCenter } from "../src/main/export/exportCenter.js";
import { extractOutline } from "../src/main/document/outlineExtractor.js";
import { fromImportedPdfDocument } from "../src/shared/documentAdapters.js";
import { getDocumentPages, getUnitsForPage } from "../src/shared/documentReaderUtils.js";
import type { ImportedPdfDocument } from "../src/shared/types.js";

describe("PDF unified reading, analysis, chat, and export loop", () => {
  it("adapts PDF pages into selectable reader units", () => {
    const document = { ...fromImportedPdfDocument(pdfFixture()), outline: [] };
    const outline = extractOutline(document).tree;
    const pages = getDocumentPages(document);
    const firstPageUnits = getUnitsForPage(document, 1);

    expect(document.sourceFormat).toBe("pdf");
    expect(document.diagnostics.pageCount).toBe(2);
    expect(pages.map((page) => ({ pageNumber: page.pageNumber, unitCount: page.unitCount }))).toEqual([
      { pageNumber: 1, unitCount: 2 },
      { pageNumber: 2, unitCount: 1 }
    ]);
    expect(firstPageUnits.map((unit) => unit.text)).toEqual(["Executive Summary", "Revenue increased because enterprise adoption grew."]);
    expect(firstPageUnits[0]).toMatchObject({
      role: "title",
      pageNumber: 1,
      metadata: { sourceHint: "Page 1 - title - paragraph 1" }
    });
    expect(firstPageUnits[1].bbox).toEqual({ x: 12, y: 48, width: 320, height: 20 });
    expect(outline[0]?.title).toBe("Executive Summary");
  });

  it("runs quick analysis for a PDF unified document", () => {
    const document = { ...fromImportedPdfDocument(pdfFixture()), documentKind: { kind: "business-report" as const, confidence: 0.82, reasons: [], signals: [], detectedAt: "2024-01-01T00:00:00.000Z" } };
    const analysis = new AnalysisService().startQuickAnalysis(document);

    expect(analysis.documentKind).toBe("business-report");
    expect(analysis.summary).toContain("Revenue increased");
    expect(analysis.sources[0]).toMatchObject({ pageNumber: 1, chapterTitle: "Page 1" });
    expect(analysis.keywords).toContain("adoption");
  });

  it("answers PDF questions with page and unit sources", () => {
    const document = fromImportedPdfDocument(pdfFixture());
    const answer = new DocumentChatService().ask(document, "What changed about revenue?");

    expect(answer.content).toContain("Revenue increased");
    expect(answer.sources?.[0]).toMatchObject({
      pageNumber: 1,
      chapterTitle: "Page 1",
      role: "paragraph",
      sourceHint: "Page 1 - paragraph 2"
    });
  });

  it("exports PDF unified documents, chat, and analysis as Markdown/JSON", () => {
    const document = fromImportedPdfDocument(pdfFixture());
    const chat = new DocumentChatService();
    const analysis = new AnalysisService().startQuickAnalysis(document);
    chat.ask(document, "revenue");
    const center = new ExportCenter();

    expect(center.documentMarkdown(document)).toContain("Source format: pdf");
    expect(center.documentMarkdown(document)).toContain("page 1");
    expect(JSON.parse(center.documentJson(document))).toMatchObject({ sourceFormat: "pdf", title: "S3 PDF" });
    expect(center.chatMarkdown(document, chat.list(document.id))).toContain("Page 1 - paragraph 2");
    expect(center.analysisMarkdown(analysis)).toContain("page 1");
  });
});

function pdfFixture(): ImportedPdfDocument {
  return {
    type: "pdf",
    title: "S3 PDF",
    author: "Tester",
    filePath: "C:/docs/s3.pdf",
    pageCount: 2,
    textLength: 126,
    isScannedLike: false,
    pages: [
      { pageNumber: 1, textLength: 78, paragraphCount: 2, status: "pending" },
      { pageNumber: 2, textLength: 48, paragraphCount: 1, status: "pending" }
    ],
    pageTexts: [
      {
        pageNumber: 1,
        text: "Executive Summary\n\nRevenue increased because enterprise adoption grew.",
        paragraphs: [
          { id: "p1-title", pageNumber: 1, index: 0, text: "Executive Summary", role: "title" },
          { id: "p1-body", pageNumber: 1, index: 1, text: "Revenue increased because enterprise adoption grew.", role: "body-left-column", bbox: { x: 12, y: 48, width: 320, height: 20 } }
        ]
      },
      {
        pageNumber: 2,
        text: "Conclusion: PDF reading is ready for analysis.",
        paragraphs: [{ id: "p2-body", pageNumber: 2, index: 0, text: "Conclusion: PDF reading is ready for analysis.", role: "body-right-column" }]
      }
    ]
  };
}
