import { useEffect, useState } from "react";
import type { ExportedEpubResult, TranslationJobSummary, TranslationSettings } from "../../shared/types.js";
import { chapterStatusLabels, jobStatusLabels } from "../uiText.js";

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
      onMessage(result.error ?? "无法加载任务。");
    }
  }

  async function runJobAction(action: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    onBusy(true);
    try {
      const result = await action();
      onMessage(result.ok ? success : result.error ?? "任务操作失败。");
      await refresh();
    } finally {
      onBusy(false);
    }
  }

  async function exportJob(jobId: string) {
    const result = await window.bookTrans.exportJob(jobId);
    if (result.ok && result.data) {
      onExport(result.data);
      onMessage(`已导出：${result.data.outputPath}`);
    } else {
      onMessage(result.error ?? "导出失败。");
    }
    await refresh();
  }

  async function deleteJob(jobId: string) {
    const result = await window.bookTrans.deleteJob(jobId);
    onMessage(result.ok ? "任务缓存已删除。" : result.error ?? "删除失败。");
    await refresh();
  }

  async function clearCompleted() {
    const result = await window.bookTrans.clearCompletedJobs();
    onMessage(result.ok ? `已清理 ${result.data?.deleted ?? 0} 个已完成任务。` : result.error ?? "清理已完成任务失败。");
    await refresh();
  }

  return (
    <section className="panel job-manager-panel">
      <div className="panel-title-row">
        <div>
          <h2>翻译任务</h2>
          <p className="muted">这里保存本机未完成或失败的翻译任务，可继续翻译、重试失败章节或清理缓存。</p>
        </div>
        <div className="inline-actions">
          <button onClick={refresh} disabled={busy}>
            刷新
          </button>
          <button onClick={clearCompleted} disabled={busy}>
            清理已完成任务
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
                <span className={`job-status ${job.status}`}>{jobStatusLabels[job.status] ?? job.status}</span>
              </div>
              <div className="job-meta-grid">
                <span>目标语言：{job.targetLanguage}</span>
                <span>创建：{formatDate(job.createdAt)}</span>
                <span>更新：{formatDate(job.updatedAt)}</span>
                <span>章节：{job.totalChapters}</span>
                <span>已完成：{job.completedChapters}</span>
                <span>失败：{job.failedChapters}</span>
                <span>待处理：{job.pendingChapters}</span>
              </div>
              <div className="job-actions">
                <button disabled={busy || job.status === "completed"} onClick={() => runJobAction(() => window.bookTrans.resumeJob(job.jobId, settings), "已继续任务。")}>
                  继续任务
                </button>
                <button disabled={busy || job.failedChapters === 0} onClick={() => runJobAction(() => window.bookTrans.retryFailedJob(job.jobId, settings), "已重试失败章节。")}>
                  重试失败章节
                </button>
                <button disabled={busy || job.completedChapters === 0} onClick={() => exportJob(job.jobId)}>
                  导出
                </button>
                <button disabled={busy} onClick={() => deleteJob(job.jobId)}>
                  删除缓存
                </button>
                <button disabled={busy} onClick={() => setExpanded(expanded === job.jobId ? null : job.jobId)}>
                  查看详情
                </button>
              </div>
              {expanded === job.jobId ? (
                <div className="chapter-detail-table">
                  <div className="chapter-detail-head">
                    <span>#</span>
                    <span>章节</span>
                    <span>状态</span>
                    <span>分块</span>
                    <span>更新</span>
                    <span>操作</span>
                  </div>
                  {job.chapters.map((chapter) => (
                    <div className="chapter-detail-row" key={chapter.chapterId}>
                      <span>{chapter.index}</span>
                      <span title={chapter.failedReason}>{chapter.title}</span>
                      <span>{chapterStatusLabels[chapter.status]}</span>
                      <span>
                        {chapter.completedChunks} / {chapter.totalChunks}
                      </span>
                      <span>{formatDate(chapter.updatedAt)}</span>
                      <button
                        disabled={busy || chapter.status !== "failed"}
                        onClick={() => runJobAction(() => window.bookTrans.retryChapter(job.jobId, chapter.chapterId, settings), "已重试本章。")}
                      >
                        重试本章
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">暂无翻译任务。</p>
      )}
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
