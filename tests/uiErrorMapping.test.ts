import { describe, expect, it } from "vitest";
import { formatIpcError, sanitizeRendererError } from "../src/renderer/errorMapping.js";

describe("UI error mapping", () => {
  it("does not show raw Electron IPC wrapper", () => {
    expect(sanitizeRendererError("Error invoking remote method 'translation:start': Error: Translation canceled.")).toBe("Translation canceled.");
  });

  it("maps provider errors to friendly Chinese text and code", () => {
    const message = formatIpcError({ ok: false, code: "PROVIDER_AUTH_FAILED", error: "raw" });
    expect(message).toContain("模型服务认证失败");
    expect(message).toContain("PROVIDER_AUTH_FAILED");
    expect(message).not.toContain("Error invoking remote method");
  });
});
