import { analysisStateToRecord } from "../analysis/analysisService.js";
import type { UnifiedDocument } from "../../shared/documentModel.js";
import { formatChatSource } from "../../shared/documentDisplayUtils.js";
import { getUnitSourceHint } from "../../shared/documentReaderUtils.js";

export type ExportPresetId = "study-notes" | "research-digest" | "presentation-outline" | "podcast-prep";

export interface ExportPresetDefinition {
  id: ExportPresetId;
  label: string;
  description: string;
  extension: "md";
}

export const EXPORT_PRESETS: ExportPresetDefinition[] = [
  {
    id: "study-notes",
    label: "Study Notes",
    description: "Reading notes with summary, key points, Q&A highlights, sources, and a personal notes area.",
    extension: "md"
  },
  {
    id: "research-digest",
    label: "Research Digest",
    description: "A research-oriented digest with core questions, findings, limitations, and source hints.",
    extension: "md"
  },
  {
    id: "presentation-outline",
    label: "Presentation Outline",
    description: "A 5-8 slide outline with bullets, speaker-note placeholders, and source hints.",
    extension: "md"
  },
  {
    id: "podcast-prep",
    label: "Podcast Prep",
    description: "A show-prep document with opening script, discussion questions, segment outline, quotes, and wrap-up.",
    extension: "md"
  }
];

export function getExportPreset(id: string): ExportPresetDefinition | undefined {
  return EXPORT_PRESETS.find((preset) => preset.id === id);
}

export function buildExportPresetMarkdown(document: UnifiedDocument, presetId: ExportPresetId): string {
  switch (presetId) {
    case "study-notes":
      return buildStudyNotes(document);
    case "research-digest":
      return buildResearchDigest(document);
    case "presentation-outline":
      return buildPresentationOutline(document);
    case "podcast-prep":
      return buildPodcastPrep(document);
  }
}

function buildStudyNotes(document: UnifiedDocument): string {
  const analysis = getAnalysis(document);
  return compactLines([
    `# ${document.title} - Study Notes`,
    "",
    "## File Information",
    `- Source format: ${document.sourceFormat}`,
    `- Document type: ${document.documentKind?.kind ?? analysis.documentKind ?? "unknown"}`,
    `- Units: ${document.units.length}`,
    "",
    "## One Sentence Summary",
    analysis.oneSentenceSummary || fallbackSummary(document),
    "",
    "## Core Summary",
    analysis.summary || fallbackSummary(document),
    "",
    "## Key Points",
    ...bulletLines(analysis.keyPoints, ["No key points have been generated yet."]),
    "",
    "## Keywords",
    analysis.keywords.length ? analysis.keywords.join(", ") : "None",
    "",
    "## Important Q&A Highlights",
    ...chatHighlightLines(document),
    "",
    "## Source Hints",
    ...sourceHintLines(document),
    "",
    "## Personal Notes",
    "- "
  ]);
}

function buildResearchDigest(document: UnifiedDocument): string {
  const analysis = getAnalysis(document);
  return compactLines([
    `# ${document.title} - Research Digest`,
    "",
    "## Research Object",
    `${document.title} (${document.sourceFormat.toUpperCase()})`,
    "",
    "## Core Question",
    analysis.oneSentenceSummary || "What does this document argue, explain, or reveal?",
    "",
    "## Method / Argument Trail",
    ...outlineOrUnitLines(document),
    "",
    "## Key Findings",
    ...bulletLines(analysis.keyPoints, [analysis.summary || fallbackSummary(document)]),
    "",
    "## Limitations / To Verify",
    "- Verify the quick analysis against the original source text.",
    "- Check whether the selected sources cover the full document.",
    "",
    "## Quotable Points",
    ...quoteLines(document),
    "",
    "## Sources",
    ...sourceHintLines(document)
  ]);
}

function buildPresentationOutline(document: UnifiedDocument): string {
  const analysis = getAnalysis(document);
  const slideTitles = ["Context", "Main Idea", "Key Point 1", "Key Point 2", "Evidence", "Implications", "Discussion", "Wrap-Up"];
  const keyPoints = analysis.keyPoints.length ? analysis.keyPoints : [analysis.summary || fallbackSummary(document)];
  return compactLines([
    `# ${document.title} - Presentation Outline`,
    "",
    `Presentation title: ${document.title}`,
    "",
    ...slideTitles.slice(0, Math.min(8, Math.max(5, keyPoints.length + 3))).flatMap((title, index) => [
      `## Slide ${index + 1}: ${title}`,
      ...bulletLines([keyPoints[index % keyPoints.length]], ["Add a focused bullet for this slide."]),
      "Speaker notes: ",
      sourceHintForIndex(document, index),
      ""
    ])
  ]);
}

