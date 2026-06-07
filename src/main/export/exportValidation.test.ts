import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { validateBilingualHtmlExport, validateBilingualMarkdownExport, validateJsonExport, validateMarkdownExport, validatePptxExport, validateZipExport } from "./exportValidation.js";
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

  it("validates bilingual Markdown and HTML exports with missing translation warnings", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "documuse-bilingual-validation-"));
    const markdownPath = path.join(dir, "bilingual.md");
    const htmlPath = path.join(dir, "bilingual.html");
    await fs.writeFile(markdownPath, "# Title\n\n## Source\n\n### 原文\n\nOriginal\n\n### 译文\n\n【暂无译文，请先完成翻译或在后续版本生成。】", "utf8");
    await fs.writeFile(htmlPath, "<!doctype html><html lang=\"zh-CN\"><body><span class=\"source\">Source</span><h2>原文</h2><p>Original</p><h2>译文</h2><p>【暂无译文，请先完成翻译或在后续版本生成。】</p></body></html>", "utf8");

    await expect(validateBilingualMarkdownExport(markdownPath)).resolves.toMatchObject({ status: "warning" });
    await expect(validateBilingualHtmlExport(htmlPath)).resolves.toMatchObject({ status: "warning" });
  });
});
