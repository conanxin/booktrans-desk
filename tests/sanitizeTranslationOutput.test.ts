import { describe, expect, it } from "vitest";
import { sanitizeTranslationOutput } from "../src/main/translate/sanitizeTranslationOutput.js";

describe("sanitizeTranslationOutput", () => {
  it("removes think blocks", () => {
    const result = sanitizeTranslationOutput("<think>reasoning</think>真正译文");
    expect(result.cleanedText).toBe("真正译文");
    expect(result.removedReasoning).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it("removes common translation prefixes", () => {
    expect(sanitizeTranslationOutput("Translation: 真正译文").cleanedText).toBe("真正译文");
    expect(sanitizeTranslationOutput("Here is the translation: 真正译文").cleanedText).toBe("真正译文");
    expect(sanitizeTranslationOutput("译文：真正译文").cleanedText).toBe("真正译文");
  });

  it("unwraps fenced output", () => {
    expect(sanitizeTranslationOutput("```text\nfenced output\n```").cleanedText).toBe("fenced output");
  });

  it("marks assistant reasoning starts invalid", () => {
    expect(sanitizeTranslationOutput("The user wants me to translate this.").isValid).toBe(false);
    expect(sanitizeTranslationOutput("Let me translate this.").isValid).toBe(false);
  });

  it("does not remove normal English proper nouns", () => {
    const result = sanitizeTranslationOutput("这是 OpenAI API 的配置。");
    expect(result.cleanedText).toContain("OpenAI API");
    expect(result.isValid).toBe(true);
  });
});
