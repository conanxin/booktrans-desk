import { describe, expect, it } from "vitest";
import { buildChatCompletionRequestBody } from "../src/main/translate/openaiCompatibleTranslator.js";

describe("MiniMax provider preset", () => {
  it("adds thinking disabled for MiniMax requests", () => {
    const body = buildChatCompletionRequestBody("MiniMax-M3", "faithful", "", "hello", "minimax");
    expect(body.thinking).toEqual({ type: "disabled" });
  });

  it("does not add provider-specific thinking fields for generic OpenAI-compatible requests", () => {
    const body = buildChatCompletionRequestBody("gpt-4o-mini", "faithful", "", "hello", "openai-compatible");
    expect(body).not.toHaveProperty("thinking");
  });
});
