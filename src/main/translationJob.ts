import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import type {
  ChapterProgress,
  ImportedBook,
  TranslationJobResult,
  TranslationProgress,
  TranslationSettings,
  TranslatedChapter
} from "../shared/types.js";
import { countTranslatableTextNodeGroups, translateXhtmlTextNodes } from "./epub/translateXhtmlTextNodes.js";
import { createTranslator } from "./translate/translator.js";
import { createTranslationJobStore, TranslationJobStore } from "./translate/translationJobStore.js";

export type ProgressCallback = (progress: TranslationProgress) => void;

export interface TranslateBookOptions {
  userDataDir?: string;
  jobStore?: TranslationJobStore;
  jobId?: string;
  retryFailed?: boolean;
  chapterIds?: string[];
}

export async function translateBook(
  book: ImportedBook,
  settings: TranslationSettings,
  signal: AbortSignal,
  onProgress: ProgressCallback,
  options: TranslateBookOptions = {}
): Promise<TranslationJobResult> {
  const translator = createTranslator(settings);
  const store = options.jobStore ?? createTranslationJobStore(options.userDataDir ?? path.join(os.tmpdir(), "booktrans-desk", crypto.randomUUID()));
  let job = options.jobId ? await store.readJob(options.jobId) : (await store.findResumableJob(book)) ?? (await store.createJob(book));
  if (options.retryFailed) {
    job = await store.retryFailedChapters(job.jobId);
  }
  const requestedChapterIds = options.chapterIds ? new Set(options.chapterIds) : null;

  const chapterProgress: ChapterProgress[] = book.chapters.map((chapter) => {
    const stored = job.chapters.find((item) => item.chapterId === chapter.id);
    return {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      currentChunk: stored?.completedChunks.length ?? 0,
      totalChunks: Math.max(countTranslatableTextNodeGroups(chapter.html), 1),
      status: stored?.status ?? "pending",
      error: stored?.error
    };
  });
  const totalChunks = chapterProgress.reduce((sum, item) => sum + item.totalChunks, 0);
  const translatedChapters: TranslatedChapter[] = await store.toTranslatedChapters(job);
  let translatedChunks = chapterProgress.reduce((sum, item) => sum + (item.status === "completed" ? item.totalChunks : item.currentChunk), 0);
  const log: string[] = [`Translation job ${job.jobId} ready.`];

  const emit = (status: TranslationProgress["status"], currentChapter?: string) => {
    onProgress({
      currentChapter,
      translatedChunks,
      totalChunks,
      status,
      chapters: chapterProgress.map((item) => ({ ...item })),
      log: [...log]
    });
  };

  emit(job.status === "pending" ? "pending" : "translating");

  for (const [chapterIndex, chapter] of book.chapters.entries()) {
    if (signal.aborted) {
      throw new Error("Translation cancelled.");
    }

    const progress = chapterProgress[chapterIndex];
    const storedChapter = job.chapters.find((item) => item.chapterId === chapter.id);
    if (storedChapter?.status === "completed" && storedChapter.translatedHtml) {
      log.push(`Resumed completed chapter: ${chapter.title}`);
      emit("translating", chapter.title);
      continue;
    }
    if (requestedChapterIds && !requestedChapterIds.has(chapter.id)) {
      log.push(`Skipped chapter outside retry scope: ${chapter.title}`);
      emit("translating", chapter.title);
      continue;
    }

    progress.status = "translating";
    progress.currentChunk = 0;
    progress.error = undefined;
    job = await store.updateChapterStatus(job.jobId, chapter.id, "translating", { totalChunks: progress.totalChunks });
    log.push(`Translating chapter: ${chapter.title}`);
    emit("translating", chapter.title);

    try {
      const translatedHtml = await translateXhtmlTextNodes(chapter.html, translator, {
        signal,
        onNodeTranslated: () => {
          progress.currentChunk += 1;
          translatedChunks += 1;
          emit("translating", chapter.title);
        }
      });
      translatedChapters.push({ chapterId: chapter.id, href: chapter.href, html: translatedHtml });
      job = await store.updateChapterStatus(job.jobId, chapter.id, "completed", {
        completedChunks: [{ index: 0, status: "completed", source: chapter.href, translated: "chapter-html" }],
        failedChunks: [],
        translatedHtml
      });
      progress.status = "completed";
      progress.currentChunk = progress.totalChunks;
      emit("translating", chapter.title);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Translation failed.";
      progress.status = signal.aborted ? "cancelled" : "failed";
      progress.error = message;
      await store.updateChapterStatus(job.jobId, chapter.id, progress.status, {
        error: message,
        failedChunks: [{ index: progress.currentChunk, status: "failed", source: chapter.href, error: message }]
      });
      emit(progress.status, chapter.title);
      throw error;
    }
  }

  log.push("Translation completed.");
  emit("completed");
  return { book, translatedChapters, jobId: job.jobId };
}
