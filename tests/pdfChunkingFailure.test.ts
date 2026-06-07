import { describe, expect, it } from "vitest";
import { createPdfChunkPlan } from "../src/main/pdf/translatePdf.js";
import type { ImportedPdfDocument } from "../src/shared/types.js";

describe("PDF chunking diagnostics", () => {
  it("returns PDF_NO_TEXT when PDF has no extractable text", () => {
    expect(() => createPdfChunkPlan(pdf({ textLength: 0, paragraphs: [] }))).toThrow("未能从 PDF");
  });

  it("returns PDF_CHUNKING_FAILED when text exists but chunking produces no chunks", () => {
    expect(() => createPdfChunkPlan(pdf({ textLength: 10, paragraphs: ["hello"] }), () => [])).toThrow("PDF 文本分块失败");
  });

  it("computes non-zero chunks before provider calls", () => {
    const plan = createPdfChunkPlan(pdf({ textLength: 11, paragraphs: ["hello world"] }));
    expect(plan.totalChunks).toBeGreaterThan(0);
    expect(plan.pageChunkCounts.get(1)).toBeGreaterThan(0);
  });
});

function pdf({ textLength, paragraphs }: { textLength: number; paragraphs: string[] }): ImportedPdfDocument {
  return {
    type: "pdf",
    filePath: "fixture.pdf",
    pageCount: 1,
    textLength,
    isScannedLike: false,
    pages: [{ pageNumber: 1, textLength, paragraphCount: paragraphs.length, status: "pending" }],
    pageTexts: [
      {
        pageNumber: 1,
        text: paragraphs.join("\n\n"),
        paragraphs: paragraphs.map((text, index) => ({ id: `p${index}`, pageNumber: 1, index, text }))
      }
    ]
  };
}
