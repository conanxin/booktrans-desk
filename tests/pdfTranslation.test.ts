import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { readPdf } from "../src/main/pdf/readPdf.js";
import { translatePdf } from "../src/main/pdf/translatePdf.js";
import { createPdfFixtures } from "./helpers/createPdfFixtures.js";

describe("PDF translation", () => {
  it("translates PDF paragraphs with the mock translator", async () => {
    const fixtures = await createPdfFixtures();
    const pdf = await readPdf(fixtures.minimalText);
    const progressEvents: string[] = [];

    const result = await translatePdf(
      pdf,
      { baseUrl: "", apiKey: "", model: "mock", useMock: true, style: "faithful", glossary: "small => 小型" },
      new AbortController().signal,
      (progress) => progressEvents.push(progress.status)
    );

    expect(result.document.type).toBe("pdf");
    expect(result.translatedPages[0]?.paragraphs[0]?.translated).toContain("[zh]");
    expect(result.translatedPages[0]?.paragraphs.some((paragraph) => paragraph.translated.includes("小型"))).toBe(true);
    expect(progressEvents).toContain("completed");

    await fs.rm(fixtures.dir, { recursive: true, force: true });
  });

  it("rejects scanned-like PDFs without OCR", async () => {
    const fixtures = await createPdfFixtures();
    const pdf = await readPdf(fixtures.emptyOrImageLike);

    await expect(
      translatePdf(pdf, { baseUrl: "", apiKey: "", model: "mock", useMock: true, style: "faithful" }, new AbortController().signal, () => undefined)
    ).rejects.toThrow("OCR");

    await fs.rm(fixtures.dir, { recursive: true, force: true });
  });
});
