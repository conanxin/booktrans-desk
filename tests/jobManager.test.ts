import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { JobManager } from "../src/main/translate/jobManager.js";
import { TranslationJobStore } from "../src/main/translate/translationJobStore.js";
import type { ImportedBook } from "../src/shared/types.js";

describe("JobManager", () => {
  it("lists jobs", async () => {
    const { manager, store } = await fixture();
    await store.createJob(bookFixture("Book A"));
    const result = await manager.list();
    expect(result.ok).toBe(true);
    expect(result.data?.[0].bookTitle).toBe("Book A");
  });

  it("gets a job summary", async () => {
    const { manager, store } = await fixture();
    const job = await store.createJob(bookFixture("Book A"));
    const result = await manager.get(job.jobId);
    expect(result.ok).toBe(true);
    expect(result.data?.totalChapters).toBe(2);
  });

  it("retries failed chapters", async () => {
    const { manager, store } = await fixture();
    const job = await store.createJob(bookFixture("Book A"));
    await store.updateChapterStatus(job.jobId, "c1", "failed", { error: "boom" });
    const result = await manager.retryFailed(job.jobId);
    expect(result.ok).toBe(true);
    expect(result.data?.failedChapters).toBe(0);
  });

  it("retries one chapter", async () => {
    const { manager, store } = await fixture();
    const job = await store.createJob(bookFixture("Book A"));
    await store.updateChapterStatus(job.jobId, "c1", "failed", { error: "boom" });
    await store.updateChapterStatus(job.jobId, "c2", "failed", { error: "zap" });
    const result = await manager.retryChapter(job.jobId, "c1");
    expect(result.ok).toBe(true);
    expect(result.data?.chapters.find((chapter) => chapter.chapterId === "c1")?.status).toBe("pending");
    expect(result.data?.chapters.find((chapter) => chapter.chapterId === "c2")?.status).toBe("failed");
  });

  it("deletes a job", async () => {
    const { manager, store } = await fixture();
    const job = await store.createJob(bookFixture("Book A"));
    const deleted = await manager.delete(job.jobId);
    const list = await manager.list();
    expect(deleted.ok).toBe(true);
    expect(list.data).toEqual([]);
  });

  it("clears completed jobs", async () => {
    const { manager, store } = await fixture();
    const job = await store.createJob(bookFixture("Book A"));
    await store.updateChapterStatus(job.jobId, "c1", "completed", { translatedHtml: "<html/>" });
    await store.updateChapterStatus(job.jobId, "c2", "completed", { translatedHtml: "<html/>" });
    const result = await manager.clearCompleted();
    expect(result.ok).toBe(true);
    expect(result.data?.deleted).toBe(1);
  });
});

async function fixture(): Promise<{ manager: JobManager; store: TranslationJobStore }> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "booktrans-job-manager-"));
  const store = new TranslationJobStore(dir);
  return { manager: new JobManager(store), store };
}

function bookFixture(title: string): ImportedBook {
  return {
    filePath: `/tmp/${title}.epub`,
    rootFilePath: "OPS/content.opf",
    opfDir: "OPS",
    metadata: { title, author: "Author", language: "en" },
    chapters: [
      chapter("c1", "One", 0),
      chapter("c2", "Two", 1)
    ]
  };
}

function chapter(id: string, title: string, order: number) {
  return {
    id,
    href: `${id}.xhtml`,
    absolutePath: `OPS/${id}.xhtml`,
    title,
    text: title,
    html: `<html xmlns="http://www.w3.org/1999/xhtml"><body><p>${title}</p></body></html>`,
    mediaType: "application/xhtml+xml",
    order
  };
}
