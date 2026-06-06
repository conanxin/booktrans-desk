import { useEffect, useState } from "react";
import type { ExportHistoryItem } from "../../shared/types.js";

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
      onMessage(result.error ?? "Could not load export history.");
    }
  }

  async function refreshOne(id: string) {
    const result = await window.bookTrans.refreshExport(id);
    onMessage(result.ok ? "Export status refreshed." : result.error ?? "Refresh failed.");
    await refresh();
  }

  async function copyPath(outputPath: string) {
    await navigator.clipboard.writeText(outputPath);
    onMessage("Export path copied.");
  }

  async function openFolder(outputPath: string) {
    const result = await window.bookTrans.openExportFolder(outputPath);
    onMessage(result.ok ? "Opened export folder." : result.error ?? "File does not exist.");
  }

  async function deleteItem(id: string) {
    const result = await window.bookTrans.deleteExport(id);
    onMessage(result.ok ? "Export history item deleted." : result.error ?? "Delete failed.");
    await refresh();
  }

  async function clearAll() {
    const result = await window.bookTrans.clearExports();
    onMessage(result.ok ? "Export history cleared." : result.error ?? "Clear failed.");
    await refresh();
  }

  async function removeMissing() {
    const result = await window.bookTrans.removeMissingExports();
    onMessage(result.ok ? `Removed ${result.data?.removed ?? 0} missing records.` : result.error ?? "Remove missing failed.");
    await refresh();
  }

  return (
    <section className="panel export-history-panel">
      <div className="panel-title-row">
        <h2>Export History</h2>
        <div className="inline-actions">
          <button onClick={refresh}>Refresh</button>
          <button onClick={removeMissing}>Remove Missing Records</button>
          <button onClick={clearAll}>Clear History</button>
        </div>
      </div>
      {items.length ? (
        <div className="export-list">
          {items.map((item) => (
            <article className="export-row" key={item.id}>
              <div>
                <strong>{item.sourceBookTitle ?? "Untitled"}</strong>
                <p title={item.outputEpubPath}>{item.outputEpubPath}</p>
              </div>
              <span>{formatDate(item.createdAt)}</span>
              <span>{item.validationStatus}</span>
              <span>{item.externalValidationStatus ?? "unavailable"}</span>
              <span>{item.fileExists === undefined ? "unknown" : item.fileExists ? "yes" : "no"}</span>
              <span>{item.fileSize ? `${Math.round(item.fileSize / 1024)} KB` : "-"}</span>
              <span>{item.lastModified ? formatDate(item.lastModified) : "-"}</span>
              <span>{item.model ?? "mock"}</span>
              <span>{item.style ?? "faithful"}</span>
              <div className="inline-actions">
                <button onClick={() => refreshOne(item.id)}>Refresh</button>
                <button onClick={() => copyPath(item.outputEpubPath)}>Copy Path</button>
                <button onClick={() => openFolder(item.outputEpubPath)} disabled={item.fileExists === false}>
                  Open Folder
                </button>
                <button onClick={() => deleteItem(item.id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="muted">No exports recorded yet.</p>
      )}
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}
