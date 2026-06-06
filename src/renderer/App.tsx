import { useEffect, useMemo, useState } from "react";
import type { ImportedBook, TranslationProgress, TranslationSettings } from "../shared/types.js";
import { BookInfoCard } from "./components/BookInfoCard.js";
import { ChapterList } from "./components/ChapterList.js";
import { ImportPanel } from "./components/ImportPanel.js";
import { ProgressPanel } from "./components/ProgressPanel.js";
import { TranslationSettingsPanel } from "./components/TranslationSettings.js";

const emptyProgress: TranslationProgress = {
  translatedChunks: 0,
  totalChunks: 0,
  status: "pending",
  chapters: [],
  log: []
};

export function App() {
  const [book, setBook] = useState<ImportedBook | null>(null);
  const [settings, setSettings] = useState<TranslationSettings>({
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4o-mini",
    useMock: false
  });
  const [progress, setProgress] = useState<TranslationProgress>(emptyProgress);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [canExport, setCanExport] = useState(false);

  useEffect(() => {
    void window.bookTrans.getSettings().then(setSettings);
    return window.bookTrans.onProgress((next: TranslationProgress) => {
      setProgress(next);
      setBusy(next.status === "translating" || next.status === "pending");
      if (next.status === "completed") {
        setCanExport(true);
      }
    });
  }, []);

  const percent = useMemo(() => {
    if (!progress.totalChunks) {
      return 0;
    }
    return Math.round((progress.translatedChunks / progress.totalChunks) * 100);
  }, [progress.totalChunks, progress.translatedChunks]);

  async function importBook() {
    setMessage("");
    const imported = await window.bookTrans.importEpub();
    if (imported) {
      setBook(imported);
      setProgress(emptyProgress);
      setCanExport(false);
      setMessage(`Imported ${imported.metadata.title}`);
    }
  }

  async function saveSettings(next: TranslationSettings) {
    const saved = await window.bookTrans.saveSettings(next);
    setSettings(saved);
    setMessage("Settings saved locally.");
  }

  async function startTranslation() {
    if (!book) {
      setMessage("Import an EPUB first.");
      return;
    }
    setBusy(true);
    setCanExport(false);
    setMessage("Translation started.");
    try {
      await window.bookTrans.startTranslation(settings);
      setMessage("Translation completed.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Translation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelTranslation() {
    await window.bookTrans.cancelTranslation();
    setBusy(false);
    setMessage("Cancellation requested.");
  }

  async function exportBook() {
    try {
      const output = await window.bookTrans.exportEpub();
      if (output) {
        setMessage(`Exported: ${output}`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    }
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>BookTrans Desk</h1>
          <p>Local-first EPUB translation workbench</p>
        </div>
        <div className="status-pill">{progress.status}</div>
      </header>

      <section className="workspace-grid">
        <aside className="sidebar">
          <ImportPanel onImport={importBook} busy={busy} />
          <TranslationSettingsPanel settings={settings} onSave={saveSettings} busy={busy} />
          <div className="actions">
            <button className="primary" onClick={startTranslation} disabled={!book || busy}>
              Start Translation
            </button>
            <button onClick={cancelTranslation} disabled={!busy}>
              Cancel Task
            </button>
            <button onClick={exportBook} disabled={!canExport || busy}>
              Export EPUB
            </button>
          </div>
        </aside>

        <section className="content">
          <BookInfoCard book={book} />
          <ChapterList chapters={book?.chapters ?? []} progress={progress.chapters} />
          <ProgressPanel progress={progress} percent={percent} message={message} />
        </section>
      </section>
    </main>
  );
}
