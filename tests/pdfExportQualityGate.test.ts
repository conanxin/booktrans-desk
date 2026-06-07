import { describe, expect, it } from "vitest";
import { PDF_EXPORT_LAYOUT, PDF_EXPORT_LAYOUT_CSS, assertPdfTranslationsExportable, wrapTextByWidth } from "../src/main/pdf/exportTranslatedPdf.js";

describe("PDF export quality gate and layout", () => {
  it("blocks polluted translated text before export", () => {
    expect(() =>
      assertPdfTranslationsExportable([
        {
          pageNumber: 1,
          paragraphs: [{ index: 0, source: "hello", translated: "<think>reason</think>你好" }]
        }
      ])
    ).toThrow("PDF_EXPORT_BLOCKED_TRANSLATION_INVALID");
  });

  it("documents Chinese-friendly A4 wrapping layout", () => {
    expect(PDF_EXPORT_LAYOUT_CSS).toContain("@page");
    expect(PDF_EXPORT_LAYOUT_CSS).toContain("size: A4");
    expect(PDF_EXPORT_LAYOUT_CSS).toContain("Microsoft YaHei");
    expect(PDF_EXPORT_LAYOUT_CSS).toContain("overflow-wrap: anywhere");
    expect(PDF_EXPORT_LAYOUT_CSS).toContain("word-break: break-word");
    expect(PDF_EXPORT_LAYOUT_CSS).not.toContain("monospace");
    expect(PDF_EXPORT_LAYOUT.bodyUsesMonospace).toBe(false);
    expect(PDF_EXPORT_LAYOUT.bodyLineHeight).toBeGreaterThan(PDF_EXPORT_LAYOUT.bodyFontSize);
  });

  it("wraps long lines by measured width", () => {
    const fakeFont = { widthOfTextAtSize: (text: string, size: number) => text.length * size };
    expect(wrapTextByWidth("abcdefghij", fakeFont, 10, 35)).toEqual(["abc", "def", "ghi", "j"]);
  });
});
