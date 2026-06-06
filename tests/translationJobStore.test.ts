import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { ImportedBook } from "../src/shared/types.js";
import { TranslationJobStore } from "../src/main/translate/translationJobStore.js";

describe("TranslationJobStore", () => {
  it("creates a job", async () => {
    const store = new TranslationJobStore(await tempJobsDir());
    const job = await store.createJob(bookFixture());
    expect(job.jobId).toBeTruthy();
    expect(job.chapters).toHaveLength(1);
    expect(job.status).toBe("pending");
  });

  it("updates chapter status", async () => {
    const store = new TranslationJobStore(await tempJobsDir());
    const job = await store.createJob(bookFixture());
    const updated = await store.updateChapterStatus(job.jobId, "c1", "completed", { translatedHtml: "<html/>" });
    expect(updated.chapters[0].status).toBe("completed");
    expect(updated.status).toBe("completed");
  });

  it("saves and reads a job", async () => {
    const store = new TranslationJobStore(await tempJobsDir());
    const job = await store.createJob(bookFixture());
    const read = await store.readJob(job.jobId);
    expect(read.bookFingerprint).toBe(job.bookFingerprint);
  });

  it("resets failed chapters for retry", async () => {
    const store = new TranslationJobStore(await tempJobsDir());
    const job = await store.createJob(bookFixture());
    await store.updateChapterStatus(job.jobId, "c1", "failed", {
      error: "boom",
      failedChunks: [{ index: 0, status: "failed", source: "chapter", error: "boom" }]
    });
    const retry = await store.retryFailedChapters(job.jobId);
    expect(retry.chapters[0].status).toBe("pending");
    expect(retry.chapters[0].failedChunks).toEqual([]);
  });

  it("does not persist apiKey fields", async () => {
    const dir = await tempJobsDir();
    const store = new TranslationJobStore(dir);
    const job = await store.createJob(bookFixture());
    await store.saveJob({ ...job, apiKey: "secret" } as unknown as typeof job);
    const raw = await fs.readFile(path.join(dir, `${job.jobId}.json`), "utf8");
    expect(raw).not.toContain("secret");
    expect(raw).not.toContain("apiKey");
  });
});

async function tempJobsDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "booktrans-jobs-"));
}

function bookFixture(): ImportedBook {
  return {
    filePath: "/tmp/book.epub",
    rootFilePath: "OPS/content.opf",
    opfDir: "OPS",
    metadata: { title: "Book", author: "Author", language: "en" },
    chapters: [
      {
        id: "c1",
        href: "chapter.xhtml",
        absolutePath: "OPS/chapter.xhtml",
        title: "Chapter",
        text: "Hello",
        html: '<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Hello</p></body></html>',
        mediaType: "application/xhtml+xml",
        order: 0
      }
    ]
  };
}
