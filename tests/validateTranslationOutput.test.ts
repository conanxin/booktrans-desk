import { describe, expect, it } from "vitest";
import { validateTranslationOutput } from "../src/main/translate/validateTranslationOutput.js";

describe("validateTranslationOutput", () => {
  it("fails on reasoning and prompt leakage", () => {
    expect(validateTranslationOutput("hello", "<think>reason</think>你好").ok).toBe(false);
    expect(validateTranslationOutput("hello", "The user wants me to translate").ok).toBe(false);
    expect(validateTranslationOutput("hello", "Let me translate this").ok).toBe(false);
    expect(validateTranslationOutput("hello", "Translation: 你好").ok).toBe(false);
  });

  it("warns on high English ratio", () => {
    const result = validateTranslationOutput("这是一段需要翻译成中文的内容。", "This is mostly English explanation from the assistant.");
    expect(result.ok).toBe(true);
    expect(result.englishRatio).toBeGreaterThan(0.35);
    expect(result.warnings.some((warning) => warning.includes("english ratio"))).toBe(true);
  });

  it("warns when translation is much too short", () => {
    const result = validateTranslationOutput("a".repeat(100), "短");
    expect(result.warnings.some((warning) => warning.includes("10%"))).toBe(true);
  });
});
