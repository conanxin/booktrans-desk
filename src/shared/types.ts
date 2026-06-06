export type TranslationStatus = "pending" | "translating" | "completed" | "failed" | "cancelled";
export type ValidationStatus = "pass" | "warning" | "fail";
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
}

export interface ExportedEpubResult {
  outputPath: string;
  validation: ValidationReport;
}
