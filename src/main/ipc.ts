import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import { AnalysisService } from "./analysis/analysisService.js";
import { DocumentChatService } from "./chat/documentChatService.js";
import type {
  ExportHistoryItem,
  ExportedDocumentResult,
  ExportedEpubResult,
  ExportedPdfResult,
  ExternalEpubCheckReport,
  ImportedBook,
  ImportedDocument,
  ImportedPdfDocument,
  IpcResult,
  KnowledgeExportResult,
  BilingualExportScope,
  BilingualHtmlLayout,
  PdfValidationReport,
  PdfTranslationJobResult,
  TranslationJobResult,
  TranslationProfile,
  TranslationProgress,
  TranslationSettings,
  TranslatorConnectionTestResult,
  ValidationReport
} from "../shared/types.js";
import type { TranslationVersion, UnifiedDocument } from "../shared/documentModel.js";
import { fromImportedBook, fromImportedPdfDocument } from "../shared/documentAdapters.js";
import { validationReportToMarkdown } from "../shared/validationReport.js";
import { getSettings, saveSettings } from "./config/settings.js";
import { createDocumentLibraryStore } from "./document/documentLibraryStore.js";
import { detectDocumentKindForDocument } from "./document/documentKindDetector.js";
import { extractOutline } from "./document/outlineExtractor.js";
import { createDiagnosticBundle, defaultDiagnosticBundleName } from "./diagnostics/createDiagnosticBundle.js";
import { runExternalEpubCheck } from "./epub/runExternalEpubCheck.js";
import { extractBodyText, readEpub } from "./epub/readEpub.js";
import { validateEpub } from "./epub/validateEpub.js";
import { writeTranslatedEpub } from "./epub/writeTranslatedEpub.js";
import { ExportCenter } from "./export/exportCenter.js";
import type { ExportPresetId } from "./export/exportPresets.js";
import { buildBilingualPayload, formatTranslationSummary } from "./export/bilingualExportCore.js";
import { createExportHistoryStore, normalizeExternalStatus, normalizeValidationStatus } from "./export/exportHistoryStore.js";
import {
  statusToValidationStatus,
  validateJsonExport,
  validateMarkdownExport,
  validateBilingualHtmlExport,
  validateBilingualMarkdownExport,
  validatePptxExport,
  validateZipExport
} from "./export/exportValidation.js";
import { exportTranslatedPdf } from "./pdf/exportTranslatedPdf.js";
import { readPdf } from "./pdf/readPdf.js";
import { translatePdf } from "./pdf/translatePdf.js";
import { validatePdf } from "./pdf/validatePdf.js";
import { createTranslationProfileStore, getBookFingerprint } from "./profile/translationProfileStore.js";
import { translateBook, type TranslateBookOptions } from "./translationJob.js";
import { TranslationCancellationManager } from "./translate/cancellation.js";
import { JobManager, sanitizeError } from "./translate/jobManager.js";
import { createTranslationError, normalizeTranslationError, toDiagnosticLines } from "./translate/translationErrors.js";
import { createTranslationJobStore } from "./translate/translationJobStore.js";
import { testTranslatorConnection } from "./translate/testTranslatorConnection.js";

let currentBook: ImportedBook | null = null;
let currentPdf: ImportedPdfDocument | null = null;
let currentUnifiedDocument: UnifiedDocument | null = null;
let lastResult: TranslationJobResult | null = null;
let lastPdfResult: PdfTranslationJobResult | null = null;
const cancellation = new TranslationCancellationManager();

interface KnowledgeExportMetadata {
  exportScope?: string;
  translationStatusSummary?: string;
}

