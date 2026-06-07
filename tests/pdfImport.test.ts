import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { detectScannedLikePdf } from "../src/main/pdf/detectPdfType.js";
import { readPdf } from "../src/main/pdf/readPdf.js";
import { validatePdf } from "../src/main/pdf/validatePdf.js";
import { createPdfFixtures } from "./helpers/createPdfFixtures.js";

describe("PDF import and text extraction", () => {
  it("reads metadata, page count, and extractable text", async () => {
    const fixtures = await createPdfFixtures();
    const pdf = await readPdf(fixtures.minimalText);

    expect(pdf.type).toBe("pdf");
    expect(pdf.title).toContain("Minimal Text");
    expect(pdf.author).toContain("BookTrans Test");
    expect(pdf.pageCount).toBe(1);
    expect(pdf.textLength).toBeGreaterThan(20);
    expect(pdf.pageTexts[0]?.text).toContain("small text PDF");
    expect(pdf.isScannedLike).toBe(false);

    await fs.rm(fixtures.dir, { recursive: true, force: true });
  });

  it("preserves multi-page order", async () => {
    const fixtures = await createPdfFixtures();
    const pdf = await readPdf(fixtures.multiPageText);

    expect(pdf.pageCount).toBe(3);
    expect(pdf.pageTexts.map((page) => page.pageNumber)).toEqual([1, 2, 3]);
    expect(pdf.pageTexts[1]?.text).toContain("Second page");

    await fs.rm(fixtures.dir, { recursive: true, force: true });
  });

  it("detects empty or image-like PDFs", async () => {
    const fixtures = await createPdfFixtures();
    const pdf = await readPdf(fixtures.emptyOrImageLike);

    expect(detectScannedLikePdf(pdf.pageTexts)).toBe(true);
    expect(pdf.isScannedLike).toBe(true);

    await fs.rm(fixtures.dir, { recursive: true, force: true });
  });

  it("validates a readable PDF", async () => {
    const fixtures = await createPdfFixtures();
    const report = await validatePdf(fixtures.minimalText);

    expect(report.status).toBe("pass");
    expect(report.pageCount).toBe(1);
    expect(report.fileSize).toBeGreaterThan(0);

    await fs.rm(fixtures.dir, { recursive: true, force: true });
  });
});
