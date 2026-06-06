import { describe, expect, it } from "vitest";
import { MockTranslator } from "../src/main/translate/mockTranslator.js";

describe("MockTranslator", () => {
  it("adds a deterministic Chinese marker to non-empty lines", async () => {
    const translator = new MockTranslator();
    await expect(translator.translate("Hello\n\nWorld")).resolves.toBe("【中文】Hello\n\n【中文】World");
  });
});
