import { describe, expect, it } from "vitest";
import { bilingualDocumentToHtml } from "./bilingualHtmlExporter.js";
import { documentFixture } from "./bilingualMarkdownExporter.test.js";

describe("bilingualDocumentToHtml", () => {
  it("exports escaped side-by-side HTML", () => {
    const document = documentFixture();
    document.units[0].text = "Original <script>alert(1)</script>";

    const html = bilingualDocumentToHtml(document, { type: "units", unitIds: ["unit-1"] }, "side-by-side");
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("<html lang=\"zh-CN\">");
    expect(html).toContain("grid-template-columns:minmax(0,1fr) minmax(0,1fr)");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("First");
    expect(html).not.toContain("Second original");
  });

  it("exports selected PDF page scope", () => {
    const document = documentFixture();
    document.sourceFormat = "pdf";
    document.units[0].pageNumber = 1;
    document.units[1].pageNumber = 2;
    document.units[2].pageNumber = 2;

    const html = bilingualDocumentToHtml(document, { type: "page", pageNumber: 2 }, "stacked");
    expect(html).toContain("Scope</dt><dd>page:2</dd>");
    expect(html).toContain("Second original");
    expect(html).toContain("Third original");
    expect(html).not.toContain("First original");
  });
});
