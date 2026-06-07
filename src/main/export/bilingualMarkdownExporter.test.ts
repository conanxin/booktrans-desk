import { describe, expect, it } from "vitest";
import type { UnifiedDocument } from "../../shared/documentModel.js";
import { bilingualDocumentToMarkdown } from "./bilingualMarkdownExporter.js";

describe("bilingualDocumentToMarkdown", () => {
  it("exports full document with missing translation placeholders", () => {
    const markdown = bilingualDocumentToMarkdown(documentFixture(), { type: "full" });

    expect(markdown).toContain("双语导出");
    expect(markdown).toContain("Translation summary: total=3; translated=0; missing=3; experimental=0");
    expect(markdown).toContain("【暂无译文");
    expect(markdown).toContain("First original");
  });

  it("uses available translations and selected chapter scope", () => {
    const document = documentFixture();
    document.translations = [
      {
        id: "translation-1",
        documentId: document.id,
        source: "epub-translation",
        targetLanguage: "zh-CN",
        status: "completed",
        unitTranslations: [
          {
            unitId: "unit-2",
            sourceUnitId: "unit-2",
            sourceText: "Second original",
            translatedText: "第二段译文",
            status: "completed",
            source: "epub-translation",
            updatedAt: "2024-01-01T00:00:00.000Z"
          }
        ],
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z"
      }
    ];

    const markdown = bilingualDocumentToMarkdown(document, { type: "chapter", chapterId: "chapter-2" });
    expect(markdown).toContain("Scope: chapter:Second");
    expect(markdown).toContain("第二段译文");
    expect(markdown).not.toContain("First original");
  });

  it("supports specific translation version and no-translation fallback", () => {
    const document = documentFixture();
    document.translations = [
      version("full-version", { type: "full" }, "unit-1", "Full version text", "2024-01-01T00:00:00.000Z"),
      version("chapter-version", { type: "chapter", chapterId: "chapter-1" }, "unit-1", "Chapter version text", "2024-01-02T00:00:00.000Z")
    ];

    const latest = bilingualDocumentToMarkdown(document, { type: "chapter", chapterId: "chapter-1" });
    const specific = bilingualDocumentToMarkdown(document, { type: "chapter", chapterId: "chapter-1" }, { translationVersionId: "full-version", translationResolution: "specific" });
    const none = bilingualDocumentToMarkdown(document, { type: "chapter", chapterId: "chapter-1" }, { translationResolution: "none" });

    expect(latest).toContain("Chapter version text");
    expect(specific).toContain("Full version text");
    expect(none).toContain("Translation version: missing fallback");
    expect(none).toContain("暂无译文");
  });
});

export function documentFixture(): UnifiedDocument {
  return {
    id: "doc-bilingual",
    sourceFormat: "epub",
    sourcePath: "/tmp/book.epub",
    title: "Bilingual Book",
    metadata: {},
    documentKind: { kind: "article", confidence: 0.8, reasons: [], signals: [], detectedAt: "2024-01-01T00:00:00.000Z" },
    units: [
      { id: "unit-1", documentId: "doc-bilingual", sourceFormat: "epub", role: "chapter", text: "First original", order: 0, chapterId: "chapter-1", chapterTitle: "First" },
      { id: "unit-2", documentId: "doc-bilingual", sourceFormat: "epub", role: "chapter", text: "Second original", order: 1, chapterId: "chapter-2", chapterTitle: "Second" },
      { id: "unit-3", documentId: "doc-bilingual", sourceFormat: "epub", role: "chapter", text: "Third original", order: 2, chapterId: "chapter-2", chapterTitle: "Second" }
    ],
    chapters: [
      { id: "chapter-1", documentId: "doc-bilingual", title: "First", order: 0, unitIds: ["unit-1"] },
      { id: "chapter-2", documentId: "doc-bilingual", title: "Second", order: 1, unitIds: ["unit-2", "unit-3"] }
    ],
    outline: [],
    translations: [],
    exports: [],
    diagnostics: { parser: "test", textLength: 42, unitCount: 3, warnings: [], errors: [] },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  };
}

function version(id: string, scope: NonNullable<UnifiedDocument["translations"][number]["scope"]>, unitId: string, translatedText: string, updatedAt: string): UnifiedDocument["translations"][number] {
  const record = {
    unitId,
    sourceUnitId: unitId,
    sourceText: "Source",
    translatedText,
    status: "translated" as const,
    source: "manual" as const,
    updatedAt
  };
  return {
    id,
    documentId: "doc-bilingual",
    label: id,
    sourceFormat: "epub",
    source: "manual",
    scope,
    targetLanguage: "zh-CN",
    status: "completed",
    translatedUnitCount: 1,
    totalUnitCount: 1,
    missingUnitCount: 0,
    units: [record],
    unitTranslations: [record],
    createdAt: updatedAt,
    updatedAt
  };
}
