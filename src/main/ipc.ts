import fs from "node:fs/promises";
import path from "node:path";
import { app, BrowserWindow, dialog, ipcMain, shell } from "electron";
import type {
  ExportHistoryItem,
  ExportedEpubResult,
  ExternalEpubCheckReport,
  ImportedBook,
  IpcResult,
  TranslationJobResult,
  TranslationProfile,
  TranslationSettings,
  ValidationReport
} from "../shared/types.js";
import { validationReportToMarkdown } from "../shared/validationReport.js";
import { getSettings, saveSettings } from "./config/settings.js";
import { createExportHistoryStore, normalizeExternalStatus, normalizeValidationStatus } from "./export/exportHistoryStore.js";
import { createDiagnosticBundle, defaultDiagnosticBundleName } from "./diagnostics/createDiagnosticBundle.js";
import { readEpub } from "./epub/readEpub.js";
import { runExternalEpubCheck } from "./epub/runExternalEpubCheck.js";
import { validateEpub } from "./epub/validateEpub.js";
import { writeTranslatedEpub } from "./epub/writeTranslatedEpub.js";
import { createTranslationProfileStore, getBookFingerprint } from "./profile/translationProfileStore.js";
import { translateBook, type TranslateBookOptions } from "./translationJob.js";
import { JobManager, sanitizeError } from "./translate/jobManager.js";
import { createTranslationJobStore } from "./translate/translationJobStore.js";

let currentBook: ImportedBook | null = null;
let lastResult: TranslationJobResult | null = null;
let activeController: AbortController | null = null;