function buildPodcastPrep(document: UnifiedDocument): string {
  const analysis = getAnalysis(document);
  return compactLines([
    `# ${document.title} - Podcast Prep`,
    "",
    "## Show Title Ideas",
    `- Reading ${document.title}`,
    `- What ${document.title} Reveals`,
    "",
    "## Opening Draft",
    `Today we are unpacking ${document.title}. ${analysis.oneSentenceSummary || fallbackSummary(document)}`,
    "",
    "## Discussion Questions",
    ...discussionQuestionLines(analysis.keyPoints),
    "",
    "## Segment Outline",
    "- Setup: introduce the document and why it matters.",
    "- Walkthrough: explain the main argument or story.",
    "- Evidence: discuss the strongest sources and examples.",
    "- Reflection: connect the document to open questions.",
    "",
    "## Quotes / Clips",
    ...quoteLines(document),
    "",
    "## Closing Summary",
    analysis.summary || fallbackSummary(document),
    "",
    "## Extension Questions",
    "- What would change if this document were read from another perspective?",
    "- Which source should be checked next?"
  ]);
}

function getAnalysis(document: UnifiedDocument) {
  return (
    analysisStateToRecord(document, document.analysisState) ?? {
      oneSentenceSummary: "",
      summary: "",
      keyPoints: [],
      keywords: [],
      documentKind: document.documentKind?.kind,
      sources: []
    }
  );
}

function fallbackSummary(document: UnifiedDocument): string {
  const firstText = document.units.find((unit) => unit.text.trim())?.text.replace(/\s+/g, " ").trim();
  return firstText ? truncate(firstText, 260) : "No extractable text is available yet.";
}

function bulletLines(values: string[] | undefined, fallback: string[]): string[] {
  const source = values?.filter(Boolean).length ? values.filter(Boolean) : fallback;
  return source.map((item) => `- ${item}`);
}

function chatHighlightLines(document: UnifiedDocument): string[] {
  const assistantMessages = (document.chatMessages ?? []).filter((message) => message.role === "assistant").slice(-4);
  if (!assistantMessages.length) {
    return ["- No chat highlights yet."];
  }
  return assistantMessages.map((message) => `- ${truncate(message.content.replace(/\s+/g, " ").trim(), 260)}`);
}

function sourceHintLines(document: UnifiedDocument): string[] {
  const hints = new Set<string>();
  for (const unit of document.units.slice(0, 8)) {
    hints.add(getUnitSourceHint(unit));
  }
  for (const message of document.chatMessages ?? []) {
    for (const source of message.sources ?? []) {
      hints.add(formatChatSource(source));
    }
  }
  return hints.size ? [...hints].slice(0, 10).map((hint) => `- ${hint}`) : ["- No sources available."];
}

function outlineOrUnitLines(document: UnifiedDocument): string[] {
  if (document.outline.length) {
    return document.outline.slice(0, 8).map((node) => `- ${node.title}`);
  }
  return document.units.slice(0, 6).map((unit) => `- ${truncate(unit.text.replace(/\s+/g, " ").trim(), 140)}`);
}

function quoteLines(document: UnifiedDocument): string[] {
  const quotes = (document.chatMessages ?? []).flatMap((message) => message.sources?.map((source) => source.quote).filter(Boolean) ?? []);
  const source = quotes.length ? quotes : document.units.slice(0, 4).map((unit) => unit.text);
  return source.length ? source.slice(0, 6).map((quote) => `- ${truncate(String(quote).replace(/\s+/g, " ").trim(), 220)}`) : ["- No quotes available."];
}

function discussionQuestionLines(keyPoints: string[]): string[] {
  if (!keyPoints.length) {
    return ["- What is the main idea?", "- Which source is most persuasive?", "- What should listeners remember?"];
  }
  return keyPoints.slice(0, 5).map((point) => `- How should we understand: ${point}`);
}

function sourceHintForIndex(document: UnifiedDocument, index: number): string {
  const source = document.units[index % Math.max(document.units.length, 1)];
  return source ? `Source: ${getUnitSourceHint(source)}` : "Source: add source hint.";
}

function compactLines(lines: string[]): string {
  return lines.map((line) => (line === "undefined" || line === "null" ? "" : line)).join("\n").replace(/\n{4,}/g, "\n\n\n");
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, Math.max(0, max - 3))}...` : value;
}
