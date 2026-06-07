import type { PdfParagraph, PdfRegionRole, Translator } from "../../shared/types.js";
import { sanitizeTranslationOutput } from "../translate/sanitizeTranslationOutput.js";
import { createTranslationError } from "../translate/translationErrors.js";
import { validateTranslationOutput } from "../translate/validateTranslationOutput.js";

export interface StructuredPdfParagraphInput {
  id: string;
  role: PdfRegionRole;
  pageNumber: number;
  sourceText: string;
}

export interface StructuredPdfParagraphTranslation {
  id: string;
  translation: string;
}

export function toStructuredParagraphInputs(paragraphs: PdfParagraph[]): StructuredPdfParagraphInput[] {
  return paragraphs.map((paragraph) => ({
    id: paragraph.id,
    role: paragraph.role ?? "body-left-column",
    pageNumber: paragraph.pageNumber,
    sourceText: paragraph.text
  }));
}

export async function translateStructuredParagraphs(
  translator: Translator,
  paragraphs: StructuredPdfParagraphInput[],
  signal?: AbortSignal
): Promise<StructuredPdfParagraphTranslation[]> {
  if (!paragraphs.length) {
    return [];
  }
  const raw = await translator.translate(buildStructuredTranslationPrompt(paragraphs), signal);
  const sanitized = sanitizeTranslationOutput(raw);
  if (!sanitized.isValid) {
    throw createTranslationError("TRANSLATION_OUTPUT_INVALID", sanitized.reasons.join(", "));
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(sanitized.cleanedText);
  } catch (error) {
    throw createTranslationError("TRANSLATION_OUTPUT_INVALID", error);
  }
  const translations = validateStructuredTranslationResponse(paragraphs, parsed);
  for (const [index, translation] of translations.entries()) {
    const source = paragraphs[index].sourceText;
    const validation = validateTranslationOutput(source, translation.translation);
    if (!validation.ok) {
      throw createTranslationError("TRANSLATION_OUTPUT_INVALID", validation.errors.join(", "));
    }
  }
  return translations;
}

export function validateStructuredTranslationResponse(
  paragraphs: StructuredPdfParagraphInput[],
  response: unknown
): StructuredPdfParagraphTranslation[] {
  if (!Array.isArray(response)) {
    throw createTranslationError("TRANSLATION_OUTPUT_INVALID", "structured translation response is not an array");
  }
  if (response.length !== paragraphs.length) {
    throw createTranslationError("TRANSLATION_OUTPUT_INVALID", "structured translation response length mismatch");
  }
  return response.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw createTranslationError("TRANSLATION_OUTPUT_INVALID", "structured translation item is not an object");
    }
    const record = item as Record<string, unknown>;
    const expected = paragraphs[index].id;
    if (record.id !== expected) {
      throw createTranslationError("TRANSLATION_OUTPUT_INVALID", `structured translation id mismatch: expected ${expected}`);
    }
    if (typeof record.translation !== "string" || !record.translation.trim()) {
      throw createTranslationError("TRANSLATION_OUTPUT_INVALID", `structured translation missing text for ${expected}`);
    }
    return { id: expected, translation: record.translation.trim() };
  });
}

export function buildStructuredTranslationPrompt(paragraphs: StructuredPdfParagraphInput[]): string {
  return [
    "STRUCTURED_PDF_TRANSLATION_REQUEST",
    "Translate each sourceText field into Simplified Chinese.",
    "Return only a JSON array. Each item must be {\"id\":\"...\",\"translation\":\"...\"}.",
    "Keep the same ids, same order, and same number of items.",
    "Do not output explanations, Markdown, <think>, or prompt commentary.",
    JSON.stringify(paragraphs)
  ].join("\n");
}
