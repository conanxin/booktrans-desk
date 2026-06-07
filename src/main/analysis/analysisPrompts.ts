import type { UnifiedDocument } from "../../shared/documentModel.js";

export function documentKindPromptHint(document: UnifiedDocument): string {
  switch (document.documentKind?.kind) {
    case "paper":
      return "Document kind hint: academic paper. Focus on research question, method, results, conclusion, limitations, and references.";
    case "interview":
      return "Document kind hint: interview. Focus on speakers, questions, answers, viewpoints, quotes, and topic shifts.";
    case "business-report":
      return "Document kind hint: business report. Focus on metrics, revenue, risk, strategy, business segments, and governance.";
    case "fiction":
      return "Document kind hint: fiction. Focus on characters, scenes, plot, theme, conflicts, and narrative voice.";
    case "manual":
      return "Document kind hint: manual. Focus on procedures, warnings, configuration, parameters, troubleshooting, and FAQ.";
    case "book-chapter":
      return "Document kind hint: book chapter. Focus on concepts, structure, examples, arguments, and key explanations.";
    case "article":
      return "Document kind hint: article. Use a general reading-analysis approach.";
    default:
      return "Document kind hint: unknown. Use a general reading-analysis approach and avoid over-specialized assumptions.";
  }
}

export function buildQuickAnalysisPrompt(document: UnifiedDocument, excerpt: string): string {
  return [
    "Analyze this document and return concise JSON with summary, keyPoints, keywords, and source notes.",
    documentKindPromptHint(document),
    `Title: ${document.title}`,
    `Source format: ${document.sourceFormat}`,
    "Excerpt:",
    excerpt
  ].join("\n\n");
}

