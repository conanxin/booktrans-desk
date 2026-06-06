import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { ImportedBook, JobChapterDetail, TranslationJobSummary, TranslationStatus, TranslatedChapter } from "../../shared/types.js";

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
  totalChunks?: number;
  translatedHtml?: string;
  tempPath?: string;
  error?: string;
  updatedAt?: string;
}

export interface StoredTranslationJob {
  jobId: string;
  createdAt: string;
  updatedAt: string;
  bookFingerprint: string;
  bookTitle?: string;
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
      bookTitle: book.metadata.title,
      sourceEpubPath: book.filePath,
      targetLanguage,
      status: "pending",
      chapters: book.chapters.map((chapter) => ({
        chapterId: chapter.id,
        href: chapter.href,
        title: chapter.title,
        status: "pending",
        completedChunks: [],
        failedChunks: [],
        totalChunks: 0,
        updatedAt: now
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

  async listJobSummaries(): Promise<TranslationJobSummary[]> {
    const jobs = await this.listJobs();
    return jobs.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toSummary);
  }

  async getJobSummary(jobId: string): Promise<TranslationJobSummary> {
    return toSummary(await this.readJob(jobId));
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
    chapter.updatedAt = new Date().toISOString();
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
        chapter.updatedAt = new Date().toISOString();
      }
    }
    job.status = summarizeJobStatus(job.chapters);
    await this.saveJob(job);
    return this.readJob(jobId);
  }

  async retryChapter(jobId: string, chapterId: string): Promise<StoredTranslationJob> {
    const job = await this.readJob(jobId);
    const chapter = job.chapters.find((item) => item.chapterId === chapterId);
    if (!chapter) {
      throw new Error(`Chapter not found in job: ${chapterId}`);
    }
    chapter.status = "pending";
    chapter.error = undefined;
    chapter.failedChunks = [];
    chapter.updatedAt = new Date().toISOString();
    job.status = summarizeJobStatus(job.chapters);
    await this.saveJob(job);
    return this.readJob(jobId);
  }

  async deleteJob(jobId: string): Promise<void> {
    await fs.rm(this.jobPath(jobId), { force: true });
  }

  async clearCompleted(): Promise<number> {
    const jobs = await this.listJobs();
    let deleted = 0;
    for (const job of jobs) {
      if (job.status === "completed") {
        await this.deleteJob(job.jobId);
        deleted += 1;
      }
    }
    return deleted;
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
        .map(async (file) => {
          try {
            return JSON.parse(await fs.readFile(path.join(this.jobsDir, file), "utf8")) as StoredTranslationJob;
          } catch {
            return null;
          }
        })
    );
    return jobs.filter((job): job is StoredTranslationJob => Boolean(job));
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

function toSummary(job: StoredTranslationJob): TranslationJobSummary {
  const chapters: JobChapterDetail[] = job.chapters.map((chapter, index) => ({
    chapterId: chapter.chapterId,
    index: index + 1,
    title: chapter.title,
    status: chapter.status,
    completedChunks: chapter.completedChunks.length,
    totalChunks: chapter.totalChunks ?? chapter.completedChunks.length + chapter.failedChunks.length,
    failedReason: chapter.error,
    updatedAt: chapter.updatedAt ?? job.updatedAt
  }));
  return {
    jobId: job.jobId,
    bookTitle: job.bookTitle || path.basename(job.sourceEpubPath, path.extname(job.sourceEpubPath)) || "Untitled",
    sourceEpubPath: job.sourceEpubPath,
    targetLanguage: job.targetLanguage,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    totalChapters: chapters.length,
    completedChapters: chapters.filter((chapter) => chapter.status === "completed").length,
    failedChapters: chapters.filter((chapter) => chapter.status === "failed").length,
    pendingChapters: chapters.filter((chapter) => chapter.status === "pending" || chapter.status === "translating").length,
    status: mapJobStatus(job.status),
    chapters
  };
}

function mapJobStatus(status: TranslationStatus): TranslationJobSummary["status"] {
  if (status === "translating") {
    return "running";
  }
  if (status === "pending") {
    return "paused";
  }
  return status;
}

function stripSecrets<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (key, nestedValue) => (key.toLowerCase().includes("apikey") ? undefined : nestedValue))) as T;
}
