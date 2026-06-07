import { useEffect, useMemo, useState } from "react";
import type { DocumentAnalysisRecord } from "../main/analysis/analysisService.js";
import type { DocumentChatMessage } from "../main/chat/documentChatService.js";
import type { TranslationVersionSummary } from "../main/translate/translationVersionService.js";
import type { AnalysisState, UnifiedDocument, UnifiedDocumentOutlineNode } from "../shared/documentModel.js";
import {
  exportKindLabel,
  formatAnalysisStatus,
  formatChatSource,
  formatDocumentUpdatedAt,
  summarizeDocumentStatus
} from "../shared/documentDisplayUtils.js";
import {
  formatBoundingBox,
  getDocumentChapters,
  getDocumentPages,
  getUnitSourceHint,
  getUnitsForChapter,
  getUnitsForPage
} from "../shared/documentReaderUtils.js";
import type {
  BilingualExportScope,
  ExportHistoryItem,
  ExternalEpubCheckReport,
  ImportedBook,
  ImportedDocument,
  ImportedPdfDocument,
  KnowledgeExportResult,
  PdfValidationReport,
  TranslationProgress,
  TranslationSettings,
  ValidationReport
} from "../shared/types.js";
import { ExportHistoryPanel } from "./components/ExportHistoryPanel.js";
import { JobManagerPanel } from "./components/JobManagerPanel.js";
import { ProgressPanel } from "./components/ProgressPanel.js";
import { TranslationSettingsPanel } from "./components/TranslationSettings.js";
import { ValidationReportPanel } from "./components/ValidationReportPanel.js";
import { formatIpcError, sanitizeRendererError } from "./errorMapping.js";

const emptyProgress: TranslationProgress = {
  translatedChunks: 0,
  totalChunks: 0,
  status: "pending",
  chapters: [],
  log: []
};

type AppNav = "workspace" | "tasks" | "exports" | "settings";
type ContextTab = "ai" | "export" | "translation" | "details";

type UnifiedExportKind =
  | "markdown"
  | "json"
  | "chat"
  | "analysis"
  | "study-notes"
  | "research-digest"
  | "presentation-outline"
  | "podcast-prep"
  | "full-archive"
  | "pptx"
  | "bilingual-markdown-full"
  | "bilingual-markdown-selected"
  | "bilingual-html-full"
  | "bilingual-html-selected";

