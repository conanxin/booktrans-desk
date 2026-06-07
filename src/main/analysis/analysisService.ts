import type { AnalysisState, UnifiedAnalysisResult, UnifiedDocument } from "../../shared/documentModel.js";
import type { DocumentLibraryStore } from "../document/documentLibraryStore.js";
import { documentKindPromptHint } from "./analysisPrompts.js";

export interface AnalysisSource {
  unitId: string;
  pageNumber?: number;
  chapterId?: string;
  chapterTitle?: string;
  role?: string;
  quote: string;
}

export interface DocumentAnalysisRecord {
  id: string;
  documentId: string;
  mode: "quick";
  status: "completed";
  title: string;
  oneSentenceSummary: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  documentKind?: string;
  language?: string;
  promptHint: string;
  sources: AnalysisSource[];
  analyzedAt: string;
  createdAt: string;
}

export class AnalysisService {
  private readonly records = new Map<string, DocumentAnalysisRecord>();

  startQuickAnalysis(document: UnifiedDocument): DocumentAnalysisRecord {
    const textUnits = document.units.filter((unit) => unit.text.trim());
    const sampleUnits = textUnits.slice(0, 5);
    const fullText = textUnits.map((unit) => unit.text).join("\n\n");
    const createdAt = new Date().toISOString();
    const summary = summarize(fullText, document.title);
    const record: DocumentAnalysisRecord = {
      id: `analysis-${document.id}`,
      documentId: document.id,
      mode: "quick",
      status: "completed",
      title: document.title,
      oneSentenceSummary: splitSentences(fullText)[0] ?? summary,
      summary,
      keyPoints: buildKeyPoints(document, sampleUnits.map((unit) => unit.text)),
      keywords: extractKeywords(fullText),
      documentKind: document.documentKind?.kind,
      language: typeof document.metadata.language === "string" ? document.metadata.language : undefined,
      promptHint: documentKindPromptHint(document),
      sources: sampleUnits.map((unit) => ({
        unitId: unit.id,
        pageNumber: unit.pageNumber,
        chapterId: unit.chapterId,
        chapterTitle: unit.chapterTitle,
        role: unit.role,
        quote: trimQuote(unit.text)
      })),
      analyzedAt: createdAt,
      createdAt
    };
    this.records.set(document.id, record);
    return record;
  }

  async startQuickAnalysisAndPersist(document: UnifiedDocument, store: DocumentLibraryStore, metadata: { provider?: string; model?: string } = {}): Promise<DocumentAnalysisRecord> {
    const startedAt = new Date().toISOString();
    await store.updateDocumentAnalysis(document.id, {
      status: "running",
      mode: "quick",
      startedAt,
      updatedAt: startedAt,
      provider: metadata.provider,
      model: metadata.model
    });

    try {
      const record = this.startQuickAnalysis(document);
      await store.updateDocumentAnalysis(document.id, recordToAnalysisState(record, metadata));
      return record;
    } catch (error) {
      const failedAt = new Date().toISOString();
      await store.updateDocumentAnalysis(document.id, {
        status: "failed",
        mode: "quick",
        error: error instanceof Error ? error.message : "Analysis failed.",
        startedAt,
        updatedAt: failedAt,
        provider: metadata.provider,
        model: metadata.model
      });
      throw error;
    }
  }

  getAnalysis(documentId: string): DocumentAnalysisRecord | null {
    return this.records.get(documentId) ?? null;
  }

  async getPersistedAnalysis(store: DocumentLibraryStore, documentId: string): Promise<DocumentAnalysisRecord | null> {
    const document = await store.readDocument(documentId);
    if (!document) {
      return this.getAnalysis(documentId);
    }
    return analysisStateToRecord(document, document.analysisState) ?? this.getAnalysis(documentId);
  }
}

export function recordToAnalysisState(record: DocumentAnalysisRecord, metadata: { provider?: string; model?: string } = {}): AnalysisState {
  return {
    status: "completed",
    mode: record.mode,
    result: recordToUnifiedResult(record),
    startedAt: record.createdAt,
    completedAt: record.analyzedAt,
    updatedAt: record.analyzedAt,
    provider: metadata.provider,
    model: metadata.model
  };
}

export function analysisStateToRecord(document: UnifiedDocument, state: AnalysisState | undefined): DocumentAnalysisRecord | null {
  if (!state?.result || state.status !== "completed") {
    return null;
  }
  const result = state.result;
  const analyzedAt = result.analyzedAt ?? state.completedAt ?? state.updatedAt ?? document.updatedAt;
  const createdAt = result.createdAt ?? state.startedAt ?? analyzedAt;
  return {
    id: result.id ?? `analysis-${document.id}`,
    documentId: result.documentId ?? document.id,
    mode: result.mode === "full" ? "quick" : "quick",
    status: "completed",
    title: result.title ?? document.title,
    oneSentenceSummary: result.oneSentenceSummary ?? result.summary ?? "",
    summary: result.summary ?? result.oneSentenceSummary ?? "",
    keyPoints: result.keyPoints ?? [],
    keywords: result.keywords ?? [],
    documentKind: result.documentType ?? document.documentKind?.kind,
    language: result.language ?? (typeof document.metadata.language === "string" ? document.metadata.language : undefined),
    promptHint: result.promptHint ?? documentKindPromptHint(document),
    sources: (result.sources ?? []).map((source) => ({
      unitId: source.unitId,
      pageNumber: source.pageNumber,
      chapterId: source.chapterId,
      chapterTitle: source.chapterTitle,
      role: typeof source.role === "string" ? source.role : undefined,
      quote: source.quote ?? ""
    })),
    analyzedAt,
    createdAt
  };
}

function recordToUnifiedResult(record: DocumentAnalysisRecord): UnifiedAnalysisResult {
  return {
    id: record.id,
    documentId: record.documentId,
    mode: record.mode,
    status: record.status,
    title: record.title,
    oneSentenceSummary: record.oneSentenceSummary,
    summary: record.summary,
    keyPoints: record.keyPoints,
    keywords: record.keywords,
    documentType: record.documentKind,
    language: record.language,
    promptHint: record.promptHint,
    sources: record.sources,
    sourceUnitIds: record.sources.map((source) => source.unitId),
    analyzedAt: record.analyzedAt,
    createdAt: record.createdAt
  };
}

function summarize(text: string, title: string): string {
  const sentences = splitSentences(text);
  if (sentences.length === 0) {
    return `${title} has no extractable text available for quick analysis.`;
  }
  return sentences.slice(0, 3).join(" ");
}

function buildKeyPoints(document: UnifiedDocument, excerpts: string[]): string[] {
  const points = document.outline.slice(0, 4).map((node) => `Covers ${node.title}.`);
  for (const excerpt of excerpts) {
    const sentence = splitSentences(excerpt)[0];
    if (sentence && points.length < 6) {
      points.push(sentence);
    }
  }
  return points.length ? points : ["No strong key points could be extracted from the available text."];
}

function extractKeywords(text: string): string[] {
  const words =
    text
      .toLowerCase()
      .match(/[a-z][a-z0-9-]{3,}|[\u4e00-\u9fff]{2,}/g)
      ?.filter((word) => !STOP_WORDS.has(word)) ?? [];
  const counts = new Map<string, number>();
  for (const word of words) {
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 8)
    .map(([word]) => word);
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?。！？])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function trimQuote(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}

const STOP_WORDS = new Set(["this", "that", "with", "from", "have", "about", "there", "their", "will", "would", "should", "chapter"]);
