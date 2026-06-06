import type { IpcResult, TranslationJobSummary } from "../../shared/types.js";
import type { StoredTranslationJob, TranslationJobStore } from "./translationJobStore.js";

export class JobManager {
  constructor(private readonly store: TranslationJobStore) {}

  list(): Promise<IpcResult<TranslationJobSummary[]>> {
    return wrap(() => this.store.listJobSummaries());
  }

  get(jobId: string): Promise<IpcResult<TranslationJobSummary>> {
    return wrap(() => this.store.getJobSummary(jobId));
  }

  retryFailed(jobId: string): Promise<IpcResult<TranslationJobSummary>> {
    return wrap(async () => {
      await this.store.retryFailedChapters(jobId);
      return this.store.getJobSummary(jobId);
    });
  }

  retryChapter(jobId: string, chapterId: string): Promise<IpcResult<TranslationJobSummary>> {
    return wrap(async () => {
      await this.store.retryChapter(jobId, chapterId);
      return this.store.getJobSummary(jobId);
    });
  }

  delete(jobId: string): Promise<IpcResult<{ deleted: true }>> {
    return wrap(async () => {
      await this.store.deleteJob(jobId);
      return { deleted: true };
    });
  }

  clearCompleted(): Promise<IpcResult<{ deleted: number }>> {
    return wrap(async () => ({ deleted: await this.store.clearCompleted() }));
  }

  readStoredJob(jobId: string): Promise<IpcResult<StoredTranslationJob>> {
    return wrap(() => this.store.readJob(jobId));
  }
}

async function wrap<T>(operation: () => Promise<T>): Promise<IpcResult<T>> {
  try {
    return { ok: true, data: await operation() };
  } catch (error) {
    return { ok: false, error: sanitizeError(error) };
  }
}

export function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]").replace(/(api[_-]?key=)[^&\s]+/gi, "$1[redacted]");
}