export function App() {
  const [book, setBook] = useState<ImportedDocument | null>(null);
  const [settings, setSettings] = useState<TranslationSettings>({
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4o-mini",
    providerPreset: "openai-compatible",
    useMock: false,
    glossary: "",
    style: "faithful"
  });
  const [progress, setProgress] = useState<TranslationProgress>(emptyProgress);
  const [message, setMessage] = useState("");
  const [validation, setValidation] = useState<ValidationReport | PdfValidationReport | null>(null);
  const [externalValidation, setExternalValidation] = useState<ExternalEpubCheckReport | undefined>();
  const [busy, setBusy] = useState(false);
  const [canExport, setCanExport] = useState(false);
  const [activeTab, setActiveTab] = useState<AppNav>("workspace");
  const [contextTab, setContextTab] = useState<ContextTab>("ai");
  const [documents, setDocuments] = useState<UnifiedDocument[]>([]);
  const [currentDocument, setCurrentDocument] = useState<UnifiedDocument | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<DocumentAnalysisRecord | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [analysisError, setAnalysisError] = useState("");
  const [chatMessages, setChatMessages] = useState<DocumentChatMessage[]>([]);
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatStatus, setChatStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [chatError, setChatError] = useState("");
  const [exportStatus, setExportStatus] = useState("");
  const [exportingKind, setExportingKind] = useState<UnifiedExportKind | null>(null);
  const [lastKnowledgeExport, setLastKnowledgeExport] = useState<KnowledgeExportResult | null>(null);
  const [recentExports, setRecentExports] = useState<ExportHistoryItem[]>([]);
  const [translationVersions, setTranslationVersions] = useState<TranslationVersionSummary[]>([]);
  const [selectedTranslationVersionId, setSelectedTranslationVersionId] = useState("latest");
  const [translationVersionStatus, setTranslationVersionStatus] = useState("");

  useEffect(() => {
    void window.bookTrans.getSettings().then(setSettings);
    void refreshDocumentLibrary();
    void refreshExportHistory();
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

  const glossaryCount = settings.glossary?.split(/\r?\n/).filter((line) => line.trim()).length ?? 0;
  const currentDocumentType = currentDocument?.sourceFormat ?? (isPdf(book) ? "pdf" : book ? "epub" : null);
  const topStatus = getTopStatus({
    document: currentDocument,
    busy,
    progressStatus: progress.status,
    validationStatus: validation?.status
  });

  async function importBook() {
    setMessage("");
    const imported = await window.bookTrans.importEpub();
    if (!imported) {
      return;
    }
    setBook(imported);
    setProgress(emptyProgress);
    setCanExport(false);
    setValidation(null);
    setExternalValidation(undefined);
    setMessage(isPdf(imported) ? "已导入 PDF。可进入文档库阅读、分析、问答或导出。" : `已导入《${imported.metadata.title}》。`);
    await refreshDocumentLibrary(imported);
    setActiveTab("workspace");
  }

  async function refreshDocumentLibrary(imported?: ImportedDocument) {
    const result = await window.bookTrans.listDocuments();
    if (!result.ok || !result.data) {
      return;
    }
    setDocuments(result.data);
    if (!result.data.length) {
      clearCurrentDocumentState();
      return;
    }
    const sourcePath = imported ? getImportedSourcePath(imported) : currentDocument?.sourcePath;
    const selected = sourcePath ? result.data.find((document) => document.sourcePath === sourcePath) : currentDocument ? result.data.find((document) => document.id === currentDocument.id) : result.data[0];
    if (selected) {
      await loadUnifiedDocument(selected);
    }
  }

  async function selectLibraryDocument(document: UnifiedDocument) {
    await loadUnifiedDocument(document);
    setActiveTab("workspace");
  }

  async function loadUnifiedDocument(document: UnifiedDocument) {
    setCurrentDocument(document);
    setSelectedChapterId(document.sourceFormat === "pdf" ? null : document.chapters[0]?.id ?? null);
    setSelectedPageNumber(document.sourceFormat === "pdf" ? getDocumentPages(document)[0]?.pageNumber ?? null : null);
    setAnalysisStatus("idle");
    setAnalysisError("");
    setChatStatus("idle");
    setChatError("");
    setExportStatus("");
    setSelectedTranslationVersionId("latest");
    setTranslationVersionStatus("");

    const existingAnalysis = await window.bookTrans.getAnalysis(document.id);
    setAnalysis(existingAnalysis.ok ? existingAnalysis.data ?? null : null);
    if (existingAnalysis.ok && existingAnalysis.data) {
      setAnalysisStatus("success");
    }

    const existingChat = await window.bookTrans.listDocumentChat(document.id);
    setChatMessages(existingChat.ok ? existingChat.data ?? [] : []);
    if (existingChat.ok && existingChat.data?.length) {
      setChatStatus("success");
    }

    await refreshTranslationVersions(document.id);
  }

  function clearCurrentDocumentState() {
    setCurrentDocument(null);
    setSelectedChapterId(null);
    setSelectedPageNumber(null);
    setAnalysis(null);
    setAnalysisStatus("idle");
    setAnalysisError("");
    setChatMessages([]);
    setChatStatus("idle");
    setChatError("");
    setTranslationVersions([]);
    setSelectedTranslationVersionId("latest");
    setTranslationVersionStatus("");
  }

  async function refreshCurrentDocumentSnapshot(documentId: string) {
    const result = await window.bookTrans.getDocument(documentId);
    if (result.ok && result.data) {
      setCurrentDocument(result.data);
      setDocuments((items) => items.map((item) => (item.id === result.data?.id ? result.data : item)));
    }
  }

  async function deleteLibraryDocument(document: UnifiedDocument) {
    const result = await window.bookTrans.deleteDocument(document.id);
    if (result.ok) {
      if (currentDocument?.id === document.id) {
        clearCurrentDocumentState();
      }
      setMessage(`已从文档库移除：${document.title}`);
      await refreshDocumentLibrary();
    } else {
      setMessage(formatIpcError(result));
    }
  }

  async function saveSettings(next: TranslationSettings) {
    const saved = await window.bookTrans.saveSettings(next);
    setSettings(saved);
    setMessage("设置已保存到本机。");
  }

  async function testTranslatorConnection(nextSettings: TranslationSettings) {
    setMessage("正在测试模型连接...");
    const result = await window.bookTrans.testTranslatorConnection(nextSettings);
    setMessage(result.ok && result.data ? result.data.message : formatIpcError(result));
  }

  async function startTranslation() {
    if (!book) {
      setMessage("请先导入 EPUB 或 PDF。");
      return;
    }
    setBusy(true);
    setCanExport(false);
    setValidation(null);
    setExternalValidation(undefined);
    setMessage(isPdf(book) ? "PDF 实验性翻译任务已开始。" : "EPUB 翻译任务已开始。");
    try {
      const result = await window.bookTrans.startTranslation(settings);
      if (!result.ok) {
        setMessage(formatIpcError(result));
        return;
      }
      if (currentDocument) {
        await refreshCurrentDocumentSnapshot(currentDocument.id);
        await refreshTranslationVersions(currentDocument.id);
      }
      setMessage(isPdf(book) ? "PDF 实验性翻译已完成，可用于内部验证。" : "EPUB 翻译已完成，可以导出 EPUB。");
    } catch (error) {
      setMessage(sanitizeRendererError(error instanceof Error ? error.message : "翻译失败。"));
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
        setExternalValidation("externalValidation" in result ? result.externalValidation : undefined);
        setMessage(`已导出：${result.outputPath}`);
      }
    } catch (error) {
      setMessage(sanitizeRendererError(error instanceof Error ? error.message : "导出失败。"));
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
    setMessage(result.ok ? "已保存本书翻译配置。" : result.error ?? "保存本书配置失败。");
  }

  async function resetProfile() {
    const result = await window.bookTrans.deleteCurrentProfile();
    setMessage(result.ok ? "已重置本书翻译配置。" : result.error ?? "重置本书配置失败。");
  }

  async function startAnalysis() {
    if (!currentDocument) {
      setMessage("请先导入或选择文档。");
      return;
    }
    setAnalysisStatus("loading");
    setAnalysisError("");
    const result = await window.bookTrans.startAnalysis(currentDocument.id);
    if (result.ok && result.data) {
      setAnalysis(result.data);
      setAnalysisStatus("success");
      await refreshCurrentDocumentSnapshot(currentDocument.id);
      setMessage("快速分析已完成。");
    } else {
      const error = formatIpcError(result);
      setAnalysisStatus("error");
      setAnalysisError(error);
      setMessage(error);
    }
  }

  async function askDocument() {
    if (!currentDocument || !chatQuestion.trim()) {
      if (currentDocument) {
        setChatError("问题不能为空。");
      }
      return;
    }
    const question = chatQuestion.trim();
    setChatQuestion("");
    setChatStatus("loading");
    setChatError("");
    const result = await window.bookTrans.askDocument(currentDocument.id, question);
    if (result.ok && result.data) {
      const list = await window.bookTrans.listDocumentChat(currentDocument.id);
      setChatMessages(list.ok ? list.data ?? [] : [result.data]);
      setChatStatus("success");
      await refreshCurrentDocumentSnapshot(currentDocument.id);
      setMessage("问答已生成。");
    } else {
      const error = formatIpcError(result);
      setChatStatus("error");
      setChatError(error);
      setMessage(error);
    }
  }

  async function clearDocumentChat() {
    if (!currentDocument) {
      return;
    }
    if (!window.confirm("确定清空这个文档的问答历史吗？此操作不可撤销。")) {
      return;
    }
    const result = await window.bookTrans.clearDocumentChat(currentDocument.id);
    if (result.ok) {
      setChatMessages([]);
      setChatStatus("idle");
      setChatError("");
      setMessage("问答历史已清空。");
      await refreshCurrentDocumentSnapshot(currentDocument.id);
    } else {
      const error = formatIpcError(result);
      setChatStatus("error");
      setChatError(error);
      setMessage(error);
    }
  }

  async function exportUnified(kind: UnifiedExportKind) {
    if (!currentDocument) {
      setMessage("请先导入或选择文档。");
      return;
    }
    setExportingKind(kind);
    setLastKnowledgeExport(null);
    setExportStatus(`正在生成 ${unifiedExportLabel(kind)}...`);
    const result = await runUnifiedExport(currentDocument.id, kind);
    const exportLabel = unifiedExportLabel(kind);
    setExportingKind(null);

    const payload = result.ok ? result.data : null;
    if (payload?.canceled) {
      const canceledMessage = `已取消：${exportLabel}`;
      setLastKnowledgeExport(payload);
      setExportStatus(canceledMessage);
      setMessage(canceledMessage);
      return;
    }

    const nextMessage =
      result.ok && payload?.ok && payload.outputPath
        ? `已导出 ${exportLabel}: ${payload.outputPath}`
        : result.ok && payload?.error
          ? payload.error
          : formatIpcError(result);
    if (payload) {
      setLastKnowledgeExport(payload);
    }
    setExportStatus(nextMessage);
    setMessage(nextMessage);
    await refreshExportHistory();
  }

  async function runUnifiedExport(documentId: string, kind: UnifiedExportKind) {
    switch (kind) {
      case "markdown":
        return window.bookTrans.exportDocumentMarkdown(documentId);
      case "json":
        return window.bookTrans.exportDocumentJson(documentId);
      case "chat":
        return window.bookTrans.exportChatMarkdown(documentId);
      case "analysis":
        return window.bookTrans.exportAnalysisMarkdown(documentId);
      case "study-notes":
      case "research-digest":
      case "presentation-outline":
      case "podcast-prep":
        return window.bookTrans.exportPresetMarkdown(documentId, kind);
      case "full-archive":
        return window.bookTrans.exportFullArchive(documentId);
      case "pptx":
        return window.bookTrans.exportBaselinePptx(documentId);
      case "bilingual-markdown-full":
        return window.bookTrans.exportBilingualMarkdown(documentId, { type: "full" }, selectedTranslationOptions());
      case "bilingual-markdown-selected":
        return window.bookTrans.exportBilingualMarkdown(documentId, selectedBilingualScope(), selectedTranslationOptions());
      case "bilingual-html-full":
        return window.bookTrans.exportBilingualHtml(documentId, { type: "full" }, "side-by-side", selectedTranslationOptions());
      case "bilingual-html-selected":
        return window.bookTrans.exportBilingualHtml(documentId, selectedBilingualScope(), "side-by-side", selectedTranslationOptions());
    }
  }

  function selectedBilingualScope(): BilingualExportScope {
    if (currentDocument?.sourceFormat === "pdf" && typeof selectedPageNumber === "number") {
      return { type: "page", pageNumber: selectedPageNumber };
    }
    if (currentDocument?.sourceFormat === "epub" && selectedChapterId) {
      return { type: "chapter", chapterId: selectedChapterId };
    }
    return { type: "full" };
  }

  function selectedTranslationOptions() {
    if (selectedTranslationVersionId === "none") {
      return { translationResolution: "none" as const };
    }
    if (selectedTranslationVersionId && selectedTranslationVersionId !== "latest") {
      return { translationResolution: "specific" as const, translationVersionId: selectedTranslationVersionId };
    }
    return { translationResolution: "latest" as const };
  }

  async function refreshExportHistory() {
    const result = await window.bookTrans.listExports();
    if (result.ok) {
      setRecentExports((result.data ?? []).filter((item) => item.exportCategory === "knowledge").slice(0, 10));
    }
  }

  async function refreshTranslationVersions(documentId = currentDocument?.id) {
    if (!documentId) {
      setTranslationVersions([]);
      return;
    }
    const result = await window.bookTrans.listTranslationVersions(documentId);
    if (result.ok) {
      setTranslationVersions(result.data ?? []);
    }
  }

  async function translateCurrentSelection() {
    if (!currentDocument) {
      return;
    }
    setTranslationVersionStatus(currentDocument.sourceFormat === "pdf" ? "正在实验性翻译当前页面..." : "正在翻译当前章节...");
    const result =
      currentDocument.sourceFormat === "pdf"
        ? await window.bookTrans.translateCurrentPageExperimental(currentDocument.id, selectedPageNumber ?? 1)
        : await window.bookTrans.translateCurrentChapter(currentDocument.id, selectedChapterId ?? currentDocument.chapters[0]?.id ?? "");
    if (result.ok && result.data) {
      setTranslationVersionStatus(`已保存 translation version: ${result.data.label}`);
      setSelectedTranslationVersionId(result.data.id);
      await refreshTranslationVersions(currentDocument.id);
      await refreshCurrentDocumentSnapshot(currentDocument.id);
    } else {
      setTranslationVersionStatus(formatIpcError(result));
    }
  }

  async function openLastExportFolder(outputPath: string) {
    const result = await window.bookTrans.openExportFolder(outputPath);
    setMessage(result.ok ? "已打开导出文件所在目录。" : result.error ?? "无法打开导出文件所在目录。");
  }

  function acceptExportResult(result: Awaited<ReturnType<typeof window.bookTrans.exportEpub>>) {
    setValidation(result.validation);
    setExternalValidation("externalValidation" in result ? result.externalValidation : undefined);
    setCanExport(true);
  }

  return (
    <main className="app-shell">
      <header className="app-header studio-topbar">
        <div>
          <h1>DocuMuse Studio</h1>
          <p>{currentDocument ? currentDocument.title : "本地 AI 文档阅读、分析、翻译与知识导出工作台"}</p>
        </div>
        <div className={`status-pill ${topStatus.tone}`}>{topStatus.label}</div>
      </header>

      <nav className="app-tabs studio-nav" aria-label="主导航">
        <button className={activeTab === "workspace" ? "active" : ""} onClick={() => setActiveTab("workspace")}>
          Workspace
        </button>
        <button className={activeTab === "tasks" ? "active" : ""} onClick={() => setActiveTab("tasks")}>
          Tasks
        </button>
        <button className={activeTab === "exports" ? "active" : ""} onClick={() => setActiveTab("exports")}>
          Exports
        </button>
        <button className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
          Settings
        </button>
      </nav>

      {activeTab === "workspace" ? (
        <section className="studio-workbench">
          <aside className="left-rail">
            <ImportCard busy={busy} onImport={importBook} />
            <DocumentLibraryPanel documents={documents} currentDocument={currentDocument} onSelect={selectLibraryDocument} onDelete={deleteLibraryDocument} onRefresh={() => void refreshDocumentLibrary()} />
            <TaskSnapshot book={book} progress={progress} percent={percent} message={message} canExport={canExport} validation={validation} onOpenTasks={() => setActiveTab("tasks")} />
          </aside>

          <section className="reader-stage">
            <DocumentStatusSummaryBar document={currentDocument} />
            <DocumentOverview document={currentDocument} selectedChapterId={selectedChapterId} selectedPageNumber={selectedPageNumber} onSelectChapter={setSelectedChapterId} onSelectPage={setSelectedPageNumber} />
          </section>

          <RightContextPanel
            activeTab={contextTab}
            onTab={setContextTab}
            document={currentDocument}
            book={book}
            settings={settings}
            busy={busy}
            glossaryCount={glossaryCount}
            currentDocumentType={currentDocumentType}
            canExportTranslated={canExport}
            translationProgress={progress}
            percent={percent}
            message={message}
            validation={validation}
            externalValidation={externalValidation}
            analysis={analysis}
            analysisStatus={analysisStatus}
            analysisError={analysisError}
            chatMessages={chatMessages}
            chatQuestion={chatQuestion}
            chatStatus={chatStatus}
            chatError={chatError}
            exportStatus={exportStatus}
            exportingKind={exportingKind}
            lastKnowledgeExport={lastKnowledgeExport}
            recentExports={recentExports}
            translationVersions={translationVersions}
            selectedTranslationVersionId={selectedTranslationVersionId}
            translationVersionStatus={translationVersionStatus}
            onSaveSettings={saveSettings}
            onTestConnection={testTranslatorConnection}
            onStartTranslation={startTranslation}
            onCancelTranslation={cancelTranslation}
            onExportTranslated={exportBook}
            onClearJobCache={clearJobCache}
            onSaveProfile={saveProfile}
            onResetProfile={resetProfile}
            onStartAnalysis={startAnalysis}
            onQuestion={setChatQuestion}
            onAsk={askDocument}
            onClearChat={clearDocumentChat}
            onExport={exportUnified}
            onOpenFolder={openLastExportFolder}
            onRefreshHistory={refreshExportHistory}
            onSelectTranslationVersion={setSelectedTranslationVersionId}
            onTranslateSelection={translateCurrentSelection}
            onRefreshTranslationVersions={() => void refreshTranslationVersions()}
            onMessage={setMessage}
          />
        </section>
      ) : null}

      {activeTab === "tasks" ? (
        <section className="single-column">
          <JobManagerPanel settings={settings} busy={busy} onBusy={setBusy} onMessage={setMessage} onExport={acceptExportResult} />
          <ProgressPanel progress={progress} percent={percent} message={message} validation={validation} />
          <ValidationReportPanel report={validation} externalReport={externalValidation} title={getDocumentTitle(book)} onMessage={setMessage} />
        </section>
      ) : null}

      {activeTab === "exports" ? (
        <section className="single-column">
          <ExportHistoryPanel onMessage={setMessage} />
          <ValidationReportPanel report={validation} externalReport={externalValidation} title={getDocumentTitle(book)} onMessage={setMessage} />
        </section>
      ) : null}

      {activeTab === "settings" ? (
        <section className="settings-layout">
          <TranslationSettingsPanel settings={settings} onSave={saveSettings} onTestConnection={testTranslatorConnection} busy={busy} glossaryCount={glossaryCount} defaultOpen />
          <section className="panel">
            <h2>隐私与安全</h2>
            <p className="muted">
              DocuMuse Studio 默认在本地运行，不包含遥测、云同步或账号系统。配置 AI API 后，只有在你主动运行翻译、分析或问答时，相关文本才会发送给你配置的模型服务。文档快照、任务缓存、导出历史和诊断包不会保存 API 密钥。
            </p>
          </section>
        </section>
      ) : null}
    </main>
  );
}

function ImportCard({ busy, onImport }: { busy: boolean; onImport: () => void }) {
  return (
    <section className="panel import-card">
      <p className="section-kicker">导入</p>
      <h2>导入 EPUB 或 PDF</h2>
      <p className="muted">从本地文件开始阅读、分析、问答或翻译。PDF 仅支持可提取文本；OCR 不在当前阶段。</p>
      <button className="primary full" onClick={onImport} disabled={busy}>
        选择文档
      </button>
    </section>
  );
}

function TaskSnapshot({
  book,
  progress,
  percent,
  message,
  canExport,
  validation,
  onOpenTasks
}: {
  book: ImportedDocument | null;
  progress: TranslationProgress;
  percent: number;
  message: string;
  canExport: boolean;
  validation: ValidationReport | PdfValidationReport | null;
  onOpenTasks: () => void;
}) {
  return (
    <section className="panel task-snapshot">
      <div className="panel-title-row">
        <div>
          <p className="section-kicker">最近任务</p>
          <h2>任务状态</h2>
        </div>
        <button onClick={onOpenTasks}>查看任务</button>
      </div>
      <div className="task-meter">
        <span>{progress.status}</span>
        <strong>{percent}%</strong>
      </div>
      <div className="progress-track" aria-label="任务进度">
        <div style={{ width: `${percent}%` }} />
      </div>
      <p className="empty-hint">
        {book ? `${getDocumentTitle(book)} · ${progress.translatedChunks}/${progress.totalChunks || 0} chunks` : "导入 EPUB 或 PDF 开始"}
      </p>
      {message ? <p className="task-message">{message}</p> : null}
      {canExport ? <span className="task-chip">译文可导出</span> : null}
      {validation ? <span className={`task-chip ${validation.status}`}>验证：{validation.status}</span> : null}
    </section>
  );
}

function DocumentLibraryPanel({
  documents,
  currentDocument,
  onSelect,
  onDelete,
  onRefresh
}: {
  documents: UnifiedDocument[];
  currentDocument: UnifiedDocument | null;
  onSelect: (document: UnifiedDocument) => void;
  onDelete: (document: UnifiedDocument) => void;
  onRefresh: () => void;
}) {
  return (
    <section className="panel document-library-panel">
      <div className="panel-title-row">
        <div>
          <p className="section-kicker">文档库</p>
          <h2>本地文档</h2>
        </div>
        <button onClick={onRefresh}>刷新</button>
      </div>
      {documents.length ? (
        <div className="document-library-list">
          {documents.map((document) => (
            <div className={`document-library-row ${currentDocument?.id === document.id ? "active" : ""}`} key={document.id}>
              <button className="document-library-select" onClick={() => onSelect(document)}>
                <strong>{document.title}</strong>
                <span>{formatSourceFormat(document)} · {documentKindLabel(document)} · {document.units.length} units</span>
              </button>
              <button className="document-library-delete" onClick={() => onDelete(document)} title="从文档库删除">
                删除
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-hint">还没有文档。导入 EPUB 或 PDF 开始。</p>
      )}
    </section>
  );
}

function DocumentStatusSummaryBar({ document }: { document: UnifiedDocument | null }) {
  if (!document) {
    return (
      <div className="reader-summary-bar">
        <span>未选择文档</span>
        <span>导入 EPUB 或 PDF 开始</span>
      </div>
    );
  }
  const summary = summarizeDocumentStatus(document);
  const structure = document.sourceFormat === "pdf"
    ? `${document.diagnostics.pageCount ?? getDocumentPages(document).length} pages · ${document.units.length} units`
    : `${document.chapters.length} chapters · ${document.units.length} units`;
  return (
    <div className="reader-summary-bar">
      <span>{summary.sourceFormat}</span>
      <span>{summary.documentKind}</span>
      <span>{structure}</span>
      <span>{summary.analysisStatus}</span>
      <span>{summary.chatCount} chats</span>
      <span>Updated {summary.updatedAt}</span>
    </div>
  );
}

function DocumentOverview({
  document,
  selectedChapterId,
  selectedPageNumber,
  onSelectChapter,
  onSelectPage
}: {
  document: UnifiedDocument | null;
  selectedChapterId: string | null;
  selectedPageNumber: number | null;
  onSelectChapter: (chapterId: string) => void;
  onSelectPage: (pageNumber: number) => void;
}) {
  if (!document) {
    return <EmptyWorkspace />;
  }
  if (document.sourceFormat === "pdf") {
    return <PdfDocumentReader document={document} selectedPageNumber={selectedPageNumber} onSelectPage={onSelectPage} />;
  }
  return <EpubDocumentReader document={document} selectedChapterId={selectedChapterId} onSelectChapter={onSelectChapter} />;
}

function EmptyWorkspace() {
  return (
    <section className="reader-empty">
      <p className="section-kicker">Workspace</p>
      <h2>导入 EPUB 或 PDF 开始</h2>
      <p>文档会进入本地文档库。打开后可以按章节或页面阅读，运行快速分析，围绕内容提问，并导出知识材料。</p>
    </section>
  );
}

function EpubDocumentReader({ document, selectedChapterId, onSelectChapter }: { document: UnifiedDocument; selectedChapterId: string | null; onSelectChapter: (chapterId: string) => void }) {
  const chapters = getDocumentChapters(document);
  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) ?? chapters[0] ?? null;
  const selectedUnits = selectedChapter ? getUnitsForChapter(document, selectedChapter.id) : document.units.slice(0, 1);

  return (
    <section className="reader-card">
      <header className="reader-header">
        <div>
          <p className="section-kicker">阅读</p>
          <h2>{document.title}</h2>
        </div>
        <span className="source-format">EPUB</span>
      </header>

      <div className="reader-controls">
        <label>
          <span>章节</span>
          <select value={selectedChapter?.id ?? ""} onChange={(event) => onSelectChapter(event.target.value)} disabled={!chapters.length}>
            {chapters.map((chapter) => (
              <option value={chapter.id} key={chapter.id}>
                {chapter.order + 1}. {chapter.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <article className="reader-body">
        <h3>{selectedChapter?.title ?? "正文预览"}</h3>
        <p className="muted">{selectedUnits.length} units · {selectedChapter?.sourceHref ?? "source snapshot"}</p>
        {selectedUnits.length ? selectedUnits.map((unit) => (
          <section className="reader-unit" key={unit.id}>
            <details className="source-meta-details">
              <summary>{[unit.chapterTitle, unit.pageNumber ? `Page ${unit.pageNumber}` : undefined, unit.role].filter(Boolean).join(" · ") || "source"}</summary>
              <small>{unit.id}</small>
            </details>
            <p>{unit.text}</p>
          </section>
        )) : <p className="empty-hint">当前章节没有可显示文本。</p>}
      </article>
    </section>
  );
}

function PdfDocumentReader({ document, selectedPageNumber, onSelectPage }: { document: UnifiedDocument; selectedPageNumber: number | null; onSelectPage: (pageNumber: number) => void }) {
  const pages = getDocumentPages(document);
  const activePage = selectedPageNumber ?? pages[0]?.pageNumber ?? null;
  const selectedUnits = getUnitsForPage(document, activePage);

  return (
    <section className="reader-card">
      <header className="reader-header">
        <div>
          <p className="section-kicker">阅读</p>
          <h2>{document.title}</h2>
        </div>
        <span className="source-format">PDF</span>
      </header>

      <div className="reader-controls">
        <label>
          <span>页面</span>
          <select value={activePage ?? ""} onChange={(event) => onSelectPage(Number(event.target.value))} disabled={!pages.length}>
            {pages.map((page) => (
              <option value={page.pageNumber} key={page.pageNumber}>
                Page {page.pageNumber} · {page.unitCount} units
              </option>
            ))}
          </select>
        </label>
      </div>

      <article className="reader-body">
        <h3>{activePage ? `Page ${activePage}` : "正文预览"}</h3>
        <p className="muted">{selectedUnits.length} units · PDF 阅读/分析/问答可用；PDF 翻译仍在 Translation 面板标记为 HOLD。</p>
        {selectedUnits.length ? selectedUnits.map((unit) => {
          const bbox = formatBoundingBox(unit);
          return (
            <section className="reader-unit pdf-paragraph" key={unit.id}>
              <div className="source-meta-row">
                <span>{getUnitSourceHint(unit)}</span>
                <em className="role-badge">{unit.role}</em>
              </div>
              <p>{unit.text}</p>
              <details className="source-meta-details">
                <summary>来源元数据</summary>
                <small className="source-meta">unit {unit.id}{bbox ? ` · bbox ${bbox}` : ""}</small>
              </details>
            </section>
          );
        }) : <p className="empty-hint">当前页面没有可显示文本。扫描版 PDF 需要 OCR，当前阶段不引入 OCR。</p>}
      </article>
    </section>
  );
}

function RightContextPanel(props: RightContextPanelProps) {
  const tabs: Array<{ id: ContextTab; label: string }> = [
    { id: "ai", label: "AI" },
    { id: "export", label: "Export" },
    { id: "translation", label: "Translation" },
    { id: "details", label: "Details" }
  ];

  return (
    <aside className="right-context-panel">
      <nav className="context-tabs" aria-label="上下文面板">
        {tabs.map((tab) => (
          <button className={props.activeTab === tab.id ? "active" : ""} key={tab.id} onClick={() => props.onTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>

      {props.activeTab === "ai" ? (
        <AiAssistantPanel
          document={props.document}
          analysis={props.analysis}
          analysisStatus={props.analysisStatus}
          analysisError={props.analysisError}
          chatMessages={props.chatMessages}
          chatQuestion={props.chatQuestion}
          chatStatus={props.chatStatus}
          chatError={props.chatError}
          onStartAnalysis={props.onStartAnalysis}
          onQuestion={props.onQuestion}
          onAsk={props.onAsk}
          onClearChat={props.onClearChat}
        />
      ) : null}
      {props.activeTab === "export" ? (
        <ExportPanel
          disabled={!props.document}
          hasAnalysis={Boolean(props.analysis)}
          hasChat={props.chatMessages.length > 0}
          status={props.exportStatus}
          exportingKind={props.exportingKind}
          lastResult={props.lastKnowledgeExport}
          recentExports={props.recentExports}
          onExport={props.onExport}
          onOpenFolder={props.onOpenFolder}
          onRefreshHistory={props.onRefreshHistory}
        />
      ) : null}
      {props.activeTab === "translation" ? (
        <TranslationPanel
          book={props.book}
          document={props.document}
          settings={props.settings}
          busy={props.busy}
          glossaryCount={props.glossaryCount}
          currentDocumentType={props.currentDocumentType}
          canExportTranslated={props.canExportTranslated}
          progress={props.translationProgress}
          percent={props.percent}
          message={props.message}
          validation={props.validation}
          externalValidation={props.externalValidation}
          translationVersions={props.translationVersions}
          selectedTranslationVersionId={props.selectedTranslationVersionId}
          translationVersionStatus={props.translationVersionStatus}
          onSaveSettings={props.onSaveSettings}
          onTestConnection={props.onTestConnection}
          onStartTranslation={props.onStartTranslation}
          onCancelTranslation={props.onCancelTranslation}
          onExportTranslated={props.onExportTranslated}
          onClearJobCache={props.onClearJobCache}
          onSaveProfile={props.onSaveProfile}
          onResetProfile={props.onResetProfile}
          onSelectTranslationVersion={props.onSelectTranslationVersion}
          onTranslateSelection={props.onTranslateSelection}
          onRefreshTranslationVersions={props.onRefreshTranslationVersions}
          onMessage={props.onMessage}
        />
      ) : null}
      {props.activeTab === "details" ? (
        <DocumentDetailsPanel document={props.document} validation={props.validation} externalValidation={props.externalValidation} onMessage={props.onMessage} />
      ) : null}
    </aside>
  );
}

interface RightContextPanelProps {
  activeTab: ContextTab;
  onTab: (tab: ContextTab) => void;
  document: UnifiedDocument | null;
  book: ImportedDocument | null;
  settings: TranslationSettings;
  busy: boolean;
  glossaryCount: number;
  currentDocumentType: UnifiedDocument["sourceFormat"] | null;
  canExportTranslated: boolean;
  translationProgress: TranslationProgress;
  percent: number;
  message: string;
  validation: ValidationReport | PdfValidationReport | null;
  externalValidation: ExternalEpubCheckReport | undefined;
  analysis: DocumentAnalysisRecord | null;
  analysisStatus: "idle" | "loading" | "success" | "error";
  analysisError: string;
  chatMessages: DocumentChatMessage[];
  chatQuestion: string;
  chatStatus: "idle" | "loading" | "success" | "error";
  chatError: string;
  exportStatus: string;
  exportingKind: UnifiedExportKind | null;
  lastKnowledgeExport: KnowledgeExportResult | null;
  recentExports: ExportHistoryItem[];
  translationVersions: TranslationVersionSummary[];
  selectedTranslationVersionId: string;
  translationVersionStatus: string;
  onSaveSettings: (settings: TranslationSettings) => void;
  onTestConnection: (settings: TranslationSettings) => void;
  onStartTranslation: () => void;
  onCancelTranslation: () => void;
  onExportTranslated: () => void;
  onClearJobCache: () => void;
  onSaveProfile: () => void;
  onResetProfile: () => void;
  onStartAnalysis: () => void;
  onQuestion: (value: string) => void;
  onAsk: () => void;
  onClearChat: () => void;
  onExport: (kind: UnifiedExportKind) => void;
  onOpenFolder: (outputPath: string) => void;
  onRefreshHistory: () => void;
  onSelectTranslationVersion: (versionId: string) => void;
  onTranslateSelection: () => void;
  onRefreshTranslationVersions: () => void;
  onMessage: (message: string) => void;
}

function AiAssistantPanel({
  document,
  analysis,
  analysisStatus,
  analysisError,
  chatMessages,
  chatQuestion,
  chatStatus,
  chatError,
  onStartAnalysis,
  onQuestion,
  onAsk,
  onClearChat
}: {
  document: UnifiedDocument | null;
  analysis: DocumentAnalysisRecord | null;
  analysisStatus: "idle" | "loading" | "success" | "error";
  analysisError: string;
  chatMessages: DocumentChatMessage[];
  chatQuestion: string;
  chatStatus: "idle" | "loading" | "success" | "error";
  chatError: string;
  onStartAnalysis: () => void;
  onQuestion: (value: string) => void;
  onAsk: () => void;
  onClearChat: () => void;
}) {
  return (
    <div className="context-stack">
      <AnalysisPanel analysis={analysis} analysisState={document?.analysisState} status={analysisStatus} error={analysisError} onStart={onStartAnalysis} disabled={!document} />
      <ChatPanel messages={chatMessages} question={chatQuestion} status={chatStatus} error={chatError} onQuestion={onQuestion} onAsk={onAsk} onClear={onClearChat} disabled={!document} />
    </div>
  );
}

function AnalysisPanel({
  analysis,
  analysisState,
  status,
  error,
  onStart,
  disabled
}: {
  analysis: DocumentAnalysisRecord | null;
  analysisState: AnalysisState | undefined;
  status: "idle" | "loading" | "success" | "error";
  error: string;
  onStart: () => void;
  disabled: boolean;
}) {
  return (
    <section className="context-card">
      <div className="panel-title-row">
        <div>
          <p className="section-kicker">AI</p>
          <h2>快速分析</h2>
        </div>
        <button className="primary" onClick={onStart} disabled={disabled || status === "loading"}>
          {status === "loading" ? "分析中" : "快速分析"}
        </button>
      </div>
      <p className="empty-hint">{analysisStateLabel(analysisState)}{analysisState?.updatedAt ? ` · ${formatDateTime(analysisState.updatedAt)}` : ""}</p>
      {status === "error" ? <p className="inline-error">{error}</p> : null}
      {analysisState?.status === "failed" && analysisState.error ? <p className="inline-error">{analysisState.error}</p> : null}
      {analysis ? (
        <div className="analysis-block">
          <strong>{analysis.oneSentenceSummary}</strong>
          <p>{analysis.summary}</p>
          <h3>关键点</h3>
          <ul>{analysis.keyPoints.slice(0, 6).map((point) => <li key={point}>{point}</li>)}</ul>
          <h3>关键词</h3>
          <div className="keyword-list">{analysis.keywords.length ? analysis.keywords.map((keyword) => <span key={keyword}>{keyword}</span>) : <span>None</span>}</div>
          <small>{analysis.documentKind ?? "unknown"} · {analysis.language ?? "unknown"} · {formatDateTime(analysis.analyzedAt)}</small>
        </div>
      ) : (
        <p className="empty-hint">尚未分析。可以先运行快速分析，让阅读、问答和导出材料有更清楚的上下文。</p>
      )}
    </section>
  );
}

function ChatPanel({
  messages,
  question,
  status,
  error,
  onQuestion,
  onAsk,
  onClear,
  disabled
}: {
  messages: DocumentChatMessage[];
  question: string;
  status: "idle" | "loading" | "success" | "error";
  error: string;
  onQuestion: (value: string) => void;
  onAsk: () => void;
  onClear: () => void;
  disabled: boolean;
}) {
  return (
    <section className="context-card">
      <div className="panel-title-row">
        <div>
          <p className="section-kicker">问答</p>
          <h2>文档助手</h2>
        </div>
        <button onClick={onClear} disabled={disabled || !messages.length || status === "loading"}>
          清空
        </button>
      </div>
      <div className="qa-form">
        <input value={question} onChange={(event) => onQuestion(event.target.value)} placeholder="例如：这篇文档最重要的结论是什么？" disabled={disabled} />
        <button className="primary" onClick={onAsk} disabled={disabled || !question.trim() || status === "loading"}>
          {status === "loading" ? "检索中" : "提问"}
        </button>
      </div>
      {error ? <p className="inline-error">{error}</p> : null}
      {messages.length ? (
        <div className="chat-thread">
          {messages.map((message) => (
            <article className={`chat-message ${message.role}`} key={message.id}>
              <strong>{message.role === "user" ? "你" : "DocuMuse Studio"}</strong>
              <p>{message.content}</p>
              {message.sources?.length ? (
                <div className="chat-sources">
                  <span>Sources</span>
                  {message.sources.map((source) => (
                    <small className="source-card" key={`${message.id}-${source.unitId}`} title={formatChatSource(source)}>
                      {formatChatSource(source)}
                    </small>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-hint">还没有问答。可以问“这份文档讲了什么？”或“有哪些值得导出的观点？”。</p>
      )}
    </section>
  );
}

function ExportPanel({
  disabled,
  hasAnalysis,
  hasChat,
  status,
  exportingKind,
  lastResult,
  recentExports,
  onExport,
  onOpenFolder,
  onRefreshHistory
}: {
  disabled: boolean;
  hasAnalysis: boolean;
  hasChat: boolean;
  status: string;
  exportingKind: UnifiedExportKind | null;
  lastResult: KnowledgeExportResult | null;
  recentExports: ExportHistoryItem[];
  onExport: (kind: UnifiedExportKind) => void;
  onOpenFolder: (outputPath: string) => void;
  onRefreshHistory: () => void;
}) {
  const groups: Array<{ title: string; description: string; items: UnifiedExportKind[] }> = [
    { title: "基础导出", description: "保留原文结构与本地知识状态。", items: ["markdown", "json", "chat", "analysis"] },
    { title: "生成材料", description: "把分析和问答整理成可继续编辑的材料。", items: ["study-notes", "research-digest", "presentation-outline", "podcast-prep"] },
    { title: "双语与归档", description: "使用已选择 translation version；无译文时显示占位。", items: ["bilingual-markdown-full", "bilingual-markdown-selected", "bilingual-html-full", "bilingual-html-selected", "full-archive", "pptx"] }
  ];
  return (
    <section className="context-card">
      <p className="section-kicker">导出</p>
      <h2>生成材料</h2>
      <p className="empty-hint">导出能力按用途分组，不再占据阅读主界面。</p>
      <div className="export-groups">
        {groups.map((group) => (
          <details className="export-group" key={group.title} open={group.title === "基础导出"}>
            <summary>
              <strong>{group.title}</strong>
              <span>{group.description}</span>
            </summary>
            <div className="export-action-grid">
              {group.items.map((kind) => (
                <button key={kind} onClick={() => onExport(kind)} disabled={disabled || (kind === "chat" && !hasChat) || (kind === "analysis" && !hasAnalysis)}>
                  {exportingKind === kind ? "生成中..." : unifiedExportLabel(kind)}
                </button>
              ))}
            </div>
          </details>
        ))}
      </div>
      {status ? <p className="export-status">{status}</p> : null}
      {lastResult?.outputPath ? (
        <div className={`export-result-card ${lastResult.validation?.status ?? "pass"}`}>
          <strong>{unifiedExportLabelFromHistory(lastResult.exportKind)}</strong>
          <span>{lastResult.outputPath}</span>
          <small>{lastResult.validation?.summary ?? "Export saved."}</small>
          <button onClick={() => onOpenFolder(lastResult.outputPath ?? "")}>打开所在目录</button>
        </div>
      ) : lastResult?.canceled ? (
        <div className="export-result-card canceled">
          <strong>已取消导出</strong>
          <span>{unifiedExportLabelFromHistory(lastResult.exportKind)}</span>
        </div>
      ) : null}
      <div className="compact-history">
        <div className="panel-title-row">
          <strong>最近导出</strong>
          <button onClick={onRefreshHistory}>刷新</button>
        </div>
        {recentExports.length ? recentExports.map((item) => (
          <div className="compact-history-row" key={item.id}>
            <div>
              <strong>{unifiedExportLabelFromHistory(item.exportKind)}</strong>
              <span>{formatDateTime(item.createdAt)} · {item.validationStatus}</span>
              <small>{item.outputPath ?? item.outputEpubPath}</small>
            </div>
            <button onClick={() => onOpenFolder(item.outputPath ?? item.outputEpubPath)} disabled={item.fileExists === false}>
              打开
            </button>
          </div>
        )) : <p className="empty-hint">暂无导出记录。</p>}
      </div>
    </section>
  );
}

function TranslationPanel({
  book,
  document,
  settings,
  busy,
  glossaryCount,
  currentDocumentType,
  canExportTranslated,
  progress,
  percent,
  message,
  validation,
  externalValidation,
  translationVersions,
  selectedTranslationVersionId,
  translationVersionStatus,
  onSaveSettings,
  onTestConnection,
  onStartTranslation,
  onCancelTranslation,
  onExportTranslated,
  onClearJobCache,
  onSaveProfile,
  onResetProfile,
  onSelectTranslationVersion,
  onTranslateSelection,
  onRefreshTranslationVersions,
  onMessage
}: {
  book: ImportedDocument | null;
  document: UnifiedDocument | null;
  settings: TranslationSettings;
  busy: boolean;
  glossaryCount: number;
  currentDocumentType: UnifiedDocument["sourceFormat"] | null;
  canExportTranslated: boolean;
  progress: TranslationProgress;
  percent: number;
  message: string;
  validation: ValidationReport | PdfValidationReport | null;
  externalValidation: ExternalEpubCheckReport | undefined;
  translationVersions: TranslationVersionSummary[];
  selectedTranslationVersionId: string;
  translationVersionStatus: string;
  onSaveSettings: (settings: TranslationSettings) => void;
  onTestConnection: (settings: TranslationSettings) => void;
  onStartTranslation: () => void;
  onCancelTranslation: () => void;
  onExportTranslated: () => void;
  onClearJobCache: () => void;
  onSaveProfile: () => void;
  onResetProfile: () => void;
  onSelectTranslationVersion: (versionId: string) => void;
  onTranslateSelection: () => void;
  onRefreshTranslationVersions: () => void;
  onMessage: (message: string) => void;
}) {
  const isPdfDocument = document?.sourceFormat === "pdf" || currentDocumentType === "pdf";
  return (
    <div className="context-stack">
      <section className="context-card">
        <p className="section-kicker">Translation</p>
        <h2>翻译任务</h2>
        {isPdfDocument ? (
          <div className="pdf-hold-notice">
            <strong>PDF translation: Experimental / HOLD</strong>
            <span>PDF 阅读、分析、问答和知识导出可用；PDF 翻译不是 public release 能力。</span>
          </div>
        ) : null}
        <div className="translation-actions">
          <button className={!isPdfDocument ? "primary" : ""} onClick={onStartTranslation} disabled={!book || busy || isPdfDocument}>
            EPUB 全书翻译
          </button>
          <button onClick={onTranslateSelection} disabled={!document || busy}>
            {isPdfDocument ? "实验性翻译当前页" : "翻译当前章节"}
          </button>
          <button onClick={onCancelTranslation} disabled={!busy}>
            取消任务
          </button>
          <button onClick={onExportTranslated} disabled={!canExportTranslated || busy}>
            {isPdfDocument ? "导出实验 PDF" : "导出译后 EPUB"}
          </button>
        </div>
        <ProgressMini progress={progress} percent={percent} message={message} />
        {validation ? <ValidationReportPanel report={validation} externalReport={externalValidation} title={getDocumentTitle(book)} onMessage={onMessage} /> : null}
      </section>

      <section className="context-card">
        <div className="panel-title-row">
          <div>
            <p className="section-kicker">Versions</p>
            <h2>Translation versions</h2>
          </div>
          <button onClick={onRefreshTranslationVersions} disabled={!document}>刷新</button>
        </div>
        <select value={selectedTranslationVersionId} onChange={(event) => onSelectTranslationVersion(event.target.value)} disabled={!document}>
          <option value="latest">Latest matching translation</option>
          <option value="none">No translation / placeholders</option>
          {translationVersions.map((version) => (
            <option value={version.id} key={version.id}>
              {version.label} · {version.translatedUnitCount}/{version.totalUnitCount}
            </option>
          ))}
        </select>
        {translationVersionStatus ? <p className="export-status">{translationVersionStatus}</p> : null}
        {translationVersions.length ? (
          <div className="translation-version-list">
            {translationVersions.slice(0, 5).map((version) => (
              <div className="translation-version-row" key={version.id}>
                <strong>{version.label}</strong>
                <span>{formatTranslationScopeLabel(version.scope)} · {version.status} · {version.translatedUnitCount}/{version.totalUnitCount}</span>
                <small>{version.source}{version.model ? ` · ${version.model}` : ""} · {formatDateTime(version.updatedAt)}</small>
              </div>
            ))}
          </div>
        ) : <p className="empty-hint">暂无译文版本。双语导出会使用明确的“暂无译文”占位。</p>}
      </section>

      <details className="context-card settings-panel-lite">
        <summary>翻译设置</summary>
        <TranslationSettingsPanel settings={settings} onSave={onSaveSettings} onTestConnection={onTestConnection} busy={busy} glossaryCount={glossaryCount} />
        <div className="translation-secondary-actions">
          <button onClick={onSaveProfile} disabled={!book || busy || isPdfDocument}>保存本书配置</button>
          <button onClick={onResetProfile} disabled={!book || busy || isPdfDocument}>重置本书配置</button>
          <button onClick={onClearJobCache} disabled={busy}>清理任务缓存</button>
        </div>
      </details>
    </div>
  );
}

function ProgressMini({ progress, percent, message }: { progress: TranslationProgress; percent: number; message: string }) {
  return (
    <div className="progress-mini">
      <div className="task-meter">
        <span>{progress.status}</span>
        <strong>{percent}%</strong>
      </div>
      <div className="progress-track" aria-label="翻译任务进度">
        <div style={{ width: `${percent}%` }} />
      </div>
      <p className="empty-hint">{progress.translatedChunks}/{progress.totalChunks || 0} chunks{progress.currentChapter ? ` · ${progress.currentChapter}` : ""}</p>
      {message ? <p className="task-message">{message}</p> : null}
    </div>
  );
}

function DocumentDetailsPanel({
  document,
  validation,
  externalValidation,
  onMessage
}: {
  document: UnifiedDocument | null;
  validation: ValidationReport | PdfValidationReport | null;
  externalValidation: ExternalEpubCheckReport | undefined;
  onMessage: (message: string) => void;
}) {
  if (!document) {
    return (
      <section className="context-card">
        <p className="section-kicker">Details</p>
        <h2>文档详情</h2>
        <p className="empty-hint">选择文档后显示文件名、来源路径、解析状态和 diagnostics。</p>
      </section>
    );
  }
  const sourceFileName = document.sourcePath.replace(/\\/g, "/").split("/").pop() ?? document.sourcePath;
  const pages = getDocumentPages(document);
  const hasBbox = document.units.some((unit) => unit.bbox);
  return (
    <section className="context-card">
      <p className="section-kicker">Details</p>
      <h2>文档详情</h2>
      <dl className="details-list">
        <div><dt>文件名</dt><dd>{sourceFileName}</dd></div>
        <div><dt>来源路径</dt><dd>{document.sourcePath}</dd></div>
        <div><dt>格式</dt><dd>{formatSourceFormat(document)}</dd></div>
        <div><dt>文档类型</dt><dd>{documentKindLabel(document)}</dd></div>
        <div><dt>章节/页面</dt><dd>{document.sourceFormat === "pdf" ? `${pages.length || document.diagnostics.pageCount || 0} pages` : `${document.chapters.length} chapters`}</dd></div>
        <div><dt>Units</dt><dd>{document.units.length}</dd></div>
        <div><dt>Parser</dt><dd>{document.diagnostics.parser}</dd></div>
        <div><dt>Layout</dt><dd>{hasBbox ? "bbox available" : "limited positions"}</dd></div>
        <div><dt>Updated</dt><dd>{formatDateTime(document.updatedAt)}</dd></div>
      </dl>
      {document.outline.length ? (
        <details className="details-block">
          <summary>Outline</summary>
          <OutlineList nodes={document.outline.slice(0, 12)} />
        </details>
      ) : null}
      <details className="details-block">
        <summary>Parse diagnostics</summary>
        <pre>{JSON.stringify(document.diagnostics, null, 2)}</pre>
      </details>
      {validation ? <ValidationReportPanel report={validation} externalReport={externalValidation} title={document.title} onMessage={onMessage} /> : null}
    </section>
  );
}

function OutlineList({ nodes }: { nodes: UnifiedDocumentOutlineNode[] }) {
  return (
    <ul>
      {nodes.map((node) => (
        <li key={node.id}>
          {node.title}
          {node.children.length ? <OutlineList nodes={node.children.slice(0, 4)} /> : null}
        </li>
      ))}
    </ul>
  );
}

function isPdf(document: ImportedDocument | null): document is ImportedPdfDocument {
  return document?.type === "pdf";
}

function getDocumentTitle(document: ImportedDocument | null): string {
  if (!document) {
    return "DocuMuse Studio";
  }
  return isPdf(document) ? document.title ?? "PDF" : document.metadata.title;
}

function getImportedSourcePath(document: ImportedDocument): string {
  return document.filePath;
}

function formatSourceFormat(document: UnifiedDocument): string {
  return document.sourceFormat.toUpperCase();
}

function documentKindLabel(document: UnifiedDocument): string {
  return document.documentKind?.kind ?? "unknown";
}

function unifiedExportLabel(kind: UnifiedExportKind): string {
  switch (kind) {
    case "study-notes":
      return "Study Notes";
    case "research-digest":
      return "Research Digest";
    case "presentation-outline":
      return "Presentation Outline";
    case "podcast-prep":
      return "Podcast Prep";
    case "full-archive":
      return "Full Archive ZIP";
    case "pptx":
      return "Baseline PPTX";
    case "bilingual-markdown-full":
      return "Bilingual Markdown · Full";
    case "bilingual-markdown-selected":
      return "Bilingual Markdown · Current";
    case "bilingual-html-full":
      return "Bilingual HTML · Full";
    case "bilingual-html-selected":
      return "Bilingual HTML · Current";
    default:
      return exportKindLabel(kind);
  }
}

function unifiedExportLabelFromHistory(kind: ExportHistoryItem["exportKind"]): string {
  switch (kind) {
    case "document-markdown":
      return "Document Markdown";
    case "document-json":
      return "Document JSON";
    case "chat-markdown":
      return "Chat Markdown";
    case "analysis-markdown":
      return "Analysis Markdown";
    case "study-notes":
      return "Study Notes";
    case "research-digest":
      return "Research Digest";
    case "presentation-outline":
      return "Presentation Outline";
    case "podcast-prep":
      return "Podcast Prep";
    case "full-archive":
      return "Full Archive ZIP";
    case "pptx":
      return "Baseline PPTX";
    case "bilingual-markdown":
      return "Bilingual Markdown";
    case "bilingual-markdown-selected":
      return "Bilingual Markdown Selected";
    case "bilingual-html":
      return "Bilingual HTML";
    case "bilingual-html-selected":
      return "Bilingual HTML Selected";
    case "translated-pdf":
      return "Translated PDF";
    case "translated-epub":
      return "Translated EPUB";
    default:
      return "Export";
  }
}

function formatTranslationScopeLabel(scope: TranslationVersionSummary["scope"]): string {
  if (scope.type === "chapter") {
    return `chapter:${scope.chapterId ?? "unknown"}`;
  }
  if (scope.type === "page") {
    return `page:${scope.pageNumber ?? "unknown"}`;
  }
  if (scope.type === "units") {
    return `units:${scope.unitIds?.length ?? 0}`;
  }
  return "full";
}

function analysisStateLabel(state: AnalysisState | undefined): string {
  switch (state?.status) {
    case "completed":
      return "已分析";
    case "running":
      return "分析中";
    case "failed":
      return "分析失败";
    default:
      return "未分析";
  }
}

function formatDateTime(value: string | undefined): string {
  return formatDocumentUpdatedAt(value);
}

function getTopStatus({
  document,
  busy,
  progressStatus,
  validationStatus
}: {
  document: UnifiedDocument | null;
  busy: boolean;
  progressStatus: TranslationProgress["status"];
  validationStatus?: ValidationReport["status"];
}): { label: string; tone: string } {
  if (validationStatus === "fail" || progressStatus === "failed") {
    return { label: "需要处理", tone: "danger" };
  }
  if (busy || progressStatus === "translating") {
    return { label: "任务运行中", tone: "active" };
  }
  if (document) {
    return { label: "工作区就绪", tone: "ready" };
  }
  return { label: "等待导入", tone: "idle" };
}
