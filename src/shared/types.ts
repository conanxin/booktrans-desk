export type TranslationStatus = "pending" | "translating" | "completed" | "failed" | "cancelled";
export type ValidationStatus = "pass" | "warning" | "fail";
export type ExternalValidationStatus = ValidationStatus | "unavailable";
export type TranslationStyle = "faithful" | "fluent" | "academic" | "popular";

export interface BookMetadata {
  title: string;
  author: string;
  language: string;
}

export interface Chapter {
  id: string;
  href: string;
  absolutePath: string;
  title: string;
  text: string;
  html: string;
  mediaType: string;
  order: number;
}

export interface ImportedBook {
  filePath: string;
  rootFilePath: string;
  opfDir: string;
  metadata: BookMetadata;
  chapters: Chapter[];
  bookFingerprint?: string;
  loadedProfile?: TranslationProfile;
}

export interface TranslationSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
  useMock?: boolean;
  glossary?: string;
  style?: TranslationStyle;
  epubCheckCommand?: string;
}

export interface ChapterProgress {
  chapterId: string;
  chapterTitle: string;
  currentChunk: number;
  totalChunks: number;
  status: TranslationStatus;
  error?: string;
}

export interface TranslationProgress {
  currentChapter?: string;
  translatedChunks: number;
  totalChunks: number;
  status: TranslationStatus;
  chapters: ChapterProgress[];
  log: string[];
}

export interface TranslatedChapter {
  chapterId: string;
  href: string;
  html: string;
}

export interface TranslationJobResult {
  book: ImportedBook;
  translatedChapters: TranslatedChapter[];
  jobId: string;
}

export interface Translator {
  translate(text: string, signal?: AbortSignal): Promise<string>;
}

export interface ValidationReport {
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
  checkedFiles: string[];
  summary: string;
  opfPath?: string;
  manifestItemCount?: number;
  spineItemCount?: number;
  xhtmlCheckedCount?: number;
}

export interface ExportedEpubResult {
  outputPath: string;
  validation: ValidationReport;
  externalValidation?: ExternalEpubCheckReport;
}

export interface ExternalEpubCheckReport {
  status: ExternalValidationStatus;
  summary: string;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  command?: string;
  issues?: ExternalEpubCheckIssue[];
  rawOutput?: string;
  durationMs?: number;
  commandDisplay?: string;
}

export interface ExternalEpubCheckIssue {
  severity: "error" | "warning" | "info";
  code?: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

export interface IpcResult<T> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface JobChapterDetail {
  chapterId: string;
  index: number;
  title: string;
  status: TranslationStatus;
  completedChunks: number;
  totalChunks: number;
  failedReason?: string;
  updatedAt: string;
}

export interface TranslationJobSummary {
  jobId: string;
  bookTitle: string;
  sourceEpubPath: string;
  targetLanguage: string;
  createdAt: string;
  updatedAt: string;
  totalChapters: number;
  completedChapters: number;
  failedChapters: number;
  pendingChapters: number;
  status: "running" | "paused" | "completed" | "failed" | "cancelled";
  chapters: JobChapterDetail[];
}

export interface ExportHistoryItem {
  id: string;
  jobId?: string;
  sourceBookTitle?: string;
  sourceEpubPath?: string;
  outputEpubPath: string;
  createdAt: string;
  validationStatus: ValidationStatus | "unknown";
  externalValidationStatus?: ExternalValidationStatus;
  targetLanguage: string;
  model?: string;
  glossaryHash?: string;
  style?: string;
  fileExists?: boolean | "unknown";
  fileSize?: number;
  lastModified?: string;
}

export interface TranslationProfile {
  id: string;
  bookFingerprint: string;
  bookTitle?: string;
  sourceLanguage?: string;
  targetLanguage: string;
  style: TranslationStyle;
  glossary: string;
  model?: string;
  baseUrl?: string;
  updatedAt: string;
}
