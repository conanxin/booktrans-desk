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
