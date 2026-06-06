import { useEffect, useMemo, useState } from "react";
import type { ExternalEpubCheckReport, ImportedBook, TranslationProgress, TranslationSettings, ValidationReport } from "../shared/types.js";
import { BookInfoCard } from "./components/BookInfoCard.js";
import { ChapterList } from "./components/ChapterList.js";
import { ImportPanel } from "./components/ImportPanel.js";
import { JobManagerPanel } from "./components/JobManagerPanel.js";
import { ProgressPanel } from "./components/ProgressPanel.js";
import { TranslationSettingsPanel } from "./components/TranslationSettings.js";
import { ValidationReportPanel } from "./components/ValidationReportPanel.js";

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
    useMock: false,
    glossary: "",
    style: "faithful"
  });
  const [progress, setProgress] = useState<TranslationProgress>(emptyProgress);
  const [message, setMessage] = useState("");
  const [validation, setValidation] = useState<ValidationReport | null>(null);
  const [externalValidation, setExternalValidation] = useState<ExternalEpubCheckReport | undefined>();
  const [busy, setBusy] = useState(false);
  const [canExport, setCanExport] = useState(false);
  const [activeTab, setActiveTab] = useState<"translate" | "jobs" | "settings">("translate");

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
      setValidation(null);
      setExternalValidation(undefined);
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
    setValidation(null);
    setExternalValidation(undefined);
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
      const result = await window.bookTrans.exportEpub();
      if (result) {
        setValidation(result.validation);
        setExternalValidation(result.externalValidation);
        setMessage(`Exported: ${result.outputPath}`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    }
  }

  async function clearJobCache() {
    await window.bookTrans.clearJobCache();
    setCanExport(false);
    setValidation(null);
    setExternalValidation(undefined);
    setMessage("Translation task cache cleared.");
  }

  function acceptExportResult(result: Awaited<ReturnType<typeof window.bookTrans.exportEpub>>) {
    setValidation(result.validation);
    setExternalValidation(result.externalValidation);
    setCanExport(true);
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

      <nav className="app-tabs" aria-label="Main sections">
        <button className={activeTab === "translate" ? "active" : ""} onClick={() => setActiveTab("translate")}>
          Translate
        </button>
        <button className={activeTab === "jobs" ? "active" : ""} onClick={() => setActiveTab("jobs")}>
          Jobs
        </button>
        <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
          Settings
        </button>
      </nav>

      {activeTab === "translate" ? (
        <section className="workspace-grid">
          <aside className="sidebar">
            <ImportPanel onImport={importBook} busy={busy} />
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
              <button onClick={clearJobCache} disabled={busy}>
                Clear Task Cache
              </button>
            </div>
          </aside>

          <section className="content">
            <BookInfoCard book={book} />
            <ChapterList chapters={book?.chapters ?? []} progress={progress.chapters} />
            <ProgressPanel progress={progress} percent={percent} message={message} validation={validation} />
            <ValidationReportPanel report={validation} externalReport={externalValidation} title={book?.metadata.title ?? "EPUB"} onMessage={setMessage} />
          </section>
        </section>
      ) : null}

      {activeTab === "jobs" ? (
        <section className="single-column">
          <JobManagerPanel settings={settings} busy={busy} onBusy={setBusy} onMessage={setMessage} onExport={acceptExportResult} />
          <ProgressPanel progress={progress} percent={percent} message={message} validation={validation} />
          <ValidationReportPanel report={validation} externalReport={externalValidation} title={book?.metadata.title ?? "EPUB"} onMessage={setMessage} />
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <section className="settings-layout">
          <TranslationSettingsPanel settings={settings} onSave={saveSettings} busy={busy} />
        </section>
      ) : null}
    </main>
  );
}
