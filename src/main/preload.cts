import type {
  ExportHistoryItem,
  ExportedDocumentResult,
  ExportedEpubResult,
  ExternalEpubCheckReport,
  ImportedDocument,
  IpcResult,
  KnowledgeExportResult,
  BilingualExportOptions,
  BilingualExportScope,
  BilingualHtmlLayout,
  PdfValidationReport,
  TranslationProfile,
  TranslationJobSummary,
  TranslationProgress,
  TranslationSettings,
  TranslatorConnectionTestResult,
  ValidationReport
} from "../shared/types.js";
import type { UnifiedDocument } from "../shared/documentModel.js";
import type { DocumentAnalysisRecord } from "./analysis/analysisService.js";
import type { DocumentChatMessage } from "./chat/documentChatService.js";
import type { ExportPresetDefinition, ExportPresetId } from "./export/exportPresets.js";
import type { TranslationVersionSummary } from "./translate/translationVersionService.js";

const electron = require("electron") as typeof import("electron");
const { contextBridge, ipcRenderer } = electron;

const api = {
  importEpub: (): Promise<ImportedDocument | null> => ipcRenderer.invoke("book:import"),
  listDocuments: (): Promise<IpcResult<UnifiedDocument[]>> => ipcRenderer.invoke("documents:list"),
  getDocument: (id: string): Promise<IpcResult<UnifiedDocument | null>> => ipcRenderer.invoke("documents:get", id),
  deleteDocument: (id: string): Promise<IpcResult<{ deleted: true }>> => ipcRenderer.invoke("documents:delete", id),
  startAnalysis: (documentId?: string): Promise<IpcResult<DocumentAnalysisRecord>> => ipcRenderer.invoke("analysis:start", documentId),
  getAnalysis: (documentId: string): Promise<IpcResult<DocumentAnalysisRecord | null>> => ipcRenderer.invoke("analysis:get", documentId),
  askDocument: (documentId: string | undefined, question: string): Promise<IpcResult<DocumentChatMessage>> => ipcRenderer.invoke("chat:ask", documentId, question),
  listDocumentChat: (documentId: string): Promise<IpcResult<DocumentChatMessage[]>> => ipcRenderer.invoke("chat:list", documentId),
  clearDocumentChat: (documentId: string): Promise<IpcResult<{ cleared: true }>> => ipcRenderer.invoke("chat:clear", documentId),
  listTranslationVersions: (documentId: string): Promise<IpcResult<TranslationVersionSummary[]>> => ipcRenderer.invoke("translation:versions", documentId),
  translateCurrentChapter: (documentId: string, chapterId: string): Promise<IpcResult<TranslationVersionSummary>> =>
    ipcRenderer.invoke("translation:translateCurrentChapter", documentId, chapterId),
  translateCurrentPageExperimental: (documentId: string, pageNumber: number): Promise<IpcResult<TranslationVersionSummary>> =>
    ipcRenderer.invoke("translation:translateCurrentPageExperimental", documentId, pageNumber),
  translateUnits: (documentId: string, unitIds: string[]): Promise<IpcResult<TranslationVersionSummary>> => ipcRenderer.invoke("translation:translateUnits", documentId, unitIds),
  exportDocumentMarkdown: (documentId?: string): Promise<IpcResult<KnowledgeExportResult>> => ipcRenderer.invoke("export:documentMarkdown", documentId),
  exportDocumentJson: (documentId?: string): Promise<IpcResult<KnowledgeExportResult>> => ipcRenderer.invoke("export:documentJson", documentId),
  exportChatMarkdown: (documentId: string): Promise<IpcResult<KnowledgeExportResult>> => ipcRenderer.invoke("export:chatMarkdown", documentId),
  exportAnalysisMarkdown: (documentId: string): Promise<IpcResult<KnowledgeExportResult>> => ipcRenderer.invoke("export:analysisMarkdown", documentId),
  listExportPresets: (): Promise<IpcResult<ExportPresetDefinition[]>> => ipcRenderer.invoke("export:presets"),
  exportPresetMarkdown: (documentId: string, presetId: ExportPresetId): Promise<IpcResult<KnowledgeExportResult>> => ipcRenderer.invoke("export:presetMarkdown", documentId, presetId),
  exportFullArchive: (documentId: string): Promise<IpcResult<KnowledgeExportResult>> => ipcRenderer.invoke("export:fullArchive", documentId),
  exportBaselinePptx: (documentId: string): Promise<IpcResult<KnowledgeExportResult>> => ipcRenderer.invoke("export:pptx", documentId),
  exportBilingualMarkdown: (documentId: string, scope: BilingualExportScope, options?: Pick<BilingualExportOptions, "translationVersionId" | "translationResolution">): Promise<IpcResult<KnowledgeExportResult>> =>
    ipcRenderer.invoke("export:bilingualMarkdown", documentId, scope, options),
  exportBilingualHtml: (documentId: string, scope: BilingualExportScope, layout?: BilingualHtmlLayout, options?: Pick<BilingualExportOptions, "translationVersionId" | "translationResolution">): Promise<IpcResult<KnowledgeExportResult>> =>
    ipcRenderer.invoke("export:bilingualHtml", documentId, scope, layout, options),
  getSettings: (): Promise<TranslationSettings> => ipcRenderer.invoke("settings:get"),
  saveSettings: (settings: TranslationSettings): Promise<TranslationSettings> => ipcRenderer.invoke("settings:save", settings),
  startTranslation: (settings: TranslationSettings): Promise<IpcResult<{ completed: true }>> => ipcRenderer.invoke("translation:start", settings),
  cancelTranslation: (): Promise<void> => ipcRenderer.invoke("translation:cancel"),
  testTranslatorConnection: (settings: TranslationSettings): Promise<IpcResult<TranslatorConnectionTestResult>> =>
    ipcRenderer.invoke("translator:testConnection", settings),
  clearJobCache: (): Promise<void> => ipcRenderer.invoke("translation:clear-cache"),
  exportEpub: (): Promise<ExportedDocumentResult> => ipcRenderer.invoke("book:export"),
  saveValidationMarkdown: (
    report: ValidationReport | PdfValidationReport,
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
  refreshExport: (id: string): Promise<IpcResult<ExportHistoryItem | null>> => ipcRenderer.invoke("exports:refresh", id),
  refreshAllExports: (): Promise<IpcResult<ExportHistoryItem[]>> => ipcRenderer.invoke("exports:refreshAll"),
  removeMissingExports: (): Promise<IpcResult<{ removed: number }>> => ipcRenderer.invoke("exports:removeMissing"),
  openExportFolder: (outputPath: string): Promise<IpcResult<{ opened: true }>> => ipcRenderer.invoke("exports:openFolder", outputPath),
  getProfileByFingerprint: (bookFingerprint: string): Promise<IpcResult<TranslationProfile | null>> =>
    ipcRenderer.invoke("profiles:getByFingerprint", bookFingerprint),
  saveCurrentProfile: (settings: TranslationSettings): Promise<IpcResult<TranslationProfile>> => ipcRenderer.invoke("profiles:save", settings),
  deleteCurrentProfile: (): Promise<IpcResult<{ deleted: true }>> => ipcRenderer.invoke("profiles:delete"),
  createDiagnosticBundle: (
    report: ValidationReport | null,
    externalValidation: ExternalEpubCheckReport | undefined
  ): Promise<IpcResult<string | null>> => ipcRenderer.invoke("diagnostics:createBundle", report, externalValidation),
  onProgress: (callback: (progress: TranslationProgress) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: TranslationProgress) => callback(progress);
    ipcRenderer.on("translation:progress", listener);
    return () => {
      ipcRenderer.removeListener("translation:progress", listener);
    };
  }
};

contextBridge.exposeInMainWorld("bookTrans", api);

export type BookTransApi = typeof api;
