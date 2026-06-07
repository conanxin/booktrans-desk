import type { DocumentAnalysisRecord } from "../analysis/analysisService.js";
import type { DocumentChatMessage } from "../chat/documentChatService.js";
import type { UnifiedDocument, UnifiedDocumentOutlineNode } from "../../shared/documentModel.js";

export function unifiedDocumentToMarkdown(document: UnifiedDocument): string {
  const lines = [
    `# ${document.title}`,
    "",
    `Source format: ${document.sourceFormat}`,
    `Source path: ${document.sourcePath}`,
    `Document type: ${document.documentKind?.kind ?? "unknown"}`,
    "",
    "## Metadata",
    ...metadataLines(document.metadata),
    "",
    "## Outline",
    ...outlineLines(document.outline),
    "",
    "## Content",
    ...document.units.map((unit) => {
      const source = [unit.chapterTitle, unit.pageNumber ? `page ${unit.pageNumber}` : undefined].filter(Boolean).join(", ");
      return [`### ${unit.id}`, source ? `Source: ${source}` : undefined, "", unit.text].filter(Boolean).join("\n");
    })
  ];
  return lines.join("\n");
}

export function chatToMarkdown(title: string, messages: DocumentChatMessage[]): string {
  return [
    `# ${title} Chat`,
    "",
    ...messages.map((message) => {
      const sources = message.sources?.length
        ? [
            "",
            "Sources:",
            ...message.sources.map((source) => {
              const locator = [source.unitId, source.pageNumber ? `page ${source.pageNumber}` : undefined].filter(Boolean).join(", ");
              return `- ${source.sourceHint || source.unitId} (${locator}): ${source.quote}`;
            })
          ]
        : [];
      return [`## ${message.role}`, "", message.content, ...sources].join("\n");
    })
  ].join("\n\n");
}

export function analysisToMarkdown(analysis: DocumentAnalysisRecord): string {
  return [
    `# ${analysis.title} Analysis`,
    "",
    `Document type: ${analysis.documentKind ?? "unknown"}`,
    `Language: ${analysis.language ?? "unknown"}`,
    `Analyzed at: ${analysis.analyzedAt}`,
    "",
    "## One Sentence Summary",
    analysis.oneSentenceSummary,
    "",
    "## Summary",
    analysis.summary,
    "",
    "## Key Points",
    ...analysis.keyPoints.map((point) => `- ${point}`),
    "",
    "## Keywords",
    analysis.keywords.length ? analysis.keywords.join(", ") : "None",
    "",
    "## Sources",
    ...analysis.sources.map((source) => `- ${source.unitId}${source.pageNumber ? `, page ${source.pageNumber}` : ""}: ${source.quote}`)
  ].join("\n");
}

function metadataLines(metadata: UnifiedDocument["metadata"]): string[] {
  const entries = Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null && value !== "");
  return entries.length ? entries.map(([key, value]) => `- ${key}: ${String(value)}`) : ["- None"];
}

function outlineLines(outline: UnifiedDocumentOutlineNode[], depth = 0): string[] {
  if (!outline.length && depth === 0) {
    return ["- None"];
  }
  return outline.flatMap((node) => [`${"  ".repeat(depth)}- ${node.title}`, ...outlineLines(node.children, depth + 1)]);
}
