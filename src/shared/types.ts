export type TranslationStatus = "pending" | "translating" | "completed" | "failed" | "cancelled";
export type ValidationStatus = "pass" | "warning" | "fail";
export type ExternalValidationStatus = ValidationStatus | "unavailable";
export type TranslationStyle = "faithful" | "fluent" | "academic" | "popular";
export type ProviderPreset = "openai-compatible" | "minimax";
export type SourceDocumentType = "epub" | "pdf";
export type PdfRegionRole = "title" | "subtitle" | "body-left-column" | "body-right-column" | "quote-box" | "header" | "footer" | "references";
export type TranslationErrorCode =
  | "USER_CANCELLED"
  | "PDF_NO_TEXT"
  | "PDF_CHUNKING_FAILED"
  | "PROVIDER_REQUEST_FAILED"
  | "PROVIDER_AUTH_FAILED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_TIMEOUT"
  | "TRANSLATION_OUTPUT_INVALID"
  | "TRANSLATION_QUALITY_GATE_BLOCKED"
  | "UNKNOWN_TRANSLATION_ERROR";

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

export interface PdfPageInfo {
  pageNumber: number;
  textLength: number;
  paragraphCount: number;
  status: "pending" | "translating" | "completed" | "failed" | "skipped";
}

export interface PdfParagraph {
  id: string;
  pageNumber: number;
  index: number;
  text: string;
  role?: PdfRegionRole;
  bbox?: PdfBoundingBox;
}

export interface PdfBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfPage {
  pageNumber: number;
  text: string;
  paragraphs: PdfParagraph[];
}

export interface PdfDocumentInfo {
  type: "pdf";
  title?: string;
  author?: string;
  filePath: string;
  pageCount: number;
  textLength: number;
  pages: PdfPageInfo[];
  isScannedLike: boolean;
}

export interface ImportedPdfDocument extends PdfDocumentInfo {
  pageTexts: PdfPage[];
}

export type ImportedDocument = ImportedBook | ImportedPdfDocument;

export interface ImportedBook {
  type?: "epub";
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
  providerPreset?: ProviderPreset;
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
  documentType?: SourceDocumentType;
  currentChapter?: string;
  currentPage?: number;
  translatedPages?: number;
  totalPages?: number;
  translatedChunks: number;
  totalChunks: number;
  status: TranslationStatus;
  chapters: ChapterProgress[];
  log: string[];
  quality?: TranslationQualityProgress;
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

export interface TranslatedPdfPage {
  pageNumber: number;
  paragraphs: Array<{
    index: number;
    source: string;
    translated: string;
    id?: string;
    role?: PdfRegionRole;
  }>;
}

export interface PdfTranslationJobResult {
  document: ImportedPdfDocument;
  translatedPages: TranslatedPdfPage[];
  jobId: string;
}

export interface Translator {
  translate(text: string, signal?: AbortSignal, context?: TranslationRequestContext): Promise<string>;
}

export interface TranslationRequestContext {
  repair?: boolean;
}

export interface TranslationQualityProgress {
  cleanedReasoningCount: number;
  retryCount: number;
  failedChunkCount: number;
  status: "normal" | "warning" | "failed";
  warnings: string[];
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

export interface PdfValidationReport {
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
  checkedFiles: string[];
  summary: string;
  pageCount?: number;
  fileSize?: number;
  title?: string;
  author?: string;
}

export interface ExportedPdfResult {
  outputPath: string;
  validation: PdfValidationReport;
}

export type ExportedDocumentResult = ExportedEpubResult | ExportedPdfResult;

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
  code?: TranslationErrorCode;
}

export interface TranslatorConnectionTestResult {
  status: "success" | "auth_failed" | "timeout" | "invalid_response" | "failed";
  message: string;
  code?: TranslationErrorCode;
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
  sourceType?: SourceDocumentType;
  bookTitle: string;
  sourceEpubPath: string;
  sourcePath?: string;
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
  sourceType?: SourceDocumentType;
  exportCategory?: "translation" | "knowledge";
  exportKind?:
    | "translated-epub"
    | "translated-pdf"
    | "document-markdown"
    | "document-json"
    | "chat-markdown"
    | "analysis-markdown"
    | "study-notes"
    | "research-digest"
    | "presentation-outline"
    | "podcast-prep"
    | "full-archive"
    | "pptx"
    | "bilingual-markdown"
    | "bilingual-html"
    | "bilingual-markdown-selected"
    | "bilingual-html-selected";
  exportScope?: string;
  translationVersionId?: string;
  translationVersionLabel?: string;
  translationStatusSummary?: string;
  sourceDocumentId?: string;
  sourceDocumentTitle?: string;
  sourceBookTitle?: string;
  sourceEpubPath?: string;
  sourcePath?: string;
  outputEpubPath: string;
  outputPath?: string;
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

export interface ExportValidation {
  status: "pass" | "warning" | "fail";
  errors: string[];
  warnings: string[];
  checkedFiles?: string[];
  summary: string;
}

export interface KnowledgeExportResult {
  ok: boolean;
  canceled?: boolean;
  outputPath?: string;
  exportKind: NonNullable<ExportHistoryItem["exportKind"]>;
  validation?: ExportValidation;
  historyItem?: ExportHistoryItem;
  error?: string;
}

export interface BilingualExportScope {
  type: "full" | "chapter" | "page" | "units";
  chapterId?: string;
  pageNumber?: number;
  unitIds?: string[];
}

export type BilingualHtmlLayout = "side-by-side" | "stacked";

export interface BilingualExportOptions {
  format: "markdown" | "html";
  scope: BilingualExportScope;
  htmlLayout?: BilingualHtmlLayout;
  translationVersionId?: string;
  translationResolution?: "latest" | "specific" | "none";
}

export interface BilingualExportUnit {
  unitId: string;
  sourceHint: string;
  chapterId?: string;
  chapterTitle?: string;
  pageNumber?: number;
  role?: string;
  originalText: string;
  translatedText?: string;
  translationStatus: "available" | "missing" | "experimental";
}

export interface TranslationSummary {
  totalUnits: number;
  translatedUnits: number;
  missingUnits: number;
  experimentalUnits: number;
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
