import fs from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { createExportHistoryStore } from "../src/main/export/exportHistoryStore.js";
import { exportTranslatedPdf } from "../src/main/pdf/exportTranslatedPdf.js";
import { readPdf } from "../src/main/pdf/readPdf.js";
import { translatePdf } from "../src/main/pdf/translatePdf.js";
import { validatePdf } from "../src/main/pdf/validatePdf.js";
import { createPdfFixtures } from "./helpers/createPdfFixtures.js";

describe("PDF export", () => {
  it("exports a translated PDF that can be read again", async () => {
    const fixtures = await createPdfFixtures();
    const pdf = await readPdf(fixtures.cjkText);
    const result = await translatePdf(
      pdf,
      { baseUrl: "", apiKey: "", model: "mock", useMock: true, style: "faithful", glossary: "English => 英文" },
      new AbortController().signal,
      () => undefined
    );

    const outputPath = await exportTranslatedPdf(pdf, result.translatedPages, { baseUrl: "", apiKey: "", model: "mock", useMock: true, style: "faithful" });
    const report = await validatePdf(outputPath);
    const exported = await readPdf(outputPath);

    expect(await exists(outputPath)).toBe(true);
    expect(report.status).toBe("pass");
    expect(exported.textLength).toBeGreaterThan(0);
    expect(exported.pageTexts.map((page) => page.text).join("\n")).toContain("[zh]");

    await fs.rm(fixtures.dir, { recursive: true, force: true });
  }, 30000);

  it("records PDF export history without API keys", async () => {
    const fixtures = await createPdfFixtures();
    const store = createExportHistoryStore(fixtures.dir);
    const secretValue = ["SECRET", "VALUE", "SHOULD", "NOT", "APPEAR"].join("_");
    await store.add({
      sourceType: "pdf",
      sourceBookTitle: "PDF Fixture",
      sourcePath: fixtures.minimalText,
      outputEpubPath: fixtures.minimalText,
      outputPath: fixtures.minimalText,
      validationStatus: "pass",
      targetLanguage: "zh-CN",
      settings: { baseUrl: "", apiKey: secretValue, model: "mock", useMock: true, style: "faithful" }
    });

    const raw = await fs.readFile(`${fixtures.dir}/exports/history.json`, "utf8");
    expect(raw).toContain('"sourceType": "pdf"');
    expect(raw).not.toContain(secretValue);

    await fs.rm(fixtures.dir, { recursive: true, force: true });
  });
});

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}
