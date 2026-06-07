import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { validateJsonExport, validateMarkdownExport, validatePptxExport, validateZipExport } from "./exportValidation.js";
import { buildBaselinePptx } from "./pptxExporter.js";
import { buildFullArchiveZip } from "./fullArchiveExporter.js";
import { ExportCenter } from "./exportCenter.js";
import { documentFixture } from "./exportCenter.test.js";

describe("export validation", () => {
  it("validates Markdown and JSON exports", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "documuse-export-validation-"));
    const markdownPath = path.join(dir, "document.md");
    const jsonPath = path.join(dir, "document.json");
    await fs.writeFile(markdownPath, "# Synthetic Export\n\nBody", "utf8");
    await fs.writeFile(jsonPath, JSON.stringify(documentFixture(), null, 2), "utf8");

    await expect(validateMarkdownExport(markdownPath, "Synthetic Export")).resolves.toMatchObject({ status: "pass" });
    await expect(validateJsonExport(jsonPath)).resolves.toMatchObject({ status: "pass" });
  });

  it("validates full archive ZIP contents", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "documuse-archive-validation-"));
    const archivePath = path.join(dir, "archive.zip");
    await fs.writeFile(archivePath, buildFullArchiveZip(documentFixture(), new ExportCenter()));

    const result = await validateZipExport(archivePath, ["README.md", "document.json", "analysis.md", "chat.md", "study-notes.md", "research-digest.md", "presentation-outline.md", "podcast-prep.md"]);
    expect(result.status).toBe("pass");
  });

  it("validates baseline PPTX package structure", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "documuse-pptx-validation-"));
    const pptxPath = path.join(dir, "deck.pptx");
    await fs.writeFile(pptxPath, buildBaselinePptx(documentFixture()));

    const result = await validatePptxExport(pptxPath);
    const zip = new AdmZip(pptxPath);
    expect(result.status).toBe("pass");
    expect(zip.getEntry("ppt/presentation.xml")).toBeTruthy();
  });
});
