import { contextBridge, ipcRenderer } from "electron";
import type { ImportedBook, TranslationProgress, TranslationSettings } from "../shared/types.js";

const api = {
  importEpub: (): Promise<ImportedBook | null> => ipcRenderer.invoke("book:import"),
  getSettings: (): Promise<TranslationSettings> => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: TranslationSettings): Promise<TranslationSettings> => ipcRenderer.invoke("settings:save", settings),
  startTranslation: (settings: TranslationSettings): Promise<void> => ipcRenderer.invoke("translation:start", settings),
  cancelTranslation: (): Promise<void> => ipcRenderer.invoke("translation:cancel"),
  exportEpub: (): Promise<string | null> => ipcRenderer.invoke("book:export"),
  onProgress: (callback: (progress: TranslationProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: TranslationProgress) => callback(progress);
    ipcRenderer.on("translation:progress", listener);
    return () => ipcRenderer.removeListener("translation:progress", listener);
  }
};

contextBridge.exposeInMainWorld("bookTrans", api);

export type BookTransApi = typeof api;
