interface ImportPanelProps {
  busy: boolean;
  onImport: () => void;
}

export function ImportPanel({ busy, onImport }: ImportPanelProps) {
  return (
    <section className="panel import-panel">
      <div>
        <p className="section-kicker">第一步</p>
        <h2>导入 EPUB / PDF 文件</h2>
        <p className="muted">支持导入 reflowable EPUB 和可复制文本的 PDF；暂不支持 DRM、扫描版 PDF、MOBI、AZW3。</p>
      </div>
      <button className="primary full" onClick={onImport} disabled={busy}>
        选择 EPUB / PDF 文件
      </button>
      <p className="empty-hint">还没有导入文件。PDF 第一版只支持可提取文本的文档，不做 OCR。</p>
    </section>
  );
}
