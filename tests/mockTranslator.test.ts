import { describe, expect, it } from "vitest";
import { MockTranslator } from "../src/main/translate/mockTranslator.js";

describe("MockTranslator", () => {
  it("adds a deterministic Chinese marker to non-empty lines", async () => {
    const translator = new MockTranslator();
    await expect(translator.translate("Hello\n\nWorld")).resolves.toBe("[zh]Hello\n\n[zh]World");
  });

  it("applies glossary replacements deterministically", async () => {
    const translator = new MockTranslator({ glossary: "agent => 智能体" });
    await expect(translator.translate("agent")).resolves.toBe("[zh]智能体");
  });
});
