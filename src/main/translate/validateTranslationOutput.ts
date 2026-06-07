export interface TranslationValidationResult {
  ok: boolean;
  warnings: string[];
  errors: string[];
  englishRatio: number;
}

const FAIL_PATTERNS: Array<[RegExp, string]> = [
  [/<think[\s>]/i, "contains <think>"],
  [/<\/think>/i, "contains </think>"],
  [/\bThe user wants\b/i, "contains assistant prompt commentary"],
  [/\bLet me\b/i, "contains assistant reasoning"],
  [/\bI need to\b/i, "contains assistant reasoning"],
  [/\bTranslation\s*:/i, "contains Translation prefix"],
  [/\bHere is the translation\b/i, "contains translation preface"],
  [/\bI will translate\b/i, "contains assistant commentary"]
];

export function validateTranslationOutput(sourceText: string, translatedText: string): TranslationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const output = translatedText.trim();

  for (const [pattern, reason] of FAIL_PATTERNS) {
    if (pattern.test(output)) {
      errors.push(reason);
    }
  }

  if (!output) {
    errors.push("translation is empty");
  }

  const englishRatio = calculateEnglishRatio(output);
  if (englishRatio > 0.35 && calculateEnglishRatio(sourceText) <= 0.85) {
    warnings.push(`english ratio is high: ${englishRatio.toFixed(2)}`);
  }

  const sourceLength = sourceText.trim().length;
  if (sourceLength >= 40 && output.length < sourceLength * 0.1) {
    warnings.push("translation is shorter than 10% of source length");
  }

  return {
    ok: errors.length === 0,
    warnings,
    errors,
    englishRatio
  };
}

export function calculateEnglishRatio(text: string): number {
  const letters = Array.from(text).filter((char) => /\p{L}/u.test(char));
  if (!letters.length) {
    return 0;
  }
  const englishLetters = letters.filter((char) => /[A-Za-z]/.test(char));
  return englishLetters.length / letters.length;
}
