import { describe, expect, it } from "vitest";
import { exportKindLabel, formatAnalysisStatus, formatChatSource, formatDocumentStructure, summarizeDocumentStatus } from "./documentDisplayUtils.js";
import type { UnifiedDocument } from "./documentModel.js";

describe("document display utils", () => {
  it("summarizes EPUB document status for the workspace", () => {
    const summary = summarizeDocumentStatus(documentFixture("epub"));

    expect(summary).toMatchObject({
      sourceFormat: "EPUB",
      documentKind: "article",
      analysisStatus: "Analyzed",
      chatCount: 2,
      structure: "1 chapters / 1 units"
    });
    expect(summary.pdfTranslationStatus).toBeUndefined();
  });

  it("summarizes PDF status with HOLD translation state", () => {
    const summary = summarizeDocumentStatus(documentFixture("pdf"));

    expect(summary.sourceFormat).toBe("PDF");
    expect(summary.structure).toBe("3 pages / 1 units");
    expect(summary.pdfTranslationStatus).toBe("Experimental / HOLD");
  });

  it("formats analysis and source display labels", () => {
    expect(formatAnalysisStatus(undefined)).toBe("Not analyzed");
    expect(formatAnalysisStatus({ status: "failed", mode: "quick", error: "No text" })).toBe("Analysis failed");
    expect(formatChatSource({ unitId: "unit-1", sourceHint: "Page 2 - paragraph 1", pageNumber: 2, role: "paragraph", quote: "Quote" })).toBe("Page 2 - paragraph 1 - page 2 - paragraph - unit-1");
    expect(exportKindLabel("analysis")).toBe("Analysis Markdown");
  });

  it("falls back to chapter count for PDFs without diagnostics page count", () => {
    const document = documentFixture("pdf");
    document.diagnostics.pageCount = undefined;

    expect(formatDocumentStructure(document)).toBe("1 pages / 1 units");
  });
});

function documentFixture(sourceFormat: "epub" | "pdf"): UnifiedDocument {
  return {
    id: "doc",
    sourceFormat,
    sourcePath: sourceFormat === "pdf" ? "/tmp/doc.pdf" : "/tmp/doc.epub",
    title: "Display Doc",
    metadata: {},
    documentKind: { kind: "article", confidence: 0.8, reasons: [], signals: [], detectedAt: "2024-01-01T00:00:00.000Z" },
    units: [{ id: "unit-1", documentId: "doc", sourceFormat, role: sourceFormat === "pdf" ? "paragraph" : "chapter", text: "Unit text", order: 0, pageNumber: sourceFormat === "pdf" ? 1 : undefined }],
    chapters: [{ id: "chapter-1", documentId: "doc", title: sourceFormat === "pdf" ? "Page 1" : "Chapter 1", order: 0, unitIds: ["unit-1"], pageNumber: sourceFormat === "pdf" ? 1 : undefined }],
    outline: [],
    analysisState: { status: "completed", mode: "quick", updatedAt: "2024-01-01T00:00:00.000Z" },
    chatMessages: [
      { id: "m1", documentId: "doc", role: "user", content: "Question", createdAt: "2024-01-01T00:00:00.000Z" },
      { id: "m2", documentId: "doc", role: "assistant", content: "Answer", createdAt: "2024-01-01T00:00:01.000Z" }
    ],
    translations: [],
    exports: [],
    diagnostics: { parser: "test", textLength: 9, pageCount: sourceFormat === "pdf" ? 3 : undefined, unitCount: 1, warnings: [], errors: [] },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  };
}
