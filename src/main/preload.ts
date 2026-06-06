import { contextBridge, ipcRenderer } from "electron";
import type {
  ExportHistoryItem,
  ExportedEpubResult,
  ExternalEpubCheckReport,
  ImportedBook,
  IpcResult,
  TranslationProfile,
  TranslationJobSummary,
  TranslationProgress,
  TranslationSettings,
  ValidationReport
} from "../shared/types.js";

const api = {
  importEpub: (): Promise<ImportedBook | null> => ipcRenderer.invoke("book:import"),
  getSettings: (): Promise<TranslationSettings> => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: TranslationSettings): Promise<TranslationSettings> => ipcRenderer.invoke("settings:save", settings),
  startTranslation: (settings: TranslationSettings): Promise<void> => ipcRenderer.invoke("translation:start", settings),
  cancelTranslation: (): Promise<void> => ipcRenderer.invoke("translation:cancel"),
  clearJobCache: (): Promise<void> => ipcRenderer.invoke("translation:clear-cache"),
  exportEpub: (): Promise<ExportedEpubResult> => ipcRenderer.invoke("book:export"),
  saveValidationMarkdown: (
    report: ValidationReport,
    externalValidation: ExternalEpubCheckReport | undefined,
    title: string
  ): Promise<IpcResult<string | null>> => ipcRenderer.invoke("validation:saveMarkdown", report, externalValidation, title),
  listJobs: (): Promise<IpcResult<TranslationJobSummary[]>> => ipcRenderer.invoke("jobs:list"),
  getJob: (jobId: string): Promise<IpcResult<TranslationJobSummary>> => ipcRenderer.invoke("jobs:get", jobId),
  resumeJob: (jobId: string, settings: TranslationSettings): Promise<IpcResult<string>> => ipcRenderer.invoke("jobs:resume", jobId, settings),
  retryFailedJob: (jobId: string, settings: TranslationSettings): Promise<IpcResult<string>> =>
    ipcRenderer.invoke("jobs:retryFailedAndRun", jobId, settings),
  retryChapter: (jobId: string, chapterId: string, settings: TranslationSettings): Promise<IpcResult<string>> =>
    ipcRenderer.invoke("jobs:retryChapterAndRun", jobId, chapterId, settings),
  exportJob: (jobId: string): Promise<IpcResult<ExportedEpubResult>> => ipcRenderer.invoke("jobs:export", jobId),
  deleteJob: (jobId: string): Promise<IpcResult<{ deleted: true }>> => ipcRenderer.invoke("jobs:delete", jobId),
  clearCompletedJobs: (): Promise<IpcResult<{ deleted: number }>> => ipcRenderer.invoke("jobs:clearCompleted"),
  listExports: (): Promise<IpcResult<ExportHistoryItem[]>> => ipcRenderer.invoke("exports:list"),
  getExport: (id: string): Promise<IpcResult<ExportHistoryItem | null>> => ipcRenderer.invoke("exports:get", id),
  deleteExport: (id: string): Promise<IpcResult<{ deleted: true }>> => ipcRenderer.invoke("exports:delete", id),
  clearExports: (): Promise<IpcResult<{ cleared: true }>> => ipcRenderer.invoke("exports:clear"),
  openExportFolder: (outputPath: string): Promise<IpcResult<{ opened: true }>> => ipcRenderer.invoke("exports:openFolder", outputPath),
  getProfileByFingerprint: (bookFingerprint: string): Promise<IpcResult<TranslationProfile | null>> =>
    ipcRenderer.invoke("profiles:getByFingerprint", bookFingerprint),
  saveCurrentProfile: (settings: TranslationSettings): Promise<IpcResult<TranslationProfile>> => ipcRenderer.invoke("profiles:save", settings),
  deleteCurrentProfile: (): Promise<IpcResult<{ deleted: true }>> => ipcRenderer.invoke("profiles:delete"),
  onProgress: (callback: (progress: TranslationProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: TranslationProgress) => callback(progress);
    ipcRenderer.on("translation:progress", listener);
    return () => ipcRenderer.removeListener("translation:progress", listener);
  }
};

contextBridge.exposeInMainWorld("bookTrans", api);

export type BookTransApi = typeof api;
