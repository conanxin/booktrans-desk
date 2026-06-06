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
});

async function filePath(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "booktrans-export-history-"));
  return path.join(dir, "history.json");
}
