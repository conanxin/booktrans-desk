import { useEffect, useMemo, useState } from "react";
import type { ExternalEpubCheckReport, ImportedBook, TranslationProgress, TranslationSettings, ValidationReport } from "../shared/types.js";
import { BookInfoCard } from "./components/BookInfoCard.js";
import { ChapterList } from "./components/ChapterList.js";
import { ExportHistoryPanel } from "./components/ExportHistoryPanel.js";
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
  const [activeTab, setActiveTab] = useState<"translate" | "jobs" | "exports" | "settings">("translate");

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
      if (imported.loadedProfile) {
        const saved = await window.bookTrans.getSettings();
        setSettings(saved);
        setMessage(`已导入《${imported.metadata.title}》，并自动载入本书的翻译配置。`);
      } else {
        setMessage(`已导入《${imported.metadata.title}》。`);
      }
    }
  }

  async function saveSettings(next: TranslationSettings) {
    const saved = await window.bookTrans.saveSettings(next);
    setSettings(saved);
    setMessage("设置已保存到本机。");
  }

  async function startTranslation() {
    if (!book) {
      setMessage("请先导入一本 EPUB。");
      return;
    }
    setBusy(true);
    setCanExport(false);
    setValidation(null);
    setExternalValidation(undefined);
    setMessage("翻译任务已开始。");
    try {
      await window.bookTrans.startTranslation(settings);
      setMessage("翻译已完成，可以导出 EPUB。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "翻译失败。");
    } finally {
      setBusy(false);
    }
  }

  async function cancelTranslation() {
    await window.bookTrans.cancelTranslation();
    setBusy(false);
    setMessage("已请求取消任务。");
  }

  async function exportBook() {
    try {
      const result = await window.bookTrans.exportEpub();
      if (result) {
        setValidation(result.validation);
        setExternalValidation(result.externalValidation);
        setMessage(`已导出：${result.outputPath}`);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导出失败。");
    }
  }

  async function clearJobCache() {
    await window.bookTrans.clearJobCache();
    setCanExport(false);
    setValidation(null);
    setExternalValidation(undefined);
    setMessage("翻译任务缓存已清理。");
  }

  async function saveProfile() {
    const result = await window.bookTrans.saveCurrentProfile(settings);
    setMessage(result.ok ? "已保存本书配置。" : result.error ?? "保存本书配置失败。");
  }

  async function resetProfile() {
    const result = await window.bookTrans.deleteCurrentProfile();
    setMessage(result.ok ? "已重置本书配置。" : result.error ?? "重置本书配置失败。");
  }

  function acceptExportResult(result: Awaited<ReturnType<typeof window.bookTrans.exportEpub>>) {
    setValidation(result.validation);
    setExternalValidation(result.externalValidation);
    setCanExport(true);
  }

  const topStatus = getTopStatus({ book: Boolean(book), busy, canExport, progressStatus: progress.status, validationStatus: validation?.status });
  const glossaryCount = settings.glossary?.split(/\r?\n/).filter((line) => line.trim()).length ?? 0;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>BookTrans Desk</h1>
          <p>AI 电子书翻译工作台</p>
        </div>
        <div className={`status-pill ${topStatus.tone}`}>{topStatus.label}</div>
      </header>

      <nav className="app-tabs" aria-label="主导航">
        <button className={activeTab === "translate" ? "active" : ""} onClick={() => setActiveTab("translate")}>
          翻译工作台
        </button>
        <button className={activeTab === "jobs" ? "active" : ""} onClick={() => setActiveTab("jobs")}>
          任务
        </button>
        <button className={activeTab === "exports" ? "active" : ""} onClick={() => setActiveTab("exports")}>
          导出记录
        </button>
        <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
          设置
        </button>
      </nav>

      {activeTab === "translate" ? (
        <section className="workspace-page">
          <WorkflowSteps bookReady={Boolean(book)} busy={busy} canExport={canExport} />
          <section className="workspace-grid">
            <aside className="sidebar">
              <ImportPanel onImport={importBook} busy={busy} />
              <TranslationSettingsPanel settings={settings} onSave={saveSettings} busy={busy} glossaryCount={glossaryCount} />
              <div className="actions">
                <button className="primary" onClick={startTranslation} disabled={!book || busy}>
                  开始翻译
                </button>
                <button onClick={cancelTranslation} disabled={!busy}>
                  取消任务
                </button>
                <button className={canExport ? "primary" : ""} onClick={exportBook} disabled={!canExport || busy}>
                  导出 EPUB
                </button>
                <button onClick={clearJobCache} disabled={busy}>
                  清理任务缓存
                </button>
                <button onClick={saveProfile} disabled={!book || busy}>
                  保存本书配置
                </button>
                <button onClick={resetProfile} disabled={!book || busy}>
                  重置本书配置
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
        </section>
      ) : null}

      {activeTab === "jobs" ? (
        <section className="single-column">
          <JobManagerPanel settings={settings} busy={busy} onBusy={setBusy} onMessage={setMessage} onExport={acceptExportResult} />
          <ProgressPanel progress={progress} percent={percent} message={message} validation={validation} />
          <ValidationReportPanel report={validation} externalReport={externalValidation} title={book?.metadata.title ?? "EPUB"} onMessage={setMessage} />
        </section>
      ) : null}

      {activeTab === "exports" ? (
        <section className="single-column">
          <ExportHistoryPanel onMessage={setMessage} />
          <ValidationReportPanel report={validation} externalReport={externalValidation} title={book?.metadata.title ?? "EPUB"} onMessage={setMessage} />
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <section className="settings-layout">
          <TranslationSettingsPanel settings={settings} onSave={saveSettings} busy={busy} glossaryCount={glossaryCount} defaultOpen />
          <section className="panel">
            <h2>隐私与安全</h2>
            <p className="muted">
              BookTrans Desk 默认在本地运行，不包含遥测、云同步或账号系统。当你配置 AI API 并开始翻译时，待翻译文本会发送给你配置的模型服务。任务缓存、导出历史和诊断包不会保存 API 密钥。
            </p>
          </section>
        </section>
      ) : null}
    </main>
  );
}

function WorkflowSteps({ bookReady, busy, canExport }: { bookReady: boolean; busy: boolean; canExport: boolean }) {
  const activeIndex = canExport ? 3 : busy ? 2 : bookReady ? 1 : 0;
  const steps = ["导入 EPUB", "配置翻译", "开始翻译", "导出结果"];
  return (
    <section className="workflow-card" aria-label="翻译流程">
      {steps.map((step, index) => (
        <div className={`workflow-step ${index <= activeIndex ? "active" : ""}`} key={step}>
          <span>{index + 1}</span>
          <strong>{step}</strong>
        </div>
      ))}
    </section>
  );
}

function getTopStatus({
  book,
  busy,
  canExport,
  progressStatus,
  validationStatus
}: {
  book: boolean;
  busy: boolean;
  canExport: boolean;
  progressStatus: TranslationProgress["status"];
  validationStatus?: ValidationReport["status"];
}): { label: string; tone: string } {
  if (validationStatus === "fail" || progressStatus === "failed") {
    return { label: "出错", tone: "danger" };
  }
  if (busy || progressStatus === "translating") {
    return { label: "翻译中", tone: "active" };
  }
  if (canExport) {
    return { label: "可导出", tone: "success" };
  }
  if (progressStatus === "completed") {
    return { label: "已完成", tone: "success" };
  }
  if (book) {
    return { label: "已导入", tone: "ready" };
  }
  return { label: "待导入", tone: "idle" };
}
