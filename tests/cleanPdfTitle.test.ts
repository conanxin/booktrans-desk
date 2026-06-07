import { describe, expect, it } from "vitest";
import { cleanPdfTitle } from "../src/main/pdf/cleanPdfTitle.js";

describe("cleanPdfTitle", () => {
  it("removes Microsoft Word and document suffix noise", () => {
    expect(cleanPdfTitle("Microsoft Word - Draft.doc", "C:/books/source.pdf")).toBe("Draft");
    expect(cleanPdfTitle("Microsoft Word - Draft.docx", "C:/books/source.pdf")).toBe("Draft");
  });

  it("falls back to source basename for empty or dirty titles", () => {
    expect(cleanPdfTitle("", "C:/books/source.pdf")).toBe("source");
    expect(cleanPdfTitle("x", "C:/books/source.pdf")).toBe("source");
  });
});
