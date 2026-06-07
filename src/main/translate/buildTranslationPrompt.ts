import type { TranslationRequestContext, TranslationSettings, TranslationStyle } from "../../shared/types.js";

export interface TranslationMessage {
  role: "system" | "user";
  content: string;
}

export function buildTranslationPrompt(text: string, settings: Pick<TranslationSettings, "style" | "glossary">, context: TranslationRequestContext = {}): TranslationMessage[] {
  return [
    {
      role: "system",
      content: buildSystemPrompt(settings.style ?? "faithful", settings.glossary?.trim() ?? "", context)
    },
    {
      role: "user",
      content: buildUserPrompt(text, context)
    }
  ];
}

export function buildSystemPrompt(style: TranslationStyle, glossary: string, context: TranslationRequestContext = {}): string {
  const styleGuide: Record<TranslationStyle, string> = {
    faithful: "Style: faithful and accurate. Do not omit meaning.",
    fluent: "Style: natural and fluent Simplified Chinese.",
    academic: "Style: formal academic written Simplified Chinese.",
    popular: "Style: plain, accessible Simplified Chinese."
  };
  const glossaryInstruction = glossary ? `\nMandatory glossary. Follow these source => target mappings exactly:\n${glossary}` : "";
  const repairInstruction = context.repair
    ? [
        "",
        "The previous output violated the protocol. Translate again.",
        "Only output Simplified Chinese translation.",
        "Do not explain.",
        "Do not output <think>.",
        "Do not output English commentary.",
        "Do not output Translation:"
      ].join("\n")
    : "";

  return [
    "You are a strict translation engine, not a chat assistant.",
    "",
    "Task: translate the input text into Simplified Chinese.",
    "",
    "Hard rules:",
    "1. Output only the translated text.",
    "2. Do not explain.",
    "3. Do not summarize.",
    "4. Do not say 'Here is the translation'.",
    "5. Do not output Translation:, translated text:, Let me, I will, or The user wants.",
    "6. Do not output reasoning.",
    "7. Do not output <think>, </think>, or any reasoning content.",
    "8. Preserve proper nouns, numbers, citation markers, URLs, code, and placeholders.",
    "9. Preserve paragraph structure.",
    "10. If the input is already Chinese, lightly polish it without adding explanations.",
    styleGuide[style],
    glossaryInstruction,
    repairInstruction
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildUserPrompt(text: string, context: TranslationRequestContext = {}): string {
  const prefix = context.repair
    ? "Translate the content inside <source_text> again. Return only the translation and do not return the tags."
    : "Translate the content inside <source_text>. Return only the translation and do not return the tags.";
  return `${prefix}\n\n<source_text>\n${text}\n</source_text>`;
}
