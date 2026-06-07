import { describe, expect, it } from "vitest";
import { AnalysisService } from "./analysisService.js";
import type { UnifiedDocument } from "../../shared/documentModel.js";

describe("AnalysisService", () => {
  it("creates quick analysis with document kind hint and sources", () => {
    const service = new AnalysisService();
    const result = service.startQuickAnalysis(documentFixture());

    expect(result.status).toBe("completed");
    expect(result.documentKind).toBe("paper");
    expect(result.promptHint).toContain("academic paper");
    expect(result.oneSentenceSummary).toContain("Abstract");
    expect(result.summary).toContain("Abstract");
    expect(result.language).toBe("en");
    expect(result.analyzedAt).toBeTruthy();
    expect(result.sources[0]).toMatchObject({ unitId: "unit-1", pageNumber: 1 });
    expect(service.getAnalysis("doc")).toEqual(result);
  });
});

function documentFixture(): UnifiedDocument {
  return {
    id: "doc",
    sourceFormat: "pdf",
    sourcePath: "/tmp/paper.pdf",
    title: "Paper",
    metadata: { language: "en" },
    documentKind: { kind: "paper", confidence: 0.9, reasons: [], signals: [], detectedAt: "2024-01-01T00:00:00.000Z" },
    units: [
      {
        id: "unit-1",
        documentId: "doc",
        sourceFormat: "pdf",
        role: "paragraph",
        text: "Abstract. This paper studies local-first document translation. Results show useful structure.",
        order: 0,
        pageNumber: 1
      }
    ],
    chapters: [],
    outline: [{ id: "outline-1", title: "Abstract", level: 1, order: 0, unitId: "unit-1", pageNumber: 1, children: [] }],
    translations: [],
    exports: [],
    diagnostics: { parser: "test", textLength: 88, unitCount: 1, warnings: [], errors: [] },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  };
}
