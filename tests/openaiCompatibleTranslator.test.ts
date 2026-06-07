import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAICompatibleTranslator } from "../src/main/translate/openaiCompatibleTranslator.js";

const settings = {
  baseUrl: "https://example.test/v1",
  apiKey: "secret-key",
  model: "model",
  style: "faithful" as const,
  glossary: "agent => 智能体"
};

describe("OpenAICompatibleTranslator", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries a 429 and then succeeds", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response("rate limited", { status: 429 }))
      .mockResolvedValueOnce(jsonResponse({ choices: [{ message: { content: "你好" } }] }));
    vi.stubGlobal("fetch", fetchMock);

    const translator = new OpenAICompatibleTranslator(settings, 1_000);
    await expect(translator.translate("hello")).resolves.toBe("你好");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("throws on an empty response", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse({ choices: [{ message: { content: "" } }] }))));
    const translator = new OpenAICompatibleTranslator(settings, 1_000);
    await expect(translator.translate("hello")).rejects.toMatchObject({ code: "PROVIDER_REQUEST_FAILED" });
  });

  it("cancels an in-flight request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        });
      })
    );
    const translator = new OpenAICompatibleTranslator(settings, 5_000);
    const controller = new AbortController();
    const promise = translator.translate("hello", controller.signal);
    controller.abort();
    await expect(promise).rejects.toMatchObject({ code: "USER_CANCELLED" });
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