export function registerIpc(mainWindow: BrowserWindow): void {
  const store = () => createTranslationJobStore(app.getPath("userData"));
  const exportHistory = () => createExportHistoryStore(app.getPath("userData"));
  const profileStore = () => createTranslationProfileStore(app.getPath("userData"));
  const manager = () => new JobManager(store());

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
      sourceBookTitle: book.metadata.title,
      sourceEpubPath: book.filePath,
      outputEpubPath: outputPath,
      validationStatus: normalizeValidationStatus(validation.status),
      externalValidationStatus: normalizeExternalStatus(externalValidation?.status),
      targetLanguage: "zh-CN",
      settings
    });
  }

  async function runManagedTranslation(book: ImportedBook, settings: TranslationSettings, options: TranslateBookOptions = {}): Promise<void> {
    if (activeController) {
      throw new Error("A translation task is already running.");
    }
    activeController = new AbortController();
    try {
      currentBook = book;
      lastResult = await translateBook(
        book,
        settings,
        activeController.signal,
        (progress) => {
          mainWindow.webContents.send("translation:progress", progress);
        },
        { ...options, userDataDir: app.getPath("userData") }
      );
    } catch (error) {
      mainWindow.webContents.send("translation:progress", {
        translatedChunks: 0,
        totalChunks: 0,
        status: activeController.signal.aborted ? "cancelled" : "failed",
        chapters: [],
        log: [sanitizeError(error)]
      });
      throw error;
    } finally {
      activeController = null;
    }
  }

  ipcMain.handle("book:import", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Import EPUB",
      properties: ["openFile"],
      filters: [{ name: "EPUB", extensions: ["epub"] }]
    });
    if (result.canceled || !result.filePaths[0]) {
      return null;
    }
    currentBook = await readEpub(result.filePaths[0]);
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
    lastResult = null;
    return currentBook;
  });

  ipcMain.handle("settings:get", () => getSettings());
  ipcMain.handle("settings:save", (_event, settings: TranslationSettings) => saveSettings(settings));

  ipcMain.handle("translation:start", async (_event, settings: TranslationSettings) => {
    if (!currentBook) {
      throw new Error("Import an EPUB before starting translation.");
    }
    await runManagedTranslation(currentBook, settings);
  });

  ipcMain.handle("translation:cancel", () => {
    activeController?.abort();
  });

  ipcMain.handle("translation:clear-cache", async () => {
    await store().clearAll();
    lastResult = null;
  });

  ipcMain.handle("book:export", async (): Promise<ExportedEpubResult> => {
    if (!lastResult) {
      throw new Error("Translate the book before exporting.");
    }
    const outputPath = await writeTranslatedEpub(lastResult.book, lastResult.translatedChapters);
    const validation = await validateEpub(outputPath);
    const externalValidation = await runExternalEpubCheck(outputPath, getSettings().epubCheckCommand);
    await recordExport(outputPath, validation, externalValidation, lastResult.book, getSettings(), lastResult.jobId);
    return { outputPath, validation, externalValidation };
  });

  ipcMain.handle(
    "validation:saveMarkdown",
    async (_event, report: ValidationReport, externalValidation: ExternalEpubCheckReport | undefined, title: string): Promise<IpcResult<string | null>> => {
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
      await fs.writeFile(result.filePath, validationReportToMarkdown(report, externalValidation, `${safeTitle} Validation Report`), "utf8");
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
      return { ok: false, error: sanitizeError(error) };
    }
  });

  ipcMain.handle("jobs:retryFailedAndRun", async (_event, jobId: string, settings: TranslationSettings): Promise<IpcResult<string>> => {
    try {
      const job = await store().retryFailedChapters(jobId);
      const book = await readEpub(job.sourceEpubPath);
      await runManagedTranslation(book, settings, { jobId, retryFailed: true });
      return { ok: true, data: jobId };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });

  ipcMain.handle("jobs:retryChapterAndRun", async (_event, jobId: string, chapterId: string, settings: TranslationSettings): Promise<IpcResult<string>> => {
    try {
      const job = await store().retryChapter(jobId, chapterId);
      const book = await readEpub(job.sourceEpubPath);
      await runManagedTranslation(book, settings, { jobId, chapterIds: [chapterId] });
      return { ok: true, data: jobId };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
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
      return { ok: false, error: sanitizeError(error) };
    }
  });

  ipcMain.handle("exports:list", async (): Promise<IpcResult<ExportHistoryItem[]>> => {
    try {
      return { ok: true, data: await exportHistory().list() };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });
  ipcMain.handle("exports:get", async (_event, id: string): Promise<IpcResult<ExportHistoryItem | null>> => {
    try {
      return { ok: true, data: await exportHistory().get(id) };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });
  ipcMain.handle("exports:delete", async (_event, id: string): Promise<IpcResult<{ deleted: true }>> => {
    try {
      await exportHistory().delete(id);
      return { ok: true, data: { deleted: true } };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });
  ipcMain.handle("exports:clear", async (): Promise<IpcResult<{ cleared: true }>> => {
    try {
      await exportHistory().clear();
      return { ok: true, data: { cleared: true } };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });
  ipcMain.handle("exports:refresh", async (_event, id: string): Promise<IpcResult<ExportHistoryItem | null>> => {
    try {
      return { ok: true, data: await exportHistory().refresh(id) };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });
  ipcMain.handle("exports:refreshAll", async (): Promise<IpcResult<ExportHistoryItem[]>> => {
    try {
      return { ok: true, data: await exportHistory().refreshAll() };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });
  ipcMain.handle("exports:removeMissing", async (): Promise<IpcResult<{ removed: number }>> => {
    try {
      return { ok: true, data: { removed: await exportHistory().removeMissing() } };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });
  ipcMain.handle("exports:openFolder", async (_event, outputPath: string): Promise<IpcResult<{ opened: true }>> => {
    try {
      await fs.stat(outputPath);
      await shell.openPath(path.dirname(outputPath));
      return { ok: true, data: { opened: true } };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });

  ipcMain.handle("profiles:getByFingerprint", async (_event, bookFingerprint: string): Promise<IpcResult<TranslationProfile | null>> => {
    try {
      return { ok: true, data: await profileStore().getByFingerprint(bookFingerprint) };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });
  ipcMain.handle("profiles:save", async (_event, settings: TranslationSettings): Promise<IpcResult<TranslationProfile>> => {
    try {
      if (!currentBook) {
        throw new Error("Import a book before saving a profile.");
      }
      const profile = await profileStore().saveForBook(currentBook, settings);
      currentBook.loadedProfile = profile;
      currentBook.bookFingerprint = profile.bookFingerprint;
      return { ok: true, data: profile };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
    }
  });
  ipcMain.handle("profiles:delete", async (): Promise<IpcResult<{ deleted: true }>> => {
    try {
      if (!currentBook?.bookFingerprint) {
        throw new Error("No imported book profile to reset.");
      }
      await profileStore().delete(currentBook.bookFingerprint);
      currentBook.loadedProfile = undefined;
      return { ok: true, data: { deleted: true } };
    } catch (error) {
      return { ok: false, error: sanitizeError(error) };
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
        return { ok: false, error: sanitizeError(error) };
      }
    }
  );
}
