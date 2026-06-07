export interface RunningTranslationJob {
  jobId: string;
  abortController: AbortController;
  startedAt: string;
}

export class TranslationCancellationManager {
  private current: RunningTranslationJob | null = null;

  start(jobId: string): RunningTranslationJob {
    if (this.current) {
      throw new Error("A translation task is already running.");
    }
    this.current = {
      jobId,
      abortController: new AbortController(),
      startedAt: new Date().toISOString()
    };
    return this.current;
  }

  cancel(jobId?: string): boolean {
    if (!this.current) {
      return false;
    }
    if (jobId && this.current.jobId !== jobId) {
      return false;
    }
    this.current.abortController.abort();
    return true;
  }

  clear(jobId?: string): void {
    if (!jobId || this.current?.jobId === jobId) {
      this.current = null;
    }
  }

  get active(): RunningTranslationJob | null {
    return this.current;
  }
}
