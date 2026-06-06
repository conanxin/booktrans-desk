import type { TranslationProgress } from "../../shared/types.js";

interface ProgressPanelProps {
  progress: TranslationProgress;
  percent: number;
  message: string;
}

export function ProgressPanel({ progress, percent, message }: ProgressPanelProps) {
  return (
    <section className="panel progress-panel">
      <div className="progress-header">
        <h2>Progress</h2>
        <span>{percent}%</span>
      </div>
      <div className="progress-track" aria-label="Translation progress">
        <div style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-meta">
        <span>Current chapter: {progress.currentChapter ?? "None"}</span>
        <span>
          Chunks: {progress.translatedChunks} / {progress.totalChunks}
        </span>
      </div>
      {message ? <p className="message">{message}</p> : null}
      <div className="log-box">
        {(progress.log.length ? progress.log : ["Waiting for task."]).map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
    </section>
  );
}
