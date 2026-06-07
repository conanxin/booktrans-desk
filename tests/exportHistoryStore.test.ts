import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ExportHistoryStore } from "../src/main/export/exportHistoryStore.js";

describe("ExportHistoryStore", () => {
  it("adds, lists, gets, deletes, and clears export history", async () => {
    const store = new ExportHistoryStore(await filePath());
    const item = await store.add({
      outputEpubPath: "/tmp/book.zh.epub",
      validationStatus: "pass",
      externalValidationStatus: "unavailable",
      targetLanguage: "zh-CN",
      sourceBookTitle: "Book",
      settings: { baseUrl: "https://example.test", apiKey: "secret", model: "m", glossary: "agent => 智能体", style: "faithful" }
    });
    expect(await store.get(item.id)).toMatchObject({ sourceBookTitle: "Book" });
    expect(await store.list()).toHaveLength(1);
    await store.delete(item.id);
    expect(await store.list()).toHaveLength(0);
    await store.add({ outputEpubPath: "/tmp/a.epub", validationStatus: "warning", targetLanguage: "zh-CN" });
    await store.clear();
    expect(await store.list()).toHaveLength(0);
  });

  it("records knowledge exports while keeping translation exports compatible", async () => {
    const file = await filePath();
    const store = new ExportHistoryStore(file);
    const translation = await store.add({
      exportCategory: "translation",
      exportKind: "translated-epub",
      outputEpubPath: "/tmp/book.zh.epub",
      validationStatus: "pass",
      targetLanguage: "zh-CN",
      sourceBookTitle: "Book"
    });
    const knowledge = await store.add({
      sourceType: "epub",
      exportCategory: "knowledge",
      exportKind: "study-notes",
      sourceDocumentId: "doc-1",
      sourceDocumentTitle: "Knowledge Book",
      sourceBookTitle: "Knowledge Book",
      sourcePath: "/tmp/book.epub",
      outputEpubPath: "/tmp/book.study-notes.md",
      outputPath: "/tmp/book.study-notes.md",
      validationStatus: "pass",
      targetLanguage: "knowledge"
    });

    const items = await store.list();
    expect(items.find((item) => item.id === translation.id)).toMatchObject({ exportCategory: "translation", exportKind: "translated-epub" });
    expect(items.find((item) => item.id === knowledge.id)).toMatchObject({
      exportCategory: "knowledge",
      exportKind: "study-notes",
      sourceDocumentId: "doc-1",
      outputPath: "/tmp/book.study-notes.md"
    });
  });

  it("does not save apiKey", async () => {
    const file = await filePath();
    const store = new ExportHistoryStore(file);
    await store.add({
      outputEpubPath: "/tmp/book.zh.epub",
      validationStatus: "pass",
      targetLanguage: "zh-CN",
      settings: { baseUrl: "", apiKey: "secret-key", model: "m" }
    });
    const raw = await fs.readFile(file, "utf8");
    expect(raw).not.toContain("secret-key");
    expect(raw).not.toContain("apiKey");
  });

  it("refreshes existing and missing paths", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "booktrans-export-paths-"));
    const existing = path.join(dir, "book.epub");
    await fs.writeFile(existing, "data", "utf8");
    const store = new ExportHistoryStore(path.join(dir, "history.json"));
    const present = await store.add({ outputEpubPath: existing, validationStatus: "pass", targetLanguage: "zh-CN" });
    const missing = await store.add({ outputEpubPath: path.join(dir, "missing.epub"), validationStatus: "fail", targetLanguage: "zh-CN" });
    const refreshed = await store.refreshAll();
    expect(refreshed.find((item) => item.id === present.id)?.fileExists).toBe(true);
    expect(refreshed.find((item) => item.id === present.id)?.fileSize).toBe(4);
    expect(refreshed.find((item) => item.id === missing.id)?.fileExists).toBe(false);
  });

  it("removes missing records without deleting files", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "booktrans-export-clean-"));
    const existing = path.join(dir, "book.epub");
    await fs.writeFile(existing, "data", "utf8");
    const store = new ExportHistoryStore(path.join(dir, "history.json"));
    await store.add({ outputEpubPath: existing, validationStatus: "pass", targetLanguage: "zh-CN" });
    await store.add({ outputEpubPath: path.join(dir, "missing.epub"), validationStatus: "fail", targetLanguage: "zh-CN" });
    await expect(store.removeMissing()).resolves.toBe(1);
    expect(await fs.readFile(existing, "utf8")).toBe("data");
    expect(await store.list()).toHaveLength(1);
  });

  it("refreshes knowledge export outputPath", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "documuse-knowledge-export-paths-"));
    const existing = path.join(dir, "book.study-notes.md");
    await fs.writeFile(existing, "# Notes", "utf8");
    const store = new ExportHistoryStore(path.join(dir, "history.json"));
    const item = await store.add({
      sourceType: "epub",
      exportCategory: "knowledge",
      exportKind: "study-notes",
      sourceDocumentTitle: "Book",
      outputEpubPath: "legacy-placeholder.epub",
      outputPath: existing,
      validationStatus: "pass",
      targetLanguage: "knowledge"
    });

    const refreshed = await store.refresh(item.id);
    expect(refreshed?.fileExists).toBe(true);
    expect(refreshed?.fileSize).toBeGreaterThan(0);
  });

  it("records bilingual export scope and translation summary", async () => {
    const store = new ExportHistoryStore(await filePath());
    const item = await store.add({
      sourceType: "epub",
      exportCategory: "knowledge",
      exportKind: "bilingual-markdown-selected",
      exportScope: "chapter:Introduction",
      translationStatusSummary: "total=2; translated=1; missing=1; experimental=0",
      sourceDocumentId: "doc-1",
      sourceDocumentTitle: "Book",
      outputEpubPath: "/tmp/book.chapter-1.bilingual.md",
      outputPath: "/tmp/book.chapter-1.bilingual.md",
      validationStatus: "warning",
      targetLanguage: "knowledge"
    });

    await expect(store.get(item.id)).resolves.toMatchObject({
      exportKind: "bilingual-markdown-selected",
      exportScope: "chapter:Introduction",
      translationStatusSummary: "total=2; translated=1; missing=1; experimental=0"
    });
  });
});

async function filePath(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "booktrans-export-history-"));
  return path.join(dir, "history.json");
}
