export type TranslationStatus = "pending" | "translating" | "completed" | "failed" | "cancelled";

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
}

export interface Translator {
  translate(text: string, signal?: AbortSignal): Promise<string>;
}
