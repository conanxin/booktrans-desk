import type { AnalysisState, ChatSource, UnifiedDocument } from "./documentModel.js";

export interface DocumentStatusSummary {
  sourceFormat: string;
  documentKind: string;
  analysisStatus: string;
  chatCount: number;
  updatedAt: string;
  structure: string;
  pdfTranslationStatus?: string;
}

export function formatSourceFormat(format: UnifiedDocument["sourceFormat"]): string {
  return format.toUpperCase();
}

export function formatAnalysisStatus(state: AnalysisState | undefined): string {
  switch (state?.status) {
    case "completed":
      return "Analyzed";
    case "running":
      return "Analyzing";
    case "failed":
      return "Analysis failed";
    default:
      return "Not analyzed";
  }
}

export function formatDocumentUpdatedAt(value: string | undefined): string {
  if (!value) {
    return "Unknown";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function formatDocumentStructure(document: UnifiedDocument): string {
  if (document.sourceFormat === "pdf") {
    const pageCount = document.diagnostics.pageCount ?? document.chapters.filter((chapter) => typeof chapter.pageNumber === "number").length;
    return `${pageCount} pages / ${document.units.length} units`;
  }
  return `${document.chapters.length} chapters / ${document.units.length} units`;
}

export function summarizeDocumentStatus(document: UnifiedDocument): DocumentStatusSummary {
  return {
    sourceFormat: formatSourceFormat(document.sourceFormat),
    documentKind: document.documentKind?.kind ?? "unknown",
    analysisStatus: formatAnalysisStatus(document.analysisState),
    chatCount: document.chatMessages?.length ?? 0,
    updatedAt: formatDocumentUpdatedAt(document.updatedAt),
    structure: formatDocumentStructure(document),
    pdfTranslationStatus: document.sourceFormat === "pdf" ? "Experimental / HOLD" : undefined
  };
}

export function formatChatSource(source: ChatSource): string {
  const parts = [
    source.sourceHint || source.chapterTitle || source.unitId,
    source.pageNumber ? `page ${source.pageNumber}` : undefined,
    source.chapterTitle,
    source.role,
    source.unitId
  ].filter(Boolean);
  return [...new Set(parts)].join(" - ");
}

export function exportKindLabel(kind: "markdown" | "json" | "chat" | "analysis"): string {
  switch (kind) {
    case "markdown":
      return "Document Markdown";
    case "json":
      return "Document JSON";
    case "chat":
      return "Chat Markdown";
    case "analysis":
      return "Analysis Markdown";
  }
}
