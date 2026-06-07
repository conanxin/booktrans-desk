import { describe, expect, it } from "vitest";
import type { Translator } from "../src/shared/types.js";
import { translateWithQualityGate } from "../src/main/translate/translateWithQualityGate.js";

class SequenceTranslator implements Translator {
  calls: Array<{ text: string; repair?: boolean }> = [];

  constructor(private readonly outputs: string[]) {}

  async translate(text: string, _signal?: AbortSignal, context?: { repair?: boolean }): Promise<string> {
    this.calls.push({ text, repair: context?.repair });
    return this.outputs.shift() ?? "";
  }
}

describe("translateWithQualityGate", () => {
  it("retries invalid assistant commentary and succeeds", async () => {
    const translator = new SequenceTranslator(["The user wants me to translate this.", "真正译文"]);
    const logs: string[] = [];
    const translated = await translateWithQualityGate(translator, "hello", undefined, { onLog: (message) => logs.push(message) });
    expect(translated).toBe("真正译文");
    expect(translator.calls).toHaveLength(2);
    expect(translator.calls[1].repair).toBe(true);
    expect(logs.some((line) => line.includes("重试"))).toBe(true);
  });

  it("does not return polluted output after retries fail", async () => {
    const translator = new SequenceTranslator(["<think>a</think>The user wants", "Let me translate", "Translation:"]);
    await expect(translateWithQualityGate(translator, "hello")).rejects.toMatchObject({ code: "TRANSLATION_OUTPUT_INVALID" });
  });
});
