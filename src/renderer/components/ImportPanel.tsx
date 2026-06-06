interface ImportPanelProps {
  busy: boolean;
  onImport: () => void;
}

export function ImportPanel({ busy, onImport }: ImportPanelProps) {
  return (
    <section className="panel import-panel">
      <div>
        <p className="section-kicker">第一步</p>
        <h2>导入 EPUB 电子书</h2>
        <p className="muted">选择一本本地 EPUB 文件，BookTrans Desk 会在本地解析章节、图片和样式。</p>
      </div>
      <button className="primary full" onClick={onImport} disabled={busy}>
        选择 EPUB 文件
      </button>
      <p className="empty-hint">还没有导入电子书。支持 reflowable EPUB；暂不支持 DRM、PDF、MOBI、AZW3。</p>
    </section>
  );
}
