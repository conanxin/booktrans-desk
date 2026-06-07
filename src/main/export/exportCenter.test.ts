import { describe, expect, it } from "vitest";
import { ExportCenter } from "./exportCenter.js";
import type { DocumentAnalysisRecord } from "../analysis/analysisService.js";
import type { DocumentChatMessage } from "../chat/documentChatService.js";
import type { UnifiedDocument } from "../../shared/documentModel.js";

describe("ExportCenter", () => {
  it("exports a unified document as Markdown", () => {
    const markdown = new ExportCenter().documentMarkdown(documentFixture());
    expect(markdown).toContain("# Export Me");
    expect(markdown).toContain("Document type: article");
    expect(markdown).toContain("## Content");
    expect(markdown).toContain("Unit text");
  });

  it("exports a unified document as JSON", () => {
    const json = new ExportCenter().documentJson(documentFixture());
    expect(JSON.parse(json)).toMatchObject({ id: "doc", title: "Export Me" });
  });

  it("exports chat and analysis as Markdown", () => {
    const center = new ExportCenter();
    expect(center.chatMarkdown(documentFixture(), chatFixture())).toContain("unit-1, page 1");
    expect(center.analysisMarkdown(analysisFixture())).toContain("## Key Points");
  });
});

function documentFixture(): UnifiedDocument {
  return {
    id: "doc",
    sourceFormat: "epub",
    sourcePath: "/tmp/book.epub",
    title: "Export Me",
    metadata: { author: "Tester" },
    documentKind: { kind: "article", confidence: 0.6, reasons: [], signals: [], detectedAt: "2024-01-01T00:00:00.000Z" },
    units: [{ id: "unit-1", documentId: "doc", sourceFormat: "epub", role: "chapter", text: "Unit text", order: 0, chapterTitle: "One" }],
    chapters: [{ id: "chapter-1", documentId: "doc", title: "One", order: 0, unitIds: ["unit-1"] }],
    outline: [{ id: "outline-1", title: "One", level: 1, order: 0, unitId: "unit-1", chapterId: "chapter-1", children: [] }],
    translations: [],
    exports: [],
    diagnostics: { parser: "test", textLength: 9, unitCount: 1, warnings: [], errors: [] },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  };
}

function chatFixture(): DocumentChatMessage[] {
  return [
    {
      id: "m1",
      documentId: "doc",
      role: "assistant",
      content: "Answer",
      createdAt: "2024-01-01T00:00:00.000Z",
      sources: [{ unitId: "unit-1", sourceHint: "One, page 1", pageNumber: 1, quote: "Quote", score: 1 }]
    }
  ];
}

function analysisFixture(): DocumentAnalysisRecord {
  return {
    id: "analysis-doc",
    documentId: "doc",
    mode: "quick",
    status: "completed",
    title: "Export Me",
    oneSentenceSummary: "One sentence",
    summary: "Summary",
    keyPoints: ["Point"],
    keywords: ["keyword"],
    documentKind: "article",
    language: "en",
    promptHint: "hint",
    sources: [{ unitId: "unit-1", quote: "Quote" }],
    analyzedAt: "2024-01-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z"
  };
}
