import { describe, expect, it } from "vitest";
import { extractOutline, flattenOutline } from "./outlineExtractor.js";
import type { UnifiedDocument } from "../../shared/documentModel.js";

describe("extractOutline", () => {
  it("uses EPUB chapter titles directly", () => {
    const document = documentFixture({
      sourceFormat: "epub",
      chapters: [
        { id: "chapter-1", documentId: "doc", title: "Chapter One", order: 0, unitIds: ["unit-1"], sourceHref: "one.xhtml" },
        { id: "chapter-2", documentId: "doc", title: "Chapter Two", order: 1, unitIds: ["unit-2"], sourceHref: "two.xhtml" }
      ]
    });

    const result = extractOutline(document);
    expect(result.flat.map((node) => node.title)).toEqual(["Chapter One", "Chapter Two"]);
    expect(result.tree).toHaveLength(2);
  });

  it("extracts PDF headings from title roles and English section names", () => {
    const document = documentFixture({
      sourceFormat: "pdf",
      units: [
        { id: "u1", documentId: "doc", sourceFormat: "pdf", role: "title", text: "Abstract", order: 0, pageNumber: 1 },
        { id: "u2", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "Body text", order: 1, pageNumber: 1 },
        { id: "u3", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "Introduction", order: 2, pageNumber: 2 },
        { id: "u4", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "References", order: 3, pageNumber: 5 }
      ]
    });

    const result = extractOutline(document);
    expect(result.flat.map((node) => node.title)).toEqual(["Abstract", "Introduction", "References"]);
    expect(result.flat.map((node) => node.pageNumber)).toEqual([1, 2, 5]);
  });

  it("supports Chinese common headings and chapter headings", () => {
    const document = documentFixture({
      sourceFormat: "pdf",
      units: [
        { id: "u1", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "摘要", order: 0, pageNumber: 1 },
        { id: "u2", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "第 一 章 开始", order: 1, pageNumber: 2 },
        { id: "u3", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "结论", order: 2, pageNumber: 9 }
      ]
    });

    const result = extractOutline(document);
    expect(result.flat.map((node) => node.title)).toEqual(["摘要", "第 一 章 开始", "结论"]);
  });

  it("builds nested children from numbered headings", () => {
    const document = documentFixture({
      sourceFormat: "pdf",
      units: [
        { id: "u1", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "1 Overview", order: 0, pageNumber: 1 },
        { id: "u2", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "1.1 Details", order: 1, pageNumber: 1 },
        { id: "u3", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "2 Results", order: 2, pageNumber: 2 }
      ]
    });

    const result = extractOutline(document);
    expect(result.tree).toHaveLength(2);
    expect(result.tree[0].children[0].title).toBe("1.1 Details");
    expect(flattenOutline(result.tree).map((node) => node.title)).toEqual(["1 Overview", "1.1 Details", "2 Results"]);
  });
});

function documentFixture(overrides: Partial<UnifiedDocument>): UnifiedDocument {
  return {
    id: "doc",
    sourceFormat: "pdf",
    sourcePath: "/tmp/source.pdf",
    title: "Document",
    metadata: {},
    units: [],
    chapters: [],
    outline: [],
    translations: [],
    exports: [],
    diagnostics: {
      parser: "test",
      textLength: 0,
      unitCount: 0,
      warnings: [],
      errors: []
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides
  };
}

