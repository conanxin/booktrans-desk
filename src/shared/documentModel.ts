export type SourceFormat = "pdf" | "epub" | "docx";

export type DocumentUnitRole =
  | "title"
  | "subtitle"
  | "heading"
  | "paragraph"
  | "chapter"
  | "page"
  | "quote"
  | "header"
  | "footer"
  | "reference"
  | "unknown";

export interface DocumentUnitBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DocumentUnit {
  id: string;
  documentId: string;
  sourceFormat: SourceFormat;
  role: DocumentUnitRole;
  text: string;
  order: number;
  chapterId?: string;
  chapterTitle?: string;
  pageNumber?: number;
  sourceHref?: string;
  bbox?: DocumentUnitBoundingBox;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface DocumentChapter {
  id: string;
  documentId: string;
  title: string;
  order: number;
  unitIds: string[];
  sourceHref?: string;
  pageNumber?: number;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface UnifiedDocumentOutlineNode {
  id: string;
  title: string;
  level: number;
  order: number;
  unitId?: string;
  chapterId?: string;
  pageNumber?: number;
  children: UnifiedDocumentOutlineNode[];
}

export type UnifiedDocumentKindValue =
  | "paper"
  | "interview"
  | "business-report"
  | "fiction"
  | "manual"
  | "book-chapter"
  | "article"
  | "unknown";

export interface UnifiedDocumentKind {
  kind: UnifiedDocumentKindValue;
  confidence: number;
  reasons: string[];
  signals: string[];
  detectedAt: string;
}

export interface TranslationUnitRecord {
  unitId: string;
  sourceUnitId?: string;
  sourceText: string;
  translatedText?: string;
  status: "pending" | "completed" | "failed" | "missing" | "experimental";
  source?: "epub-translation" | "pdf-experimental" | "manual" | "missing";
  updatedAt: string;
}

export interface TranslationVersion {
  id: string;
  documentId: string;
  jobId?: string;
  source?: "epub-translation" | "pdf-experimental" | "manual" | "missing";
  provider?: string;
  model?: string;
  style?: string;
  targetLanguage: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  unitTranslations: TranslationUnitRecord[];
  createdAt: string;
  updatedAt: string;
}

export type ExportRecordFormat = "epub" | "pdf" | "markdown" | "json" | "pptx" | "zip" | "html";

export interface ExportRecord {
  id: string;
  documentId: string;
  format: ExportRecordFormat;
  outputPath: string;
  title?: string;
  createdAt: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export interface UnifiedParseDiagnostics {
  parser: string;
  parserVersion?: string;
  textLength: number;
  pageCount?: number;
  chapterCount?: number;
  unitCount: number;
  isScannedLike?: boolean;
  warnings: string[];
  errors: string[];
}

export interface UnifiedAnalysisSource {
  unitId: string;
  pageNumber?: number;
  chapterId?: string;
  chapterTitle?: string;
  role?: DocumentUnitRole | string;
  quote?: string;
}

export interface UnifiedAnalysisSection {
  title: string;
  summary: string;
  keyPoints?: string[];
}

export interface UnifiedAnalysisResult {
  id?: string;
  documentId?: string;
  mode?: "quick" | "full";
  status?: "completed";
  title?: string;
  oneSentenceSummary?: string;
  summary?: string;
  keyPoints?: string[];
  keywords?: string[];
  documentType?: string;
  language?: string;
  promptHint?: string;
  sections?: UnifiedAnalysisSection[];
  sources?: UnifiedAnalysisSource[];
  sourceUnitIds?: string[];
  analyzedAt?: string;
  createdAt?: string;
}

export interface AnalysisState {
  status: "idle" | "running" | "completed" | "failed";
  mode: "quick" | "full";
  result?: UnifiedAnalysisResult;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  updatedAt?: string;
  provider?: string;
  model?: string;
}

export interface ChatSource {
  unitId: string;
  sourceHint: string;
  pageNumber?: number;
  chapterId?: string;
  chapterTitle?: string;
  role?: DocumentUnitRole | string;
  quote?: string;
  score?: number;
}

export interface ChatMessage {
  id: string;
  documentId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: ChatSource[];
}

export interface UnifiedDocument {
  id: string;
  sourceFormat: SourceFormat;
  sourcePath: string;
  title: string;
  metadata: Record<string, string | number | boolean | null | undefined>;
  units: DocumentUnit[];
  chapters: DocumentChapter[];
  outline: UnifiedDocumentOutlineNode[];
  documentKind?: UnifiedDocumentKind;
  analysisState?: AnalysisState;
  chatMessages?: ChatMessage[];
  translations: TranslationVersion[];
  exports: ExportRecord[];
  diagnostics: UnifiedParseDiagnostics;
  createdAt: string;
  updatedAt: string;
}
