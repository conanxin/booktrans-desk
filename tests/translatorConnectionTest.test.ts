import { afterEach, describe, expect, it, vi } from "vitest";
import { buildChatCompletionRequestBody } from "../src/main/translate/openaiCompatibleTranslator.js";
import { testTranslatorConnection } from "../src/main/translate/testTranslatorConnection.js";

describe("translator connection test", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses MiniMax thinking disabled in request body", () => {
    expect(buildChatCompletionRequestBody("MiniMax-M3", "faithful", "", "Hello", "minimax")).toMatchObject({
      thinking: { type: "disabled" }
    });
  });

  it("supports mock provider without external calls", async () => {
    const result = await testTranslatorConnection({ baseUrl: "", apiKey: "", model: "mock", useMock: true, providerPreset: "minimax" });
    expect(result.status).toBe("success");
  });
});
