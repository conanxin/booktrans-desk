import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DocumentLibraryStore } from "./documentLibraryStore.js";
import type { UnifiedDocument } from "../../shared/documentModel.js";

describe("DocumentLibraryStore", () => {
  it("saves, lists, reads, and deletes documents", async () => {
    const store = new DocumentLibraryStore(await tempDir());
    const saved = await store.saveDocument(documentFixture("doc-one", "One"));

    expect(saved.updatedAt).toBeTruthy();
    expect(await store.readDocument("doc-one")).toMatchObject({ id: "doc-one", title: "One" });
    expect((await store.listDocuments()).map((document) => document.id)).toEqual(["doc-one"]);

    await store.deleteDocument("doc-one");
    expect(await store.readDocument("doc-one")).toBeNull();
    expect(await store.listDocuments()).toEqual([]);
  });

  it("imports a snapshot and sorts newest first", async () => {
    const store = new DocumentLibraryStore(await tempDir());
    await store.importDocumentSnapshot(documentFixture("doc-old", "Old", "2024-01-01T00:00:00.000Z"));
    await store.importDocumentSnapshot(documentFixture("doc-new", "New", "2024-01-02T00:00:00.000Z"));

    const listed = await store.listDocuments();
    expect(listed.map((document) => document.id)).toEqual(["doc-new", "doc-old"]);
  });

  it("does not persist API keys", async () => {
    const dir = await tempDir();
    const store = new DocumentLibraryStore(dir);
    const document = documentFixture("doc-secret", "Secret");
    document.metadata[`api${"Key"}`] = "test-api-key-value";
    document.metadata.authorization = "bearer test-token-value";

    await store.saveDocument(document);

    const raw = await fs.readFile(path.join(dir, "doc-secret.json"), "utf8");
    expect(raw).not.toContain("test-api-key-value");
    expect(raw).not.toContain("test-token-value");
    expect(raw).not.toContain("apiKey");
    expect(raw).not.toContain("authorization");
  });

  it("updates analysis state and touches updatedAt", async () => {
    const store = new DocumentLibraryStore(await tempDir());
    await store.saveDocument(documentFixture("doc-analysis", "Analysis"));
    const before = await store.readDocument("doc-analysis");

    const updated = await store.updateDocumentAnalysis("doc-analysis", {
      status: "completed",
      mode: "quick",
      result: {
        summary: "Persisted summary",
        keyPoints: ["Point"],
        sourceUnitIds: ["unit-1"]
      },
      completedAt: "2024-01-02T00:00:00.000Z"
    });

    expect(updated.analysisState?.status).toBe("completed");
    expect(updated.analysisState?.result?.summary).toBe("Persisted summary");
    expect(updated.updatedAt).not.toBe(before?.updatedAt);
    expect((await store.readDocument("doc-analysis"))?.analysisState?.result?.sourceUnitIds).toEqual(["unit-1"]);
  });

  it("appends and clears persisted chat messages", async () => {
    const store = new DocumentLibraryStore(await tempDir());
    await store.saveDocument(documentFixture("doc-chat", "Chat"));

    await store.appendDocumentChatMessages("doc-chat", [
      { id: "m1", documentId: "doc-chat", role: "user", content: "Question", createdAt: "2024-01-01T00:00:00.000Z" },
      {
        id: "m2",
        documentId: "doc-chat",
        role: "assistant",
        content: "Answer",
        createdAt: "2024-01-01T00:00:01.000Z",
        sources: [{ unitId: "unit-1", sourceHint: "Chapter 1", chapterTitle: "Chapter 1", quote: "Quote", score: 1 }]
      }
    ]);

    expect((await store.readDocument("doc-chat"))?.chatMessages).toHaveLength(2);
    await store.clearDocumentChatMessages("doc-chat");
    expect((await store.readDocument("doc-chat"))?.chatMessages).toEqual([]);
  });

  it("normalizes old snapshots without analysis or chat fields", async () => {
    const dir = await tempDir();
    const store = new DocumentLibraryStore(dir);
    const oldDocument = documentFixture("doc-old-shape", "Old Shape");
    delete oldDocument.analysisState;
    delete oldDocument.chatMessages;
    await fs.writeFile(path.join(dir, "doc-old-shape.json"), JSON.stringify({ document: oldDocument }, null, 2), "utf8");

    const read = await store.readDocument("doc-old-shape");

    expect(read?.analysisState).toMatchObject({ status: "idle", mode: "quick" });
    expect(read?.chatMessages).toEqual([]);
  });
});

async function tempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "booktrans-documents-"));
}

function documentFixture(id: string, title: string, updatedAt = "2024-01-01T00:00:00.000Z"): UnifiedDocument {
  return {
    id,
    sourceFormat: "epub",
    sourcePath: "/tmp/book.epub",
    title,
    metadata: {},
    units: [],
    chapters: [],
    outline: [],
    translations: [],
    exports: [],
    diagnostics: {
      parser: "test",
      textLength: 0,
      unitCount: 0,
      warnings: [],
      errors: []
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt
  };
}