export function registerIpc(mainWindow: BrowserWindow): void {
  const store = () => createTranslationJobStore(app.getPath("userData"));
  const exportHistory = () => createExportHistoryStore(app.getPath("userData"));
  const profileStore = () => createTranslationProfileStore(app.getPath("userData"));
  const documentLibrary = () => createDocumentLibraryStore(app.getPath("userData"));
  const manager = () => new JobManager(store());
  const analysisService = new AnalysisService();
  const chatService = new DocumentChatService();
  const exportCenter = new ExportCenter();

  async function recordExport(
    outputPath: string,
    validation: ValidationReport,
    externalValidation: ExternalEpubCheckReport | undefined,
    book: ImportedBook,
    settings: TranslationSettings,
    jobId?: string
  ): Promise<void> {
    await exportHistory().add({
      jobId,
      sourceType: "epub",
      exportCategory: "translation",
      exportKind: "translated-epub",
      sourceBookTitle: book.metadata.title,
      sourceEpubPath: book.filePath,
      sourcePath: book.filePath,
      outputEpubPath: outputPath,
      outputPath,
      validationStatus: normalizeValidationStatus(validation.status),
      externalValidationStatus: normalizeExternalStatus(externalValidation?.status),
      targetLanguage: "zh-CN",
      settings
    });
  }

  async function recordPdfExport(outputPath: string, validation: ExportedPdfResult["validation"], document: ImportedPdfDocument, settings: TranslationSettings, jobId?: string): Promise<void> {
    await exportHistory().add({
      jobId,
      sourceType: "pdf",
      exportCategory: "translation",
      exportKind: "translated-pdf",
      sourceBookTitle: document.title ?? path.basename(document.filePath),
      sourcePath: document.filePath,
      outputEpubPath: outputPath,
      outputPath,
      validationStatus: normalizeValidationStatus(validation.status),
      targetLanguage: "zh-CN",
      settings
    });
  }

  async function saveKnowledgeTextExport(
    document: UnifiedDocument,
    exportKind: NonNullable<ExportHistoryItem["exportKind"]>,
    defaultPath: string,
    filterName: string,
    extensions: string[],
    content: string,
    metadata: KnowledgeExportMetadata = {}
  ): Promise<KnowledgeExportResult> {
    return saveKnowledgeExport(document, exportKind, defaultPath, filterName, extensions, Buffer.from(content, "utf8"), metadata);
  }

  async function saveKnowledgeBufferExport(
    document: UnifiedDocument,
    exportKind: NonNullable<ExportHistoryItem["exportKind"]>,
    defaultPath: string,
    filterName: string,
    extensions: string[],
    content: Buffer,
    metadata: KnowledgeExportMetadata = {}
  ): Promise<KnowledgeExportResult> {
    return saveKnowledgeExport(document, exportKind, defaultPath, filterName, extensions, content, metadata);
  }

  async function saveKnowledgeExport(
    document: UnifiedDocument,
    exportKind: NonNullable<ExportHistoryItem["exportKind"]>,
    defaultPath: string,
    filterName: string,
    extensions: string[],
    content: Buffer,
    metadata: KnowledgeExportMetadata = {}
  ): Promise<KnowledgeExportResult> {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: "Export",
      defaultPath,
      filters: [{ name: filterName, extensions }]
    });
    if (result.canceled || !result.filePath) {
      return { ok: false, canceled: true, exportKind };
    }
    await fs.writeFile(result.filePath, content);
    const validation = await validateKnowledgeExport(result.filePath, exportKind, document.title);
    const historyItem = await exportHistory().add({
      sourceType: document.sourceFormat === "pdf" ? "pdf" : "epub",
      exportCategory: "knowledge",
      exportKind,
      sourceDocumentId: document.id,
      sourceDocumentTitle: document.title,
      sourceBookTitle: document.title,
      sourcePath: document.sourcePath,
      outputEpubPath: result.filePath,
      outputPath: result.filePath,
      validationStatus: statusToValidationStatus(validation.status),
      exportScope: metadata.exportScope,
      translationStatusSummary: metadata.translationStatusSummary,
      targetLanguage: "knowledge",
      model: document.analysisState?.model
    });
    return { ok: true, outputPath: result.filePath, exportKind, validation, historyItem };
  }

  async function validateKnowledgeExport(outputPath: string, exportKind: NonNullable<ExportHistoryItem["exportKind"]>, title: string) {
    switch (exportKind) {
      case "bilingual-markdown":
      case "bilingual-markdown-selected":
        return validateBilingualMarkdownExport(outputPath);
      case "bilingual-html":
      case "bilingual-html-selected":
        return validateBilingualHtmlExport(outputPath);
      case "document-json":
        return validateJsonExport(outputPath);
      case "full-archive":
        return validateZipExport(outputPath, ["README.md", "document.json", "analysis.md", "chat.md", "study-notes.md", "research-digest.md", "presentation-outline.md", "podcast-prep.md"]);
      case "pptx":
        return validatePptxExport(outputPath);
      default:
        return validateMarkdownExport(outputPath, title);
    }
  }

  async function persistEpubTranslationSnapshot(book: ImportedBook, result: TranslationJobResult, settings: TranslationSettings): Promise<void> {
    const library = documentLibrary();
    const document = currentUnifiedDocument ?? (await findDocumentBySourcePath(book.filePath));
    if (!document) {
      return;
    }
    const translatedByChapterId = new Map(result.translatedChapters.map((chapter) => [chapter.chapterId, extractBodyText(chapter.html)]));
    const now = new Date().toISOString();
    const version: TranslationVersion = {
      id: `translation-${crypto.randomUUID()}`,
      documentId: document.id,
      jobId: result.jobId,
      source: "epub-translation",
      provider: settings.providerPreset,
      model: settings.useMock ? "mock" : settings.model,
      style: settings.style,
      targetLanguage: "zh-CN",
      status: "completed",
      unitTranslations: document.units.map((unit) => {
        const originalChapterId = typeof unit.metadata?.originalChapterId === "string" ? unit.metadata.originalChapterId : undefined;
        const translatedText = originalChapterId ? translatedByChapterId.get(originalChapterId) : undefined;
        return {
          unitId: unit.id,
          sourceUnitId: unit.id,
          sourceText: unit.text,
          translatedText,
          status: translatedText ? "completed" : "missing",
          source: translatedText ? "epub-translation" : "missing",
          updatedAt: now
        };
      }),
      createdAt: now,
      updatedAt: now
    };
    currentUnifiedDocument = await library.updateDocument(document.id, (existing) => ({
      ...existing,
      translations: [...(existing.translations ?? []).filter((item) => item.jobId !== result.jobId), version]
    }));
  }

  async function persistPdfTranslationSnapshot(document: UnifiedDocument, result: PdfTranslationJobResult, settings: TranslationSettings): Promise<UnifiedDocument> {
    const translatedByParagraphId = new Map<string, string>();
    for (const page of result.translatedPages) {
      for (const paragraph of page.paragraphs) {
        if (paragraph.id && paragraph.translated) {
          translatedByParagraphId.set(paragraph.id, paragraph.translated);
        }
      }
    }
    const now = new Date().toISOString();
    const version: TranslationVersion = {
      id: `translation-${crypto.randomUUID()}`,
      documentId: document.id,
      jobId: result.jobId,
      source: "pdf-experimental",
      provider: settings.providerPreset,
      model: settings.useMock ? "mock" : settings.model,
      style: settings.style,
      targetLanguage: "zh-CN",
      status: "completed",
      unitTranslations: document.units.map((unit) => {
        const originalParagraphId = typeof unit.metadata?.originalParagraphId === "string" ? unit.metadata.originalParagraphId : undefined;
        const translatedText = originalParagraphId ? translatedByParagraphId.get(originalParagraphId) : undefined;
        return {
          unitId: unit.id,
          sourceUnitId: unit.id,
          sourceText: unit.text,
          translatedText,
          status: translatedText ? "experimental" : "missing",
          source: translatedText ? "pdf-experimental" : "missing",
          updatedAt: now
        };
      }),
      createdAt: now,
      updatedAt: now
    };
    return documentLibrary().updateDocument(document.id, (existing) => ({
      ...existing,
      translations: [...(existing.translations ?? []).filter((item) => item.jobId !== result.jobId), version]
    }));
  }

  async function findDocumentBySourcePath(sourcePath: string): Promise<UnifiedDocument | null> {
    const documents = await documentLibrary().listDocuments();
    return documents.find((document) => document.sourcePath === sourcePath) ?? null;
  }

  async function runManagedTranslation(book: ImportedBook, settings: TranslationSettings, options: TranslateBookOptions = {}): Promise<void> {
    if (cancellation.active) {
      throw createTranslationError("UNKNOWN_TRANSLATION_ERROR", "A translation task is already running.");
    }
    const running = cancellation.start(`epub-${crypto.randomUUID()}`);
    let lastProgress: TranslationProgress | null = null;
    try {
      currentBook = book;
      lastResult = await translateBook(
        book,
        settings,
        running.abortController.signal,
        (progress) => {
          lastProgress = progress;
          mainWindow.webContents.send("translation:progress", progress);
        },
        { ...options, userDataDir: app.getPath("userData") }
      );
      await persistEpubTranslationSnapshot(book, lastResult, settings);
    } catch (error) {
      emitFailureProgress(mainWindow, error, lastProgress, running.abortController.signal.aborted);
      throw error;
    } finally {
      cancellation.clear(running.jobId);
    }
  }

  ipcMain.handle("book:import", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "导入 EPUB / PDF",
      properties: ["openFile"],
      filters: [{ name: "EPUB / PDF", extensions: ["epub", "pdf"] }]
    });
    if (result.canceled || !result.filePaths[0]) {
      return null;
    }
    const filePath = result.filePaths[0];
    const extension = path.extname(filePath).toLowerCase();
    currentBook = null;
    currentPdf = null;
    currentUnifiedDocument = null;
    lastResult = null;
    lastPdfResult = null;
    if (extension === ".pdf") {
      currentPdf = await readPdf(filePath);
      currentUnifiedDocument = enrichUnifiedDocument(fromImportedPdfDocument(currentPdf));
      currentUnifiedDocument = await documentLibrary().importDocumentSnapshot(currentUnifiedDocument);
      return currentPdf;
    }
    currentBook = await readEpub(filePath);
    currentBook.type = "epub";
    currentBook.bookFingerprint = getBookFingerprint(currentBook);
    const loadedProfile = await profileStore().getByFingerprint(currentBook.bookFingerprint);
    if (loadedProfile) {
      currentBook.loadedProfile = loadedProfile;
      const currentSettings = getSettings();
      saveSettings({
        ...currentSettings,
        baseUrl: loadedProfile.baseUrl ?? currentSettings.baseUrl,
        model: loadedProfile.model ?? currentSettings.model,
        glossary: loadedProfile.glossary,
        style: loadedProfile.style
      });
    }
    currentUnifiedDocument = enrichUnifiedDocument(fromImportedBook(currentBook));
    currentUnifiedDocument = await documentLibrary().importDocumentSnapshot(currentUnifiedDocument);
    return currentBook;
  });

  ipcMain.handle("documents:list", async (): Promise<IpcResult<UnifiedDocument[]>> => withIpcResult(() => documentLibrary().listDocuments()));
  ipcMain.handle("documents:get", async (_event, id: string): Promise<IpcResult<UnifiedDocument | null>> => withIpcResult(() => documentLibrary().readDocument(id)));
  ipcMain.handle("documents:delete", async (_event, id: string): Promise<IpcResult<{ deleted: true }>> => {
    try {
      await documentLibrary().deleteDocument(id);
      if (currentUnifiedDocument?.id === id) {
        currentUnifiedDocument = null;
      }
      return { ok: true, data: { deleted: true } };
    } catch (error) {
      return toIpcError(error);
    }
  });

  ipcMain.handle("analysis:start", async (_event, documentId?: string) =>
    withIpcResult(async () => {
      const library = documentLibrary();
      const document = await resolveUnifiedDocument(library, currentUnifiedDocument, documentId);
      const settings = getSettings();
      const analysis = await analysisService.startQuickAnalysisAndPersist(document, library, { provider: settings.providerPreset, model: settings.model });
      currentUnifiedDocument = await library.readDocument(document.id);
      return analysis;
    })
  );
  ipcMain.handle("analysis:get", async (_event, documentId: string): Promise<IpcResult<ReturnType<AnalysisService["getAnalysis"]>>> =>
    withIpcResult(() => analysisService.getPersistedAnalysis(documentLibrary(), documentId))
  );
  ipcMain.handle("chat:ask", async (_event, documentId: string | undefined, question: string) =>
    withIpcResult(async () => {
      const library = documentLibrary();
      const document = await resolveUnifiedDocument(library, currentUnifiedDocument, documentId);
      const answer = await chatService.askAndPersist(document, question, library);
      currentUnifiedDocument = await library.readDocument(document.id);
      return answer;
    })
  );
  ipcMain.handle("chat:list", async (_event, documentId: string): Promise<IpcResult<ReturnType<DocumentChatService["list"]>>> =>
    withIpcResult(() => chatService.listPersisted(documentLibrary(), documentId))
  );
  ipcMain.handle("chat:clear", async (_event, documentId: string): Promise<IpcResult<{ cleared: true }>> =>
    withIpcResult(async () => {
      const library = documentLibrary();
      await chatService.clearPersisted(library, documentId);
      currentUnifiedDocument = currentUnifiedDocument?.id === documentId ? await library.readDocument(documentId) : currentUnifiedDocument;
      return { cleared: true };
    })
  );
  ipcMain.handle("export:documentMarkdown", async (_event, documentId?: string): Promise<IpcResult<KnowledgeExportResult>> =>
    withIpcResult(async () => {
      const document = await resolveUnifiedDocument(documentLibrary(), currentUnifiedDocument, documentId);
      return saveKnowledgeTextExport(document, "document-markdown", `${safeFileName(document.title)}.documuse.md`, "Markdown", ["md"], exportCenter.documentMarkdown(document));
    })
  );
  ipcMain.handle("export:documentJson", async (_event, documentId?: string): Promise<IpcResult<KnowledgeExportResult>> =>
    withIpcResult(async () => {
      const document = await resolveUnifiedDocument(documentLibrary(), currentUnifiedDocument, documentId);
      return saveKnowledgeTextExport(document, "document-json", `${safeFileName(document.title)}.documuse.json`, "JSON", ["json"], exportCenter.documentJson(document));
    })
  );
  ipcMain.handle("export:chatMarkdown", async (_event, documentId: string): Promise<IpcResult<KnowledgeExportResult>> =>
    withIpcResult(async () => {
      const document = await resolveUnifiedDocument(documentLibrary(), currentUnifiedDocument, documentId);
      return saveKnowledgeTextExport(document, "chat-markdown", `${safeFileName(document.title)}.chat.md`, "Markdown", ["md"], exportCenter.chatMarkdown(document, document.chatMessages ?? []));
    })
  );
  ipcMain.handle("export:analysisMarkdown", async (_event, documentId: string): Promise<IpcResult<KnowledgeExportResult>> =>
    withIpcResult(async () => {
      const document = await resolveUnifiedDocument(documentLibrary(), currentUnifiedDocument, documentId);
      return saveKnowledgeTextExport(document, "analysis-markdown", `${safeFileName(document.title)}.analysis.md`, "Markdown", ["md"], exportCenter.analysisMarkdownFromDocument(document));
    })
  );
  ipcMain.handle("export:presets", (): IpcResult<ReturnType<ExportCenter["presets"]>> => ({ ok: true, data: exportCenter.presets() }));
  ipcMain.handle("export:presetMarkdown", async (_event, documentId: string, presetId: ExportPresetId): Promise<IpcResult<KnowledgeExportResult>> =>
    withIpcResult(async () => {
      const document = await resolveUnifiedDocument(documentLibrary(), currentUnifiedDocument, documentId);
      return saveKnowledgeTextExport(document, presetId, `${safeFileName(document.title)}.${presetId}.md`, "Markdown", ["md"], exportCenter.presetMarkdown(document, presetId));
    })
  );
  ipcMain.handle("export:fullArchive", async (_event, documentId: string): Promise<IpcResult<KnowledgeExportResult>> =>
    withIpcResult(async () => {
      const document = await resolveUnifiedDocument(documentLibrary(), currentUnifiedDocument, documentId);
      return saveKnowledgeBufferExport(document, "full-archive", `${safeFileName(document.title)}.archive.zip`, "ZIP", ["zip"], exportCenter.fullArchiveZip(document));
    })
  );
  ipcMain.handle("export:pptx", async (_event, documentId: string): Promise<IpcResult<KnowledgeExportResult>> =>
    withIpcResult(async () => {
      const document = await resolveUnifiedDocument(documentLibrary(), currentUnifiedDocument, documentId);
      return saveKnowledgeBufferExport(document, "pptx", `${safeFileName(document.title)}.deck.pptx`, "PowerPoint", ["pptx"], exportCenter.baselinePptx(document));
    })
  );
  ipcMain.handle("export:bilingualMarkdown", async (_event, documentId: string, scope: BilingualExportScope): Promise<IpcResult<KnowledgeExportResult>> =>
    withIpcResult(async () => {
      const document = await resolveUnifiedDocument(documentLibrary(), currentUnifiedDocument, documentId);
      const payload = buildBilingualPayload(document, scope);
      return saveKnowledgeTextExport(
        document,
        scope.type === "full" ? "bilingual-markdown" : "bilingual-markdown-selected",
        bilingualDefaultPath(document, scope, "md"),
        "Markdown",
        ["md"],
        exportCenter.bilingualMarkdown(document, scope),
        {
          exportScope: payload.scopeLabel,
          translationStatusSummary: formatTranslationSummary(payload.summary)
        }
      );
    })
  );
  ipcMain.handle("export:bilingualHtml", async (_event, documentId: string, scope: BilingualExportScope, layout: BilingualHtmlLayout = "side-by-side"): Promise<IpcResult<KnowledgeExportResult>> =>
    withIpcResult(async () => {
      const document = await resolveUnifiedDocument(documentLibrary(), currentUnifiedDocument, documentId);
      const payload = buildBilingualPayload(document, scope);
      return saveKnowledgeTextExport(
        document,
        scope.type === "full" ? "bilingual-html" : "bilingual-html-selected",
        bilingualDefaultPath(document, scope, "html"),
        "HTML",
        ["html"],
        exportCenter.bilingualHtml(document, scope, layout),
        {
          exportScope: payload.scopeLabel,
          translationStatusSummary: formatTranslationSummary(payload.summary)
        }
      );
    })
  );

  ipcMain.handle("settings:get", () => getSettings());
  ipcMain.handle("settings:save", (_event, settings: TranslationSettings) => saveSettings(settings));

  ipcMain.handle("translator:testConnection", async (_event, settings: TranslationSettings): Promise<IpcResult<TranslatorConnectionTestResult>> => {
    try {
      const result = await testTranslatorConnection(settings);
      return { ok: result.status === "success", data: result, error: result.status === "success" ? undefined : result.message, code: result.code };
    } catch (error) {
      const normalized = normalizeTranslationError(error);
      return { ok: false, error: normalized.message, code: normalized.code };
    }
  });

  ipcMain.handle("translation:start", async (_event, settings: TranslationSettings): Promise<IpcResult<{ completed: true }>> => {
    if (currentPdf) {
      if (cancellation.active) {
        const error = createTranslationError("UNKNOWN_TRANSLATION_ERROR", "A translation task is already running.");
        return { ok: false, error: error.message, code: error.code };
      }
      const running = cancellation.start(`pdf-${crypto.randomUUID()}`);
      let lastProgress: TranslationProgress | null = null;
      try {
        lastPdfResult = await translatePdf(currentPdf, settings, running.abortController.signal, (progress) => {
          lastProgress = progress;
          mainWindow.webContents.send("translation:progress", progress);
        });
        if (currentUnifiedDocument) {
          currentUnifiedDocument = await persistPdfTranslationSnapshot(currentUnifiedDocument, lastPdfResult, settings);
        }
        return { ok: true, data: { completed: true } };
      } catch (error) {
        emitFailureProgress(mainWindow, error, lastProgress, running.abortController.signal.aborted, "pdf");
        const normalized = normalizeTranslationError(error);
        return { ok: false, error: normalized.message, code: normalized.code };
      } finally {
        cancellation.clear(running.jobId);
      }
    }
    if (!currentBook) {
      const error = createTranslationError("UNKNOWN_TRANSLATION_ERROR", "请先导入 EPUB 或 PDF。");
      return { ok: false, error: error.message, code: error.code };
    }
    try {
      await runManagedTranslation(currentBook, settings);
      return { ok: true, data: { completed: true } };
    } catch (error) {
      const normalized = normalizeTranslationError(error);
      return { ok: false, error: normalized.message, code: normalized.code };
    }
  });

  ipcMain.handle("translation:cancel", () => {
    cancellation.cancel();
  });

  ipcMain.handle("translation:clear-cache", async () => {
    await store().clearAll();
    lastResult = null;
    lastPdfResult = null;
  });

  ipcMain.handle("book:export", async (): Promise<ExportedDocumentResult> => {
    if (lastPdfResult) {
      const outputPath = await exportTranslatedPdf(lastPdfResult.document, lastPdfResult.translatedPages, getSettings());
      const validation = await validatePdf(outputPath);
      await recordPdfExport(outputPath, validation, lastPdfResult.document, getSettings(), lastPdfResult.jobId);
      return { outputPath, validation };
    }
    if (!lastResult) {
      throw new Error("请先完成翻译再导出。");
    }
    const outputPath = await writeTranslatedEpub(lastResult.book, lastResult.translatedChapters);
    const validation = await validateEpub(outputPath);
    const externalValidation = await runExternalEpubCheck(outputPath, getSettings().epubCheckCommand);
    await recordExport(outputPath, validation, externalValidation, lastResult.book, getSettings(), lastResult.jobId);
    return { outputPath, validation, externalValidation };
  });

  ipcMain.handle(
    "validation:saveMarkdown",
    async (_event, report: ValidationReport | PdfValidationReport, externalValidation: ExternalEpubCheckReport | undefined, title: string): Promise<IpcResult<string | null>> => {
      try {
        const safeTitle = (title || "book").replace(/[\\/:*?"<>|]+/g, "_").trim() || "book";
        const result = await dialog.showSaveDialog(mainWindow, {
          title: "Save validation report",
          defaultPath: `${safeTitle}.validation-report.md`,
          filters: [{ name: "Markdown", extensions: ["md"] }]
        });
        if (result.canceled || !result.filePath) {
          return { ok: true, data: null };
        }
        await fs.writeFile(result.filePath, reportToMarkdown(report, externalValidation, `${safeTitle} Validation Report`), "utf8");
        return { ok: true, data: result.filePath };
      } catch (error) {
        return { ok: false, error: sanitizeError(error) };
      }
    }
  );

  ipcMain.handle("jobs:list", () => manager().list());
  ipcMain.handle("jobs:get", (_event, jobId: string) => manager().get(jobId));
  ipcMain.handle("jobs:retryFailed", (_event, jobId: string) => manager().retryFailed(jobId));
  ipcMain.handle("jobs:retryChapter", (_event, jobId: string, chapterId: string) => manager().retryChapter(jobId, chapterId));
  ipcMain.handle("jobs:delete", async (_event, jobId: string) => {
    if (lastResult?.jobId === jobId) {
      lastResult = null;
    }
    return manager().delete(jobId);
  });
  ipcMain.handle("jobs:clearCompleted", () => manager().clearCompleted());

  ipcMain.handle("jobs:resume", async (_event, jobId: string, settings: TranslationSettings): Promise<IpcResult<string>> => {
    try {
      const job = await store().readJob(jobId);
      const book = await readEpub(job.sourceEpubPath);
      await runManagedTranslation(book, settings, { jobId });
      return { ok: true, data: jobId };
    } catch (error) {
      return toIpcError(error);
    }
  });

  ipcMain.handle("jobs:retryFailedAndRun", async (_event, jobId: string, settings: TranslationSettings): Promise<IpcResult<string>> => {
    try {
      const job = await store().retryFailedChapters(jobId);
      const book = await readEpub(job.sourceEpubPath);
      await runManagedTranslation(book, settings, { jobId, retryFailed: true });
      return { ok: true, data: jobId };
    } catch (error) {
      return toIpcError(error);
    }
  });

  ipcMain.handle("jobs:retryChapterAndRun", async (_event, jobId: string, chapterId: string, settings: TranslationSettings): Promise<IpcResult<string>> => {
    try {
      const job = await store().retryChapter(jobId, chapterId);
      const book = await readEpub(job.sourceEpubPath);
      await runManagedTranslation(book, settings, { jobId, chapterIds: [chapterId] });
      return { ok: true, data: jobId };
    } catch (error) {
      return toIpcError(error);
    }
  });

  ipcMain.handle("jobs:export", async (_event, jobId: string): Promise<IpcResult<ExportedEpubResult>> => {
    try {
      const job = await store().readJob(jobId);
      const book = await readEpub(job.sourceEpubPath);
      const translatedChapters = await store().toTranslatedChapters(job);
      if (!translatedChapters.length) {
        throw new Error("Job does not have translated chapters to export.");
      }
      lastResult = { book, translatedChapters, jobId };
      const outputPath = await writeTranslatedEpub(book, translatedChapters);
      const validation = await validateEpub(outputPath);
      const externalValidation = await runExternalEpubCheck(outputPath, getSettings().epubCheckCommand);
      await recordExport(outputPath, validation, externalValidation, book, getSettings(), jobId);
      return { ok: true, data: { outputPath, validation, externalValidation } };
    } catch (error) {
      return toIpcError(error);
    }
  });

  ipcMain.handle("exports:list", async (): Promise<IpcResult<ExportHistoryItem[]>> => withIpcResult(() => exportHistory().list()));
  ipcMain.handle("exports:get", async (_event, id: string): Promise<IpcResult<ExportHistoryItem | null>> => withIpcResult(() => exportHistory().get(id)));
  ipcMain.handle("exports:delete", async (_event, id: string): Promise<IpcResult<{ deleted: true }>> => {
    try {
      await exportHistory().delete(id);
      return { ok: true, data: { deleted: true } };
    } catch (error) {
      return toIpcError(error);
    }
  });
  ipcMain.handle("exports:clear", async (): Promise<IpcResult<{ cleared: true }>> => {
    try {
      await exportHistory().clear();
      return { ok: true, data: { cleared: true } };
    } catch (error) {
      return toIpcError(error);
    }
  });
  ipcMain.handle("exports:refresh", async (_event, id: string): Promise<IpcResult<ExportHistoryItem | null>> => withIpcResult(() => exportHistory().refresh(id)));
  ipcMain.handle("exports:refreshAll", async (): Promise<IpcResult<ExportHistoryItem[]>> => withIpcResult(() => exportHistory().refreshAll()));
  ipcMain.handle("exports:removeMissing", async (): Promise<IpcResult<{ removed: number }>> => {
    try {
      return { ok: true, data: { removed: await exportHistory().removeMissing() } };
    } catch (error) {
      return toIpcError(error);
    }
  });
  ipcMain.handle("exports:openFolder", async (_event, outputPath: string): Promise<IpcResult<{ opened: true }>> => {
    try {
      const knownPaths = await exportHistory().list();
      const isKnown = knownPaths.some((item) => outputPath === item.outputPath || outputPath === item.outputEpubPath);
      if (!isKnown) {
        throw new Error("Only known exported files can be opened from the app.");
      }
      await fs.stat(outputPath);
      await shell.openPath(path.dirname(outputPath));
      return { ok: true, data: { opened: true } };
    } catch (error) {
      return toIpcError(error);
    }
  });

  ipcMain.handle("profiles:getByFingerprint", async (_event, bookFingerprint: string): Promise<IpcResult<TranslationProfile | null>> =>
    withIpcResult(() => profileStore().getByFingerprint(bookFingerprint))
  );
  ipcMain.handle("profiles:save", async (_event, settings: TranslationSettings): Promise<IpcResult<TranslationProfile>> => {
    try {
      if (!currentBook) {
        throw new Error("请先导入 EPUB 再保存本书配置。PDF 暂不支持书籍配置。");
      }
      const profile = await profileStore().saveForBook(currentBook, settings);
      currentBook.loadedProfile = profile;
      currentBook.bookFingerprint = profile.bookFingerprint;
      return { ok: true, data: profile };
    } catch (error) {
      return toIpcError(error);
    }
  });
  ipcMain.handle("profiles:delete", async (): Promise<IpcResult<{ deleted: true }>> => {
    try {
      if (!currentBook?.bookFingerprint) {
        throw new Error("当前没有可重置的 EPUB 书籍配置。");
      }
      await profileStore().delete(currentBook.bookFingerprint);
      currentBook.loadedProfile = undefined;
      return { ok: true, data: { deleted: true } };
    } catch (error) {
      return toIpcError(error);
    }
  });

  ipcMain.handle(
    "diagnostics:createBundle",
    async (_event, report: ValidationReport | null, externalValidation: ExternalEpubCheckReport | undefined): Promise<IpcResult<string | null>> => {
      try {
        const result = await dialog.showSaveDialog(mainWindow, {
          title: "Export diagnostic bundle",
          defaultPath: defaultDiagnosticBundleName(),
          filters: [{ name: "Diagnostic bundle", extensions: ["zip"] }]
        });
        if (result.canceled || !result.filePath) {
          return { ok: true, data: null };
        }
        const jobSummary = lastResult?.jobId ? (await manager().get(lastResult.jobId)).data ?? null : null;
        await createDiagnosticBundle({
          outputPath: result.filePath,
          appVersion: app.getVersion(),
          validationReport: report,
          externalReport: externalValidation,
          jobSummary,
          exportHistory: await exportHistory().list(),
          appLog: "Renderer logs are not collected automatically.",
          redactPaths: true
        });
        return { ok: true, data: result.filePath };
      } catch (error) {
        return toIpcError(error);
      }
    }
  );
}

function emitFailureProgress(
  mainWindow: BrowserWindow,
  error: unknown,
  lastProgress: TranslationProgress | null,
  wasUserCancelled: boolean,
  documentType?: "epub" | "pdf"
): void {
  const normalized = wasUserCancelled ? createTranslationError("USER_CANCELLED", error) : normalizeTranslationError(error);
  mainWindow.webContents.send("translation:progress", {
    documentType: lastProgress?.documentType ?? documentType,
    currentChapter: lastProgress?.currentChapter,
    currentPage: lastProgress?.currentPage,
    translatedPages: lastProgress?.translatedPages,
    totalPages: lastProgress?.totalPages,
    translatedChunks: lastProgress?.translatedChunks ?? 0,
    totalChunks: lastProgress?.totalChunks ?? 0,
    status: normalized.code === "USER_CANCELLED" ? "cancelled" : "failed",
    chapters: lastProgress?.chapters ?? [],
    log: [...(lastProgress?.log ?? []), ...toDiagnosticLines(normalized)],
    quality: lastProgress?.quality
  } satisfies TranslationProgress);
}

async function withIpcResult<T>(action: () => Promise<T>): Promise<IpcResult<T>> {
  try {
    return { ok: true, data: await action() };
  } catch (error) {
    return toIpcError(error);
  }
}

async function resolveUnifiedDocument(
  store: ReturnType<typeof createDocumentLibraryStore>,
  currentDocument: UnifiedDocument | null,
  documentId?: string
): Promise<UnifiedDocument> {
  if (documentId) {
    const document = await store.readDocument(documentId);
    if (document) {
      return document;
    }
  }
  if (!documentId && currentDocument) {
    return currentDocument;
  }
  throw new Error("No unified document is available for this operation.");
}

function toIpcError<T = never>(error: unknown): IpcResult<T> {
  const normalized = normalizeTranslationError(error);
  return { ok: false, error: normalized.message, code: normalized.code };
}

function reportToMarkdown(
  report: ValidationReport | PdfValidationReport,
  externalValidation: ExternalEpubCheckReport | undefined,
  title: string
): string {
  if (!isPdfValidationReport(report)) {
    return validationReportToMarkdown(report, externalValidation, title);
  }
  return [
    `# ${title}`,
    "",
    `Status: ${report.status}`,
    "",
    `Summary: ${report.summary}`,
    "",
    `Page count: ${report.pageCount ?? 0}`,
    `File size: ${report.fileSize ?? 0}`,
    `Title: ${report.title ?? "Unknown"}`,
    `Author: ${report.author ?? "Unknown"}`,
    "",
    "## Errors",
    ...(report.errors.length ? report.errors.map((item) => `- ${item}`) : ["- None"]),
    "",
    "## Warnings",
    ...(report.warnings.length ? report.warnings.map((item) => `- ${item}`) : ["- None"]),
    "",
    "## Checked Files",
    ...(report.checkedFiles.length ? report.checkedFiles.map((item) => `- ${item}`) : ["- None"])
  ].join("\n");
}

async function saveTextWithDialog(
  mainWindow: BrowserWindow,
  defaultPath: string,
  filterName: string,
  extensions: string[],
  content: string
): Promise<string | null> {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export",
    defaultPath,
    filters: [{ name: filterName, extensions }]
  });
  if (result.canceled || !result.filePath) {
    return null;
  }
  await fs.writeFile(result.filePath, content, "utf8");
  return result.filePath;
}

