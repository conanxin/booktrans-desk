import type { UnifiedDocument } from "../../shared/documentModel.js";
import { documentKindPromptHint } from "./analysisPrompts.js";

export interface AnalysisSource {
  unitId: string;
  pageNumber?: number;
  chapterId?: string;
  chapterTitle?: string;
  quote: string;
}

export interface DocumentAnalysisRecord {
  id: string;
  documentId: string;
  mode: "quick";
  status: "completed";
  title: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  documentKind?: string;
  promptHint: string;
  sources: AnalysisSource[];
  createdAt: string;
}

export class AnalysisService {
  private readonly records = new Map<string, DocumentAnalysisRecord>();

  startQuickAnalysis(document: UnifiedDocument): DocumentAnalysisRecord {
    const textUnits = document.units.filter((unit) => unit.text.trim());
    const sampleUnits = textUnits.slice(0, 5);
    const fullText = textUnits.map((unit) => unit.text).join("\n\n");
    const record: DocumentAnalysisRecord = {
      id: `analysis-${document.id}`,
      documentId: document.id,
      mode: "quick",
      status: "completed",
      title: document.title,
      summary: summarize(fullText, document.title),
      keyPoints: buildKeyPoints(document, sampleUnits.map((unit) => unit.text)),
      keywords: extractKeywords(fullText),
      documentKind: document.documentKind?.kind,
      promptHint: documentKindPromptHint(document),
      sources: sampleUnits.map((unit) => ({
        unitId: unit.id,
        pageNumber: unit.pageNumber,
        chapterId: unit.chapterId,
        chapterTitle: unit.chapterTitle,
        quote: trimQuote(unit.text)
      })),
      createdAt: new Date().toISOString()
    };
    this.records.set(document.id, record);
    return record;
  }

  getAnalysis(documentId: string): DocumentAnalysisRecord | null {
    return this.records.get(documentId) ?? null;
  }
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

