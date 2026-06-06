import { useEffect, useState } from "react";
import type { ExportedEpubResult, TranslationJobSummary, TranslationSettings } from "../../shared/types.js";

interface JobManagerPanelProps {
  settings: TranslationSettings;
  busy: boolean;
  onBusy: (busy: boolean) => void;
  onMessage: (message: string) => void;
  onExport: (result: ExportedEpubResult) => void;
}

export function JobManagerPanel({ settings, busy, onBusy, onMessage, onExport }: JobManagerPanelProps) {
  const [jobs, setJobs] = useState<TranslationJobSummary[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const result = await window.bookTrans.listJobs();
    if (result.ok) {
      setJobs(result.data ?? []);
    } else {
      onMessage(result.error ?? "Could not load jobs.");
    }
  }

  async function runJobAction(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    onBusy(true);
    try {
      const result = await action();
      onMessage(result.ok ? success : result.error ?? "Job action failed.");
      await refresh();
    } finally {
      onBusy(false);
    }
  }

  async function exportJob(jobId: string) {
    const result = await window.bookTrans.exportJob(jobId);
    if (result.ok && result.data) {
      onExport(result.data);
      onMessage(`Exported: ${result.data.outputPath}`);
    } else {
      onMessage(result.error ?? "Export failed.");
    }
    await refresh();
  }

  async function deleteJob(jobId: string) {
    const result = await window.bookTrans.deleteJob(jobId);
    onMessage(result.ok ? "Job cache deleted." : result.error ?? "Delete failed.");
    await refresh();
  }

  async function clearCompleted() {
    const result = await window.bookTrans.clearCompletedJobs();
    onMessage(result.ok ? `Cleared ${result.data?.deleted ?? 0} completed jobs.` : result.error ?? "Clear completed failed.");
    await refresh();
  }

  return (
    <section className="panel job-manager-panel">
      <div className="panel-title-row">
        <h2>Translation Jobs</h2>
        <div className="inline-actions">
          <button onClick={refresh} disabled={busy}>
            Refresh
          </button>
          <button onClick={clearCompleted} disabled={busy}>
            Clear Completed
          </button>
        </div>
      </div>

      {jobs.length ? (
        <div className="job-list">
          {jobs.map((job) => (
            <article className="job-card" key={job.jobId}>
              <div className="job-card-header">
                <div>
                  <h3>{job.bookTitle}</h3>
                  <p title={job.sourceEpubPath}>{job.sourceEpubPath}</p>
                </div>
                <span className={`job-status ${job.status}`}>{job.status}</span>
              </div>
              <div className="job-meta-grid">
                <span>Target: {job.targetLanguage}</span>
                <span>Created: {formatDate(job.createdAt)}</span>
                <span>Updated: {formatDate(job.updatedAt)}</span>
                <span>Chapters: {job.totalChapters}</span>
                <span>Done: {job.completedChapters}</span>
                <span>Failed: {job.failedChapters}</span>
                <span>Pending: {job.pendingChapters}</span>
              </div>
              <div className="job-actions">
                <button disabled={busy || job.status === "completed"} onClick={() => runJobAction(() => window.bookTrans.resumeJob(job.jobId, settings), "Job resumed.")}>
                  Resume
                </button>
                <button disabled={busy || job.failedChapters === 0} onClick={() => runJobAction(() => window.bookTrans.retryFailedJob(job.jobId, settings), "Failed chapters retried.")}>
                  Retry Failed
                </button>
                <button disabled={busy || job.completedChapters === 0} onClick={() => exportJob(job.jobId)}>
                  Export
                </button>
                <button disabled={busy} onClick={() => deleteJob(job.jobId)}>
                  Delete Cache
                </button>
                <button disabled={busy} onClick={() => setExpanded(expanded === job.jobId ? null : job.jobId)}>
                  Show Details
                </button>
              </div>
              {expanded === job.jobId ? (
                <div className="chapter-detail-table">
                  <div className="chapter-detail-head">
                    <span>#</span>
                    <span>Chapter</span>
                    <span>Status</span>
                    <span>Chunks</span>
                    <span>Updated</span>
                    <span>Action</span>
                  </div>
                  {job.chapters.map((chapter) => (
                    <div className="chapter-detail-row" key={chapter.chapterId}>
                      <span>{chapter.index}</span>
                      <span title={chapter.failedReason}>{chapter.title}</span>
                      <span>{chapter.status}</span>
                      <span>
                        {chapter.completedChunks} / {chapter.totalChunks}
                      </span>
                      <span>{formatDate(chapter.updatedAt)}</span>
                      <button
                        disabled={busy || chapter.status !== "failed"}
                        onClick={() => runJobAction(() => window.bookTrans.retryChapter(job.jobId, chapter.chapterId, settings), "Chapter retried.")}
                      >
                        Retry This Chapter
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">No translation jobs yet.</p>
      )}
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
