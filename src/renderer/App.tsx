import { useEffect, useMemo, useState } from "react";
import type { DocumentAnalysisRecord } from "../main/analysis/analysisService.js";
import type { DocumentChatMessage } from "../main/chat/documentChatService.js";
import type { AnalysisState, UnifiedDocument, UnifiedDocumentOutlineNode } from "../shared/documentModel.js";
import { formatBoundingBox, getDocumentChapters, getDocumentPages, getUnitSourceHint, getUnitsForChapter, getUnitsForPage } from "../shared/documentReaderUtils.js";
import type { ExternalEpubCheckReport, ImportedBook, ImportedDocument, ImportedPdfDocument, PdfValidationReport, TranslationProgress, TranslationSettings, ValidationReport } from "../shared/types.js";
import { BookInfoCard } from "./components/BookInfoCard.js";
import { ChapterList } from "./components/ChapterList.js";
import { ExportHistoryPanel } from "./components/ExportHistoryPanel.js";
import { ImportPanel } from "./components/ImportPanel.js";
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
  const [activeTab, setActiveTab] = useState<"translate" | "jobs" | "exports" | "settings">("translate");
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

  useEffect(() => {
    void window.bookTrans.getSettings().then(setSettings);
    void refreshDocumentLibrary();
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
    if (!imported) {
      return;
    }
    setBook(imported);
    setProgress(emptyProgress);
    setCanExport(false);
    setValidation(null);
    setExternalValidation(undefined);
    if (isEpub(imported) && imported.loadedProfile) {
      const saved = await window.bookTrans.getSettings();
      setSettings(saved);
      setMessage(`已导入《${imported.metadata.title}》，并自动载入本书的翻译配置。`);
    } else if (isPdf(imported)) {
      setMessage(imported.isScannedLike ? "已导入 PDF，但它可能是扫描版或图片型 PDF，当前版本暂不支持 OCR。" : `已导入 PDF：${imported.title ?? imported.filePath}`);
    } else {
      setMessage(`已导入《${imported.metadata.title}》。`);
    }
    await refreshDocumentLibrary(imported);
  }

  async function refreshDocumentLibrary(imported?: ImportedDocument) {
    const result = await window.bookTrans.listDocuments();
    if (!result.ok || !result.data) {
      return;
    }
    setDocuments(result.data);
    if (!result.data.length) {
      setCurrentDocument(null);
      setSelectedChapterId(null);
      setSelectedPageNumber(null);
      setAnalysis(null);
      setAnalysisStatus("idle");
      setAnalysisError("");
      setChatMessages([]);
      setChatStatus("idle");
      setChatError("");
      return;
    }
    const sourcePath = imported ? getImportedSourcePath(imported) : currentDocument?.sourcePath;
    const selected = sourcePath ? result.data.find((document) => document.sourcePath === sourcePath) : result.data[0];
    if (selected) {
      await loadUnifiedDocument(selected);
    }
  }

  async function selectLibraryDocument(document: UnifiedDocument) {
    await loadUnifiedDocument(document);
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
        setCurrentDocument(null);
        setSelectedChapterId(null);
        setSelectedPageNumber(null);
        setAnalysis(null);
        setAnalysisStatus("idle");
        setAnalysisError("");
        setChatMessages([]);
        setChatStatus("idle");
        setChatError("");
      }
      setMessage(`已删除文档快照：${document.title}`);
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
    setMessage(isPdf(book) ? "PDF 翻译任务已开始。" : "EPUB 翻译任务已开始。");
    try {
      const result = await window.bookTrans.startTranslation(settings);
      if (!result.ok) {
        setMessage(formatIpcError(result));
        return;
      }
      setMessage(isPdf(book) ? "PDF 翻译已完成，可以导出 PDF。" : "EPUB 翻译已完成，可以导出 EPUB。");
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
    setMessage(result.ok ? "已保存本书配置。" : result.error ?? "保存本书配置失败。");
  }

  async function resetProfile() {
    const result = await window.bookTrans.deleteCurrentProfile();
    setMessage(result.ok ? "已重置本书配置。" : result.error ?? "重置本书配置失败。");
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
      setMessage("分析已完成。");
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

  async function exportUnified(kind: "markdown" | "json" | "chat" | "analysis") {
    if (!currentDocument) {
      setMessage("请先导入或选择文档。");
      return;
    }
    const result =
      kind === "markdown"
        ? await window.bookTrans.exportDocumentMarkdown(currentDocument.id)
        : kind === "json"
          ? await window.bookTrans.exportDocumentJson(currentDocument.id)
          : kind === "chat"
            ? await window.bookTrans.exportChatMarkdown(currentDocument.id)
            : await window.bookTrans.exportAnalysisMarkdown(currentDocument.id);
    const exportLabel = kind === "markdown" ? "Markdown" : kind === "json" ? "JSON" : kind === "chat" ? "Chat Markdown" : "Analysis Markdown";
    const nextMessage = result.ok ? (result.data ? `已导出 ${exportLabel}：${result.data}` : `已取消导出 ${exportLabel}。`) : formatIpcError(result);
    setExportStatus(nextMessage);
    setMessage(nextMessage);
  }

  function acceptExportResult(result: Awaited<ReturnType<typeof window.bookTrans.exportEpub>>) {
    setValidation(result.validation);
    setExternalValidation("externalValidation" in result ? result.externalValidation : undefined);
    setCanExport(true);
  }

  const topStatus = getTopStatus({ book: Boolean(book), busy, canExport, progressStatus: progress.status, validationStatus: validation?.status });
  const glossaryCount = settings.glossary?.split(/\r?\n/).filter((line) => line.trim()).length ?? 0;
  const currentDocumentType = isPdf(book) ? "pdf" : book ? "epub" : null;

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>DocuMuse Studio</h1>
          <p>本地优先的 AI 阅读、翻译、分析与知识导出桌面工作台</p>
        </div>
        <div className={`status-pill ${topStatus.tone}`}>{topStatus.label}</div>
      </header>

      <nav className="app-tabs" aria-label="主导航">
        <button className={activeTab === "translate" ? "active" : ""} title="翻译工作台" onClick={() => setActiveTab("translate")}>
          阅读
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
              <DocumentLibraryPanel documents={documents} currentDocument={currentDocument} onSelect={selectLibraryDocument} onDelete={deleteLibraryDocument} onRefresh={() => void refreshDocumentLibrary()} />
              <TranslationSettingsPanel settings={settings} onSave={saveSettings} onTestConnection={testTranslatorConnection} busy={busy} glossaryCount={glossaryCount} />
              <div className="actions">
                <button className="primary" onClick={startTranslation} disabled={!book || busy || (isPdf(book) && book.isScannedLike)}>
                  {currentDocumentType === "pdf" ? "开始翻译 PDF" : "开始翻译 EPUB"}
                </button>
                <button onClick={cancelTranslation} disabled={!busy}>
                  取消任务
                </button>
                <button className={canExport ? "primary" : ""} onClick={exportBook} disabled={!canExport || busy}>
                  {currentDocumentType === "pdf" ? "导出 PDF" : "导出 EPUB"}
                </button>
                <button onClick={clearJobCache} disabled={busy}>
                  清理任务缓存
                </button>
                <button onClick={saveProfile} disabled={!book || busy || isPdf(book)}>
                  保存本书配置
                </button>
                <button onClick={resetProfile} disabled={!book || busy || isPdf(book)}>
                  重置本书配置
                </button>
              </div>
              <AnalysisPanel analysis={analysis} analysisState={currentDocument?.analysisState} status={analysisStatus} error={analysisError} onStart={startAnalysis} disabled={!currentDocument} />
              <ChatPanel messages={chatMessages} question={chatQuestion} status={chatStatus} error={chatError} onQuestion={setChatQuestion} onAsk={askDocument} onClear={clearDocumentChat} disabled={!currentDocument} />
              <ExportPanel disabled={!currentDocument} hasAnalysis={Boolean(analysis)} hasChat={chatMessages.length > 0} status={exportStatus} onExport={exportUnified} />
            </aside>

            <section className="content">
              <DocumentOverview
                document={currentDocument}
                selectedChapterId={selectedChapterId}
                selectedPageNumber={selectedPageNumber}
                onSelectChapter={setSelectedChapterId}
                onSelectPage={setSelectedPageNumber}
              />
              <BookInfoCard book={book} />
              <ChapterList document={book} progress={progress.chapters} />
              <ProgressPanel progress={progress} percent={percent} message={message} validation={validation} />
              <ValidationReportPanel report={validation} externalReport={externalValidation} title={getDocumentTitle(book)} onMessage={setMessage} />
            </section>
          </section>
        </section>
      ) : null}

      {activeTab === "jobs" ? (
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
  const steps = ["导入文件", "配置翻译", "开始翻译", "导出结果"];
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
          <h2>当前导入文档</h2>
        </div>
        <div className="library-header-actions">
          <button onClick={onRefresh}>刷新</button>
          <span className="mini-count">{documents.length}</span>
        </div>
      </div>
      <div className="document-library-list">
        {documents.length ? (
          documents.map((document) => (
            <article className={`document-library-row ${currentDocument?.id === document.id ? "active" : ""}`} key={document.id}>
              <button className="document-library-select" onClick={() => onSelect(document)}>
                <strong>{document.title}</strong>
                <span>
                  {document.sourceFormat.toUpperCase()} · {documentKindLabel(document)} · {document.units.length} units
                </span>
              </button>
              <button className="document-library-delete" onClick={() => onDelete(document)} title="删除文档快照">
                删除
              </button>
            </article>
          ))
        ) : (
          <p className="empty-hint">导入 PDF / EPUB 后会在这里出现统一文档快照。</p>
        )}
      </div>
    </section>
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
    return (
      <section className="panel reading-panel">
        <p className="section-kicker">阅读</p>
        <h2>文档概览</h2>
        <p className="empty-hint">导入或选择文档后，这里会显示文档类型、解析结构、来源定位和原文片段。</p>
      </section>
    );
  }
  if (document.sourceFormat === "pdf") {
    return <PdfDocumentReader document={document} selectedPageNumber={selectedPageNumber} onSelectPage={onSelectPage} />;
  }
  const chapters = getDocumentChapters(document);
  const selectedChapter = chapters.find((chapter) => chapter.id === selectedChapterId) ?? chapters[0] ?? null;
  const selectedUnits = selectedChapter ? getUnitsForChapter(document, selectedChapter.id) : document.units.slice(0, 1);
  const sourceFileName = document.sourcePath.replace(/\\/g, "/").split("/").pop() ?? document.sourcePath;
  return (
    <section className="panel reading-panel">
      <p className="section-kicker">阅读</p>
      <div className="panel-title-row">
        <div>
          <h2>{document.title}</h2>
          <p className="muted">文件名：{sourceFileName}</p>
          <p className="muted">来源定位：{document.sourcePath}</p>
        </div>
        <span className="source-format">{document.sourceFormat.toUpperCase()}</span>
      </div>
      <dl className="structure-grid">
        <div>
          <dt>文档类型</dt>
          <dd>{documentKindLabel(document)}</dd>
        </div>
        <div>
          <dt>解析结构</dt>
          <dd>
            {chapters.length} chapters / {document.units.length} units
          </dd>
        </div>
        <div>
          <dt>来源定位</dt>
          <dd>{document.diagnostics.pageCount ? `${document.diagnostics.pageCount} pages` : document.sourceFormat.toUpperCase()}</dd>
        </div>
        <div>
          <dt>分析状态</dt>
          <dd>{analysisStateLabel(document.analysisState)}</dd>
        </div>
        <div>
          <dt>问答条数</dt>
          <dd>{document.chatMessages?.length ?? 0}</dd>
        </div>
        <div>
          <dt>最后更新</dt>
          <dd>{formatDateTime(document.updatedAt)}</dd>
        </div>
      </dl>
      <div className="outline-preview">
        <h3>章节列表</h3>
        {chapters.length ? (
          <div className="reader-chapter-list">
            {chapters.map((chapter) => (
              <button className={selectedChapter?.id === chapter.id ? "active" : ""} key={chapter.id} onClick={() => onSelectChapter(chapter.id)}>
                <span>{chapter.order + 1}</span>
                <strong>{chapter.title}</strong>
              </button>
            ))}
          </div>
        ) : document.outline.length ? (
          <OutlineList nodes={document.outline.slice(0, 8)} />
        ) : (
          <p className="empty-hint">暂无章节。</p>
        )}
      </div>
      <div className="chapter-reader">
        <div className="panel-title-row">
          <div>
            <h3>{selectedChapter?.title ?? "正文预览"}</h3>
            <p className="muted">
              {selectedUnits.length} units · {selectedChapter?.sourceHref ?? "source snapshot"}
            </p>
          </div>
        </div>
        {selectedUnits.map((unit) => (
          <article key={unit.id}>
            <span>{[unit.chapterTitle, unit.pageNumber ? `Page ${unit.pageNumber}` : undefined, unit.sourceHref].filter(Boolean).join(" · ") || unit.role}</span>
            <p>{unit.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PdfDocumentReader({ document, selectedPageNumber, onSelectPage }: { document: UnifiedDocument; selectedPageNumber: number | null; onSelectPage: (pageNumber: number) => void }) {
  const pages = getDocumentPages(document);
  const activePage = selectedPageNumber ?? pages[0]?.pageNumber ?? null;
  const selectedUnits = getUnitsForPage(document, activePage);
  const sourceFileName = document.sourcePath.replace(/\\/g, "/").split("/").pop() ?? document.sourcePath;
  const textStatus = document.diagnostics.isScannedLike ? "text-sparse / scanned-like" : "text extracted";
  const layoutStatus = document.units.some((unit) => unit.bbox) ? "layout-aware blocks available" : "paragraph positions limited";
  return (
    <section className="panel reading-panel">
      <p className="section-kicker">PDF 阅读</p>
      <div className="panel-title-row">
        <div>
          <h2>{document.title}</h2>
          <p className="muted">文件名：{sourceFileName}</p>
          <p className="muted">来源定位：{document.sourcePath}</p>
        </div>
        <span className="source-format">PDF</span>
      </div>
      <dl className="structure-grid">
        <div>
          <dt>文档类型</dt>
          <dd>{documentKindLabel(document)}</dd>
        </div>
        <div>
          <dt>解析结构</dt>
          <dd>
            {pages.length || document.diagnostics.pageCount || 0} pages / {document.units.length} units
          </dd>
        </div>
        <div>
          <dt>布局状态</dt>
          <dd>{layoutStatus}</dd>
        </div>
        <div>
          <dt>文本状态</dt>
          <dd>{textStatus}</dd>
        </div>
        <div>
          <dt>段落数量</dt>
          <dd>{document.units.length}</dd>
        </div>
        <div>
          <dt>PDF 翻译</dt>
          <dd>HOLD / experimental</dd>
        </div>
        <div>
          <dt>分析状态</dt>
          <dd>{analysisStateLabel(document.analysisState)}</dd>
        </div>
        <div>
          <dt>问答条数</dt>
          <dd>{document.chatMessages?.length ?? 0}</dd>
        </div>
        <div>
          <dt>最后更新</dt>
          <dd>{formatDateTime(document.updatedAt)}</dd>
        </div>
      </dl>
      <div className="pdf-hold-notice">
        <strong>PDF public release remains HOLD.</strong>
        <span>当前闭环支持 PDF 阅读、快速分析、文档问答和知识导出；PDF 翻译链路仍保留为实验能力，不作为 public release。</span>
      </div>
      <div className="outline-preview">
        <h3>页面列表</h3>
        {pages.length ? (
          <div className="reader-page-list">
            {pages.map((page) => (
              <button className={activePage === page.pageNumber ? "active" : ""} key={page.pageNumber} onClick={() => onSelectPage(page.pageNumber)}>
                <strong>Page {page.pageNumber}</strong>
                <span>
                  {page.unitCount} units · {page.textLength} chars
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="empty-hint">暂无可阅读页面。扫描版 PDF 需要 OCR，当前阶段不引入 OCR。</p>
        )}
      </div>
      <div className="chapter-reader pdf-page-reader">
        <div className="panel-title-row">
          <div>
            <h3>{activePage ? `Page ${activePage}` : "正文预览"}</h3>
            <p className="muted">
              {selectedUnits.length} units · {document.diagnostics.parser}
            </p>
          </div>
        </div>
        {selectedUnits.length ? (
          selectedUnits.map((unit) => {
            const bbox = formatBoundingBox(unit);
            return (
              <article className="pdf-paragraph" key={unit.id}>
                <div className="source-meta-row">
                  <span>{getUnitSourceHint(unit)}</span>
                  <em className="role-badge">{unit.role}</em>
                </div>
                <p>{unit.text}</p>
                <small className="source-meta">
                  unit {unit.id}
                  {bbox ? ` · bbox ${bbox}` : ""}
                </small>
              </article>
            );
          })
        ) : (
          <p className="empty-hint">当前页面没有可显示文本。</p>
        )}
      </div>
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
    <section className="panel compact-tool-panel">
      <div className="panel-title-row">
        <div>
          <p className="section-kicker">分析</p>
          <h2>快速分析</h2>
        </div>
        <button onClick={onStart} disabled={disabled || status === "loading"}>
          {status === "loading" ? "分析中" : "快速分析"}
        </button>
      </div>
      <div className="persistence-strip">
        <span>{analysisStateLabel(analysisState)}</span>
        <span>{analysisState?.updatedAt ? `updated ${formatDateTime(analysisState.updatedAt)}` : "尚未分析"}</span>
        {analysisState?.provider || analysisState?.model ? <span>{[analysisState.provider, analysisState.model].filter(Boolean).join(" / ")}</span> : null}
      </div>
      {status === "error" ? <p className="inline-error">{error}</p> : null}
      {analysisState?.status === "failed" && analysisState.error ? <p className="inline-error">{analysisState.error}</p> : null}
      {analysis ? (
        <>
          <dl className="analysis-meta">
            <div>
              <dt>文档类型</dt>
              <dd>{analysis.documentKind ?? "unknown"}</dd>
            </div>
            <div>
              <dt>语言</dt>
              <dd>{analysis.language ?? "unknown"}</dd>
            </div>
            <div>
              <dt>分析时间</dt>
              <dd>{formatDateTime(analysis.analyzedAt)}</dd>
            </div>
          </dl>
          <div className="analysis-summary">
            <strong>{analysis.oneSentenceSummary}</strong>
            <p>{analysis.summary}</p>
          </div>
          <h3>关键点</h3>
          <ul>{analysis.keyPoints.slice(0, 6).map((point) => <li key={point}>{point}</li>)}</ul>
          <h3>关键词</h3>
          <div className="keyword-list">{analysis.keywords.length ? analysis.keywords.map((keyword) => <span key={keyword}>{keyword}</span>) : <span>None</span>}</div>
        </>
      ) : (
        <p className="empty-hint">先使用本地轻量分析，后续接入完整 chunked LLM 分析。</p>
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
    <section className="panel compact-tool-panel">
      <p className="section-kicker">问答</p>
      <h2>文档问答</h2>
      <div className="persistence-strip">
        <span>{messages.length} messages</span>
        <span>{messages.length ? `last ${formatDateTime(messages[messages.length - 1]?.createdAt)}` : "无历史"}</span>
        <button onClick={onClear} disabled={disabled || !messages.length || status === "loading"}>
          清空
        </button>
      </div>
      <div className="qa-form">
        <input value={question} onChange={(event) => onQuestion(event.target.value)} placeholder="询问当前文档" disabled={disabled} />
        <button onClick={onAsk} disabled={disabled || !question.trim() || status === "loading"}>
          {status === "loading" ? "检索中" : "问答"}
        </button>
      </div>
      {error ? <p className="inline-error">{error}</p> : null}
      {messages.length ? (
        <div className="chat-thread">
          {messages.map((message) => (
            <article className={`chat-message ${message.role}`} key={message.id}>
              <strong>{message.role === "user" ? "用户" : "DocuMuse Studio"}</strong>
              <p>{message.content}</p>
              {message.sources?.length ? (
                <div className="chat-sources">
                  <span>Sources</span>
                  {message.sources.map((source) => (
                    <small key={`${message.id}-${source.unitId}`}>
                      {source.sourceHint || source.chapterTitle || source.unitId} · {source.chapterTitle ?? "chapter unknown"} · {source.unitId}
                    </small>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-hint">使用关键词检索返回带来源的回答。</p>
      )}
    </section>
  );
}

function ExportPanel({
  disabled,
  hasAnalysis,
  hasChat,
  status,
  onExport
}: {
  disabled: boolean;
  hasAnalysis: boolean;
  hasChat: boolean;
  status: string;
  onExport: (kind: "markdown" | "json" | "chat" | "analysis") => void;
}) {
  return (
    <section className="panel compact-tool-panel">
      <p className="section-kicker">导出</p>
      <h2>知识导出</h2>
      <div className="inline-actions">
        <button onClick={() => onExport("markdown")} disabled={disabled}>
          Markdown
        </button>
        <button onClick={() => onExport("json")} disabled={disabled}>
          JSON
        </button>
        <button onClick={() => onExport("chat")} disabled={disabled || !hasChat}>
          Chat Markdown
        </button>
        <button onClick={() => onExport("analysis")} disabled={disabled || !hasAnalysis}>
          Analysis Markdown
        </button>
      </div>
      {status ? <p className="export-status">{status}</p> : null}
    </section>
  );
}

function isPdf(document: ImportedDocument | null): document is ImportedPdfDocument {
  return document?.type === "pdf";
}

function isEpub(document: ImportedDocument | null): document is ImportedBook {
  return Boolean(document && document.type !== "pdf");
}

function getDocumentTitle(document: ImportedDocument | null): string {
  if (!document) {
    return "BookTrans Desk";
  }
  return isPdf(document) ? document.title ?? "PDF" : document.metadata.title;
}

function getImportedSourcePath(document: ImportedDocument): string {
  return isPdf(document) ? document.filePath : document.filePath;
}

function documentKindLabel(document: UnifiedDocument): string {
  return document.documentKind?.kind ?? "unknown";
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
  if (!value) {
    return "unknown";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
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
