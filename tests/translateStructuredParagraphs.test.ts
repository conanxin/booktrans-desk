import { describe, expect, it } from "vitest";
import type { Translator } from "../src/shared/types.js";
import { translateStructuredParagraphs, validateStructuredTranslationResponse } from "../src/main/pdf/translateStructuredParagraphs.js";

class JsonTranslator implements Translator {
  constructor(private readonly response: string) {}
  async translate(): Promise<string> {
    return this.response;
  }
}

const paragraphs = [
  { id: "p1", role: "body-left-column" as const, pageNumber: 1, sourceText: "Hello" },
  { id: "p2", role: "body-right-column" as const, pageNumber: 1, sourceText: "World" }
];

describe("translateStructuredParagraphs", () => {
  it("accepts complete JSON array responses with matching ids", async () => {
    const result = await translateStructuredParagraphs(new JsonTranslator(JSON.stringify([{ id: "p1", translation: "你好" }, { id: "p2", translation: "世界" }])), paragraphs);
    expect(result.map((item) => item.id)).toEqual(["p1", "p2"]);
  });

  it("rejects missing paragraph ids", () => {
    expect(() => validateStructuredTranslationResponse(paragraphs, [{ id: "p1", translation: "你好" }])).toThrow("模型返回内容不符合翻译要求");
  });

  it("rejects reordered ids", () => {
    expect(() =>
      validateStructuredTranslationResponse(paragraphs, [
        { id: "p2", translation: "世界" },
        { id: "p1", translation: "你好" }
      ])
    ).toThrow("模型返回内容不符合翻译要求");
  });

  it("rejects prompt leakage and think tags in JSON translations", async () => {
    await expect(translateStructuredParagraphs(new JsonTranslator(JSON.stringify([{ id: "p1", translation: "<think>x</think>" }, { id: "p2", translation: "世界" }])), paragraphs)).rejects.toMatchObject({
      code: "TRANSLATION_OUTPUT_INVALID"
    });
  });
});
