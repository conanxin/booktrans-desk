import { useEffect, useState } from "react";
import type { ExportHistoryItem } from "../../shared/types.js";
import { formatExternalValidationLabel, formatValidationLabel, styleLabels } from "../uiText.js";

interface ExportHistoryPanelProps {
  onMessage: (message: string) => void;
}

export function ExportHistoryPanel({ onMessage }: ExportHistoryPanelProps) {
  const [items, setItems] = useState<ExportHistoryItem[]>([]);

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const result = await window.bookTrans.refreshAllExports();
    if (result.ok) {
      setItems(result.data ?? []);
    } else {
      onMessage(result.error ?? "无法加载导出历史。");
    }
  }

  async function refreshOne(id: string) {
    const result = await window.bookTrans.refreshExport(id);
    onMessage(result.ok ? "导出状态已刷新。" : result.error ?? "刷新失败。");
    await refresh();
  }

  async function copyPath(outputPath: string) {
    await navigator.clipboard.writeText(outputPath);
    onMessage("导出路径已复制。");
  }

  async function openFolder(outputPath: string) {
    const result = await window.bookTrans.openExportFolder(outputPath);
    onMessage(result.ok ? "已打开所在文件夹。" : result.error ?? "文件不存在。");
  }

  async function deleteItem(id: string) {
    const result = await window.bookTrans.deleteExport(id);
    onMessage(result.ok ? "导出记录已删除。" : result.error ?? "删除失败。");
    await refresh();
  }

  async function clearAll() {
    const result = await window.bookTrans.clearExports();
    onMessage(result.ok ? "导出历史已清空。" : result.error ?? "清空失败。");
    await refresh();
  }

  async function removeMissing() {
    const result = await window.bookTrans.removeMissingExports();
    onMessage(result.ok ? `已清理 ${result.data?.removed ?? 0} 条失效记录。` : result.error ?? "清理失效记录失败。");
    await refresh();
  }

  return (
    <section className="panel export-history-panel">
      <div className="panel-title-row">
        <div>
          <h2>导出历史</h2>
          <p className="muted">这里记录本机导出的 EPUB 文件和验证状态。</p>
        </div>
        <div className="inline-actions">
          <button onClick={refresh}>全部刷新</button>
          <button onClick={removeMissing}>清理失效记录</button>
          <button onClick={clearAll}>清空历史</button>
        </div>
      </div>
      {items.length ? (
        <div className="export-list">
          {items.map((item) => (
            <article className="export-row" key={item.id}>
              <div>
                <strong>{item.sourceBookTitle ?? "未命名书籍"}</strong>
                <p title={item.outputEpubPath}>{item.outputEpubPath}</p>
              </div>
              <span>{formatDate(item.createdAt)}</span>
              <span>{formatValidationLabel(item.validationStatus)}</span>
              <span>{formatExternalValidationLabel(item.externalValidationStatus)}</span>
              <span>{item.fileExists === undefined ? "未知" : item.fileExists ? "文件存在" : "文件缺失"}</span>
              <span>{item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : "-"}</span>
              <span>{item.lastModified ? formatDate(item.lastModified) : "-"}</span>
              <span>{item.model ?? "mock"}</span>
              <span>{styleLabels[(item.style as keyof typeof styleLabels) ?? "faithful"] ?? item.style ?? "忠实准确"}</span>
              <div className="inline-actions">
                <button onClick={() => refreshOne(item.id)}>刷新</button>
                <button onClick={() => copyPath(item.outputEpubPath)}>复制路径</button>
                <button onClick={() => openFolder(item.outputEpubPath)} disabled={item.fileExists === false}>
                  打开所在文件夹
                </button>
                <button onClick={() => deleteItem(item.id)}>删除记录</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">暂无导出记录。</p>
      )}
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