async function saveBufferWithDialog(
  mainWindow: BrowserWindow,
  defaultPath: string,
  filterName: string,
  extensions: string[],
  content: Buffer
): Promise<string | null> {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Export",
    defaultPath,
    filters: [{ name: filterName, extensions }]
  });
  if (result.canceled || !result.filePath) {
    return null;
  }
  await fs.writeFile(result.filePath, content);
  return result.filePath;
}

function safeFileName(value: string): string {
  return (value || "document").replace(/[\\/:*?"<>|]+/g, "_").trim() || "document";
}

function bilingualDefaultPath(document: UnifiedDocument, scope: BilingualExportScope, extension: "md" | "html"): string {
  const base = safeFileName(document.title);
  if (scope.type === "chapter") {
    const chapter = document.chapters.find((item) => item.id === scope.chapterId);
    const label = safeFileName(chapter ? `chapter-${chapter.order + 1}` : "chapter");
    return `${base}.${label}.bilingual.${extension}`;
  }
  if (scope.type === "page") {
    return `${base}.page-${scope.pageNumber ?? "unknown"}.bilingual.${extension}`;
  }
  if (scope.type === "units") {
    return `${base}.selected-units.bilingual.${extension}`;
  }
  return `${base}.bilingual.${extension}`;
}

function isPdfValidationReport(report: ValidationReport | PdfValidationReport): report is PdfValidationReport {
  return "fileSize" in report || "pageCount" in report;
}

function enrichUnifiedDocument(document: UnifiedDocument): UnifiedDocument {
  const outlined = {
    ...document,
    outline: extractOutline(document).tree
  };
  return {
    ...outlined,
    documentKind: detectDocumentKindForDocument(outlined)
  };
}
