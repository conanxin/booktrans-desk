import type { PdfValidationReport, TranslationProgress, ValidationReport } from "../../shared/types.js";
import { formatStatusLabel, formatValidationLabel } from "../uiText.js";

interface ProgressPanelProps {
  progress: TranslationProgress;
  percent: number;
  message: string;
  validation: ValidationReport | PdfValidationReport | null;
}

export function ProgressPanel({ progress, percent, message, validation }: ProgressPanelProps) {
  return (
    <section className="panel progress-panel">
      <div className="progress-header">
        <h2>翻译进度</h2>
        <span>{percent}%</span>
      </div>
      <div className="progress-track" aria-label="翻译进度">
        <div style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-meta">
        <span>当前章节：{progress.currentChapter ?? "暂无"}</span>
        <span>当前状态：{formatStatusLabel(progress.status)}</span>
        <span>
          已完成分块：{progress.translatedChunks} / {progress.totalChunks}
        </span>
      </div>
      {progress.quality ? (
        <div className={`quality-summary ${progress.quality.status}`}>
          <span>已清理思考输出次数：{progress.quality.cleanedReasoningCount}</span>
          <span>已重试次数：{progress.quality.retryCount}</span>
          <span>失败分块数：{progress.quality.failedChunkCount}</span>
          <span>翻译质量状态：{progress.quality.status === "normal" ? "正常" : progress.quality.status === "warning" ? "有警告" : "失败"}</span>
        </div>
      ) : null}
      {message ? <p className="message">{message}</p> : null}
      {validation ? (
        <div className={`validation-result ${validation.status}`}>
          <strong>{progress.documentType === "pdf" ? "PDF" : "EPUB"} 验证：{formatValidationLabel(validation.status)}</strong>
          <span>{validation.summary}</span>
          {validation.status === "fail" ? <span>导出文件已保留，但它可能无法被部分阅读器打开。</span> : null}
        </div>
      ) : null}
      <details className="log-details">
        <summary>查看详细日志</summary>
        <div className="log-box">
          {(progress.log.length ? progress.log : ["任务开始后，这里会显示实时进度。"]).map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
      </details>
    </section>
  );
}
