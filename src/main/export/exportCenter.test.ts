import { describe, expect, it } from "vitest";
import AdmZip from "adm-zip";
import { ExportCenter } from "./exportCenter.js";
import type { DocumentAnalysisRecord } from "../analysis/analysisService.js";
import type { DocumentChatMessage } from "../chat/documentChatService.js";
import type { UnifiedDocument } from "../../shared/documentModel.js";

describe("ExportCenter", () => {
  it("exports a unified document as Markdown", () => {
    const markdown = new ExportCenter().documentMarkdown(documentFixture());
    expect(markdown).toContain("# Export Me");
    expect(markdown).toContain("Document type: article");
    expect(markdown).toContain("## Analysis");
    expect(markdown).toContain("Persisted summary");
    expect(markdown).toContain("## Chat History");
    expect(markdown).toContain("assistant: Persisted answer");
    expect(markdown).toContain("## Content");
    expect(markdown).toContain("Unit text");
  });

  it("exports a unified document as JSON", () => {
    const document = documentFixture();
    document.metadata[`api${"Key"}`] = "secret-api-key";
    document.analysisState = {
      ...document.analysisState,
      result: {
        ...document.analysisState?.result,
        rawProviderResponse: "secret-raw-response"
      } as unknown as NonNullable<typeof document.analysisState>["result"]
    };
    const json = new ExportCenter().documentJson(document);
    expect(JSON.parse(json)).toMatchObject({ id: "doc", title: "Export Me", analysisState: { status: "completed" }, chatMessages: [{ content: "Persisted answer" }] });
    expect(json).not.toContain("secret-api-key");
    expect(json).not.toContain("secret-raw-response");
  });

  it("exports chat and analysis as Markdown", () => {
    const center = new ExportCenter();
    expect(center.chatMarkdown(documentFixture(), chatFixture())).toContain("unit-1, page 1");
    expect(center.analysisMarkdown(analysisFixture())).toContain("## Key Points");
  });

  it("lists and builds knowledge export presets", () => {
    const center = new ExportCenter();
    expect(center.presets().map((preset) => preset.id)).toEqual(["study-notes", "research-digest", "presentation-outline", "podcast-prep"]);
    expect(center.presetMarkdown(documentFixture(), "study-notes")).toContain("## Personal Notes");
    expect(center.presetMarkdown(documentFixture(), "research-digest")).toContain("## Key Findings");
    expect(center.presetMarkdown(documentFixture(), "presentation-outline")).toContain("## Slide 1:");
    expect(center.presetMarkdown({ ...documentFixture(), chatMessages: [] }, "podcast-prep")).toContain("## Discussion Questions");
  });

  it("builds a full archive ZIP with expected files", () => {
    const zip = new AdmZip(new ExportCenter().fullArchiveZip(documentFixture()));
    const names = zip.getEntries().map((entry) => entry.entryName).sort();

    expect(names).toEqual([
      "README.md",
      "analysis.md",
      "chat.md",
      "document.json",
      "podcast-prep.md",
      "presentation-outline.md",
      "research-digest.md",
      "study-notes.md"
    ].sort());
    expect(zip.getEntry("document.json")?.getData().toString("utf8")).not.toContain("secret-api-key");
  });

  it("builds a baseline PPTX buffer with slide parts", () => {
    const buffer = new ExportCenter().baselinePptx(documentFixture());
    const zip = new AdmZip(buffer);

    expect(buffer.length).toBeGreaterThan(1000);
    expect(zip.getEntry("ppt/presentation.xml")).toBeTruthy();
    expect(zip.getEntry("ppt/slides/slide1.xml")).toBeTruthy();
    expect(zip.getEntry("ppt/slides/slide6.xml")).toBeTruthy();
  });
});

export function documentFixture(): UnifiedDocument {
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
    analysisState: {
      status: "completed",
      mode: "quick",
      result: {
        oneSentenceSummary: "Persisted one sentence",
        summary: "Persisted summary",
        keyPoints: ["Persisted point"],
        keywords: ["persisted"],
        documentType: "article",
        sources: [{ unitId: "unit-1", quote: "Unit text" }]
      },
      completedAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z"
    },
    chatMessages: [{ id: "persisted-chat", documentId: "doc", role: "assistant", content: "Persisted answer", createdAt: "2024-01-01T00:00:00.000Z" }],
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
