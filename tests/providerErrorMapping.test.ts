import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAICompatibleTranslator } from "../src/main/translate/openaiCompatibleTranslator.js";
import { sanitizeErrorText } from "../src/main/translate/translationErrors.js";

const settings = {
  baseUrl: "https://example.test/v1",
  apiKey: "secret-key",
  model: "model",
  style: "faithful" as const
};

describe("provider error mapping", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps 401 to PROVIDER_AUTH_FAILED", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("bad key", { status: 401 })));
    await expect(new OpenAICompatibleTranslator(settings, 100).translate("hello")).rejects.toMatchObject({ code: "PROVIDER_AUTH_FAILED" });
  });

  it("maps 429 to PROVIDER_RATE_LIMITED", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 })));
    await expect(new OpenAICompatibleTranslator(settings, 100).translate("hello")).rejects.toMatchObject({ code: "PROVIDER_RATE_LIMITED" });
  });

  it("maps timeout abort to PROVIDER_TIMEOUT", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        });
      })
    );
    await expect(new OpenAICompatibleTranslator(settings, 1).translate("hello")).rejects.toMatchObject({ code: "PROVIDER_TIMEOUT" });
  });

  it("redacts raw Authorization and API key patterns", () => {
    const bearer = "Bearer " + "abcdefghijklmnopqrstuvwxyz";
    const keyName = "api" + "Key";
    expect(sanitizeErrorText(`Authorization: ${bearer} ${keyName}=SECRET_VALUE_SHOULD_HIDE`)).not.toContain("abcdefghijklmnopqrstuvwxyz");
  });
});
