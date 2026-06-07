import type { UnifiedDocument } from "../../shared/documentModel.js";
import type { BilingualExportScope } from "../../shared/types.js";
import { buildBilingualPayload, formatTranslationSummary, MISSING_TRANSLATION_PLACEHOLDER } from "./bilingualExportCore.js";

export function bilingualDocumentToMarkdown(document: UnifiedDocument, scope: BilingualExportScope): string {
  const payload = buildBilingualPayload(document, scope);
  const lines = [
    `# ${document.title} · 双语导出`,
    "",
    `- Source format: ${document.sourceFormat}`,
    `- Document kind: ${document.documentKind?.kind ?? "unknown"}`,
    `- Scope: ${payload.scopeLabel}`,
    `- Generated at: ${payload.generatedAt}`,
    `- Translation summary: ${formatTranslationSummary(payload.summary)}`,
    "",
    "---",
    "",
    ...payload.units.flatMap((unit, index) => [
      `## ${index + 1}. ${cleanMarkdown(unit.sourceHint)}`,
      "",
      `- Unit: ${unit.unitId}`,
      unit.chapterTitle ? `- Chapter: ${cleanMarkdown(unit.chapterTitle)}` : undefined,
      unit.pageNumber ? `- Page: ${unit.pageNumber}` : undefined,
      unit.role ? `- Role: ${unit.role}` : undefined,
      `- Translation status: ${unit.translationStatus}`,
      "",
      "### 原文",
      "",
      cleanMarkdown(unit.originalText),
      "",
      "### 译文",
      "",
      cleanMarkdown(unit.translatedText || MISSING_TRANSLATION_PLACEHOLDER),
      ""
    ])
  ];
  return lines.filter((line): line is string => line !== undefined).join("\n").replace(/\n{4,}/g, "\n\n\n");
}

function cleanMarkdown(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
