import { app, BrowserWindow, dialog, ipcMain } from "electron";
import type { ExportedEpubResult, ImportedBook, TranslationJobResult, TranslationSettings } from "../shared/types.js";
import { getSettings, saveSettings } from "./config/settings.js";
import { readEpub } from "./epub/readEpub.js";
import { validateEpub } from "./epub/validateEpub.js";
import { writeTranslatedEpub } from "./epub/writeTranslatedEpub.js";
import { translateBook } from "./translationJob.js";
import { createTranslationJobStore } from "./translate/translationJobStore.js";

let currentBook: ImportedBook | null = null;
let lastResult: TranslationJobResult | null = null;
let activeController: AbortController | null = null;

export function registerIpc(mainWindow: BrowserWindow): void {
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
    lastResult = null;
    return currentBook;
  });

  ipcMain.handle("settings:get", () => getSettings());
  ipcMain.handle("settings:save", (_event, settings: TranslationSettings) => saveSettings(settings));

  ipcMain.handle("translation:start", async (_event, settings: TranslationSettings) => {
    if (!currentBook) {
      throw new Error("Import an EPUB before starting translation.");
    }
    if (activeController) {
      throw new Error("A translation task is already running.");
    }
    activeController = new AbortController();
    try {
      lastResult = await translateBook(
        currentBook,
        settings,
        activeController.signal,
        (progress) => {
          mainWindow.webContents.send("translation:progress", progress);
        },
        { userDataDir: app.getPath("userData") }
      );
    } catch (error) {
      mainWindow.webContents.send("translation:progress", {
        translatedChunks: 0,
        totalChunks: 0,
        status: activeController.signal.aborted ? "cancelled" : "failed",
        chapters: [],
        log: [error instanceof Error ? error.message : "Translation failed."]
      });
      throw error;
    } finally {
      activeController = null;
    }
  });

  ipcMain.handle("translation:cancel", () => {
    activeController?.abort();
  });

  ipcMain.handle("translation:clear-cache", async () => {
    await createTranslationJobStore(app.getPath("userData")).clearAll();
    lastResult = null;
  });

  ipcMain.handle("book:export", async (): Promise<ExportedEpubResult> => {
    if (!lastResult) {
      throw new Error("Translate the book before exporting.");
    }
    const outputPath = await writeTranslatedEpub(lastResult.book, lastResult.translatedChapters);
    const validation = await validateEpub(outputPath);
    return { outputPath, validation };
  });
}
