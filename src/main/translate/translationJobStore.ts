import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { ImportedBook, TranslationStatus, TranslatedChapter } from "../../shared/types.js";

export interface StoredChunk {
  index: number;
  status: "completed" | "failed";
  source: string;
  translated?: string;
  error?: string;
}

export interface StoredChapter {
  chapterId: string;
  href: string;
  title: string;
  status: TranslationStatus;
  completedChunks: StoredChunk[];
  failedChunks: StoredChunk[];
  translatedHtml?: string;
  tempPath?: string;
  error?: string;
}

export interface StoredTranslationJob {
  jobId: string;
  createdAt: string;
  updatedAt: string;
  bookFingerprint: string;
  sourceEpubPath: string;
  targetLanguage: string;
  status: TranslationStatus;
  chapters: StoredChapter[];
}

export class TranslationJobStore {
  constructor(private readonly jobsDir: string) {}

  async createJob(book: ImportedBook, targetLanguage = "zh-CN"): Promise<StoredTranslationJob> {
    await this.ensureDir();
    const now = new Date().toISOString();
    const job: StoredTranslationJob = {
      jobId: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      bookFingerprint: fingerprintBook(book),
      sourceEpubPath: book.filePath,
      targetLanguage,
      status: "pending",
      chapters: book.chapters.map((chapter) => ({
        chapterId: chapter.id,
        href: chapter.href,
        title: chapter.title,
        status: "pending",
        completedChunks: [],
        failedChunks: []
      }))
    };
    await this.saveJob(job);
    return job;
  }

  async saveJob(job: StoredTranslationJob): Promise<void> {
    await this.ensureDir();
    const safeJob = stripSecrets({ ...job, updatedAt: new Date().toISOString() });
    await fs.writeFile(this.jobPath(job.jobId), JSON.stringify(safeJob, null, 2), "utf8");
  }

  async readJob(jobId: string): Promise<StoredTranslationJob> {
    const raw = await fs.readFile(this.jobPath(jobId), "utf8");
    return JSON.parse(raw) as StoredTranslationJob;
  }

  async findResumableJob(book: ImportedBook, targetLanguage = "zh-CN"): Promise<StoredTranslationJob | null> {
    await this.ensureDir();
    const fingerprint = fingerprintBook(book);
    const jobs = await this.listJobs();
    return (
      jobs
        .filter(
          (job) =>
            job.bookFingerprint === fingerprint &&
            job.targetLanguage === targetLanguage &&
            job.status !== "completed" &&
            job.status !== "cancelled"
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0] ?? null
    );
  }

  async updateChapterStatus(
    jobId: string,
    chapterId: string,
    status: TranslationStatus,
    patch: Partial<StoredChapter> = {}
  ): Promise<StoredTranslationJob> {
    const job = await this.readJob(jobId);
    const chapter = job.chapters.find((item) => item.chapterId === chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found in job: ${chapterId}`);
    }
    Object.assign(chapter, patch, { status });
    job.status = summarizeJobStatus(job.chapters);
    await this.saveJob(job);
    return this.readJob(jobId);
  }

  async retryFailedChapters(jobId: string): Promise<StoredTranslationJob> {
    const job = await this.readJob(jobId);
    for (const chapter of job.chapters) {
      if (chapter.status === "failed") {
        chapter.status = "pending";
        chapter.error = undefined;
        chapter.failedChunks = [];
      }
    }
    job.status = summarizeJobStatus(job.chapters);
    await this.saveJob(job);
    return this.readJob(jobId);
  }

  async clearAll(): Promise<void> {
    await fs.rm(this.jobsDir, { recursive: true, force: true });
    await this.ensureDir();
  }

  async toTranslatedChapters(job: StoredTranslationJob): Promise<TranslatedChapter[]> {
    return job.chapters
      .filter((chapter) => chapter.status === "completed" && chapter.translatedHtml)
      .map((chapter) => ({
        chapterId: chapter.chapterId,
        href: chapter.href,
        html: chapter.translatedHtml ?? ""
      }));
  }

  private async listJobs(): Promise<StoredTranslationJob[]> {
    const files = await fs.readdir(this.jobsDir).catch(() => []);
    const jobs = await Promise.all(
      files
        .filter((file) => file.endsWith(".json"))
        .map(async (file) => JSON.parse(await fs.readFile(path.join(this.jobsDir, file), "utf8")) as StoredTranslationJob)
    );
    return jobs;
  }

  private async ensureDir(): Promise<void> {
    await fs.mkdir(this.jobsDir, { recursive: true });
  }

  private jobPath(jobId: string): string {
    return path.join(this.jobsDir, `${jobId}.json`);
  }
}

export function createTranslationJobStore(userDataDir: string): TranslationJobStore {
  return new TranslationJobStore(path.join(userDataDir, "translation-jobs"));
}

export function fingerprintBook(book: ImportedBook): string {
  const hash = crypto.createHash("sha256");
  hash.update(book.filePath);
  hash.update(book.metadata.title);
  hash.update(book.metadata.author);
  hash.update(String(book.chapters.length));
  for (const chapter of book.chapters) {
    hash.update(chapter.href);
    hash.update(String(chapter.html.length));
  }
  return hash.digest("hex");
}

function summarizeJobStatus(chapters: StoredChapter[]): TranslationStatus {
  if (chapters.some((chapter) => chapter.status === "failed")) {
    return "failed";
  }
  if (chapters.some((chapter) => chapter.status === "cancelled")) {
    return "cancelled";
  }
  if (chapters.every((chapter) => chapter.status === "completed")) {
    return "completed";
  }
  if (chapters.some((chapter) => chapter.status === "translating")) {
    return "translating";
  }
  return "pending";
}

function stripSecrets<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (key, nestedValue) => (key.toLowerCase().includes("apikey") ? undefined : nestedValue))) as T;
}
