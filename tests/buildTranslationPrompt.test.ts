import { describe, expect, it } from "vitest";
import { buildTranslationPrompt } from "../src/main/translate/buildTranslationPrompt.js";

describe("buildTranslationPrompt", () => {
  it("builds a strict translation-engine protocol", () => {
    const messages = buildTranslationPrompt("Hello world", { style: "faithful", glossary: "agent => 智能体" });
    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("strict translation engine");
    expect(messages[0].content).toContain("Output only the translated text");
    expect(messages[0].content).toContain("Do not output <think>");
    expect(messages[0].content).toContain("The user wants");
    expect(messages[0].content).toContain("agent => 智能体");
    expect(messages[0].content).not.toContain("Hello world");
    expect(messages[1].content).toContain("<source_text>");
    expect(messages[1].content).toContain("Hello world");
  });

  it("adds a stricter repair instruction when requested", () => {
    const messages = buildTranslationPrompt("Hello", { style: "popular" }, { repair: true });
    expect(messages[0].content).toContain("The previous output violated the protocol");
    expect(messages[0].content).toContain("Do not output English commentary");
  });
});
