export interface SanitizedTranslationOutput {
  cleanedText: string;
  removedReasoning: boolean;
  isValid: boolean;
  reasons: string[];
}

const REASONING_START_PATTERNS = [
  /^\s*the user wants\b/i,
  /^\s*let me\b/i,
  /^\s*i need to\b/i,
  /^\s*i will translate\b/i,
  /^\s*i will\b/i
];

export function sanitizeTranslationOutput(output: string): SanitizedTranslationOutput {
  const reasons: string[] = [];
  let cleanedText = String(output ?? "");
  let removedReasoning = false;

  if (/<think[\s>]/i.test(cleanedText) || /<\/think>/i.test(cleanedText)) {
    removedReasoning = true;
    reasons.push("removed think block");
    cleanedText = cleanedText.replace(/<think\b[^>]*>[\s\S]*?<\/think>/gi, "");
    cleanedText = cleanedText.replace(/<\/?think\b[^>]*>/gi, "");
  }

  const unfenced = unwrapFence(cleanedText);
  if (unfenced !== cleanedText) {
    cleanedText = unfenced;
    reasons.push("removed code fence");
  }

  cleanedText = cleanedText.replace(/^\s*(?:Translation|Translated text|Here is the translation)\s*:\s*/i, "");
  cleanedText = cleanedText.replace(/^\s*(?:译文|翻译|以下是翻译)\s*[:：]\s*/i, "");
  cleanedText = cleanedText.trim();

  const hasReasoningStart = REASONING_START_PATTERNS.some((pattern) => pattern.test(cleanedText));
  if (hasReasoningStart) {
    reasons.push("assistant reasoning or prompt commentary detected");
  }

  return {
    cleanedText,
    removedReasoning,
    isValid: !hasReasoningStart && cleanedText.length > 0,
    reasons
  };
}

function unwrapFence(text: string): string {
  const match = text.match(/^\s*```[a-zA-Z0-9_-]*\s*\n?([\s\S]*?)\n?```\s*$/);
  return match ? match[1].trim() : text;
}
