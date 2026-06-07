import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DocumentChatService } from "./documentChatService.js";
import { DocumentLibraryStore } from "../document/documentLibraryStore.js";
import type { UnifiedDocument } from "../../shared/documentModel.js";

describe("DocumentChatService", () => {
  it("answers with keyword-matched sources", () => {
    const service = new DocumentChatService();
    const answer = service.ask(documentFixture(), "What does the document say about revenue?");

    expect(answer.role).toBe("assistant");
    expect(answer.sources?.[0]).toMatchObject({ unitId: "unit-2", pageNumber: 2, sourceHint: "Page 2", role: "paragraph" });
    expect(answer.content).toContain("Revenue increased");
    expect(service.list("doc")).toHaveLength(2);
  });

  it("clears chat history", () => {
    const service = new DocumentChatService();
    service.ask(documentFixture(), "revenue");
    service.clear("doc");
    expect(service.list("doc")).toEqual([]);
  });

  it("uses EPUB chapter titles as source hints", () => {
    const service = new DocumentChatService();
    const document = documentFixture();
    document.sourceFormat = "epub";
    document.units[1] = { ...document.units[1], sourceFormat: "epub", chapterTitle: "Chapter Two", pageNumber: undefined };
    const answer = service.ask(document, "enterprise adoption");

    expect(answer.sources?.[0]).toMatchObject({ unitId: "unit-2", chapterTitle: "Chapter Two", sourceHint: "Chapter Two" });
  });

  it("persists EPUB chat history across service instances", async () => {
    const store = new DocumentLibraryStore(await tempDir());
    const document = documentFixture();
    document.sourceFormat = "epub";
    document.sourcePath = "/tmp/book.epub";
    document.units[1] = { ...document.units[1], sourceFormat: "epub", chapterTitle: "Chapter Two", pageNumber: undefined };
    await store.saveDocument(document);

    await new DocumentChatService().askAndPersist(document, "enterprise adoption", store);
    const reopened = await new DocumentChatService().listPersisted(store, document.id);

    expect(reopened).toHaveLength(2);
    expect(reopened[1].sources?.[0]).toMatchObject({ chapterTitle: "Chapter Two", sourceHint: "Chapter Two" });
  });

  it("persists PDF chat source pages and clears history", async () => {
    const store = new DocumentLibraryStore(await tempDir());
    const document = documentFixture();
    await store.saveDocument(document);
    const service = new DocumentChatService();

    await service.askAndPersist(document, "revenue", store);
    expect((await new DocumentChatService().listPersisted(store, document.id))[1].sources?.[0]).toMatchObject({
      pageNumber: 2,
      sourceHint: "Page 2",
      role: "paragraph"
    });

    await service.clearPersisted(store, document.id);
    expect(await new DocumentChatService().listPersisted(store, document.id)).toEqual([]);
  });
});

async function tempDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "booktrans-chat-"));
}

function documentFixture(): UnifiedDocument {
  return {
    id: "doc",
    sourceFormat: "pdf",
    sourcePath: "/tmp/report.pdf",
    title: "Report",
    metadata: {},
    units: [
      { id: "unit-1", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "The introduction explains the market.", order: 0, pageNumber: 1 },
      { id: "unit-2", documentId: "doc", sourceFormat: "pdf", role: "paragraph", text: "Revenue increased because enterprise adoption grew.", order: 1, pageNumber: 2 }
    ],
    chapters: [],
    outline: [],
    translations: [],
    exports: [],
    diagnostics: { parser: "test", textLength: 100, unitCount: 2, warnings: [], errors: [] },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z"
  };
}
