import type { TranslationSettings, TranslatorConnectionTestResult } from "../../shared/types.js";
import { MockTranslator } from "./mockTranslator.js";
import { OpenAICompatibleTranslator } from "./openaiCompatibleTranslator.js";
import { normalizeTranslationError, TranslationError } from "./translationErrors.js";

export async function testTranslatorConnection(settings: TranslationSettings, signal?: AbortSignal): Promise<TranslatorConnectionTestResult> {
  try {
    const translator = settings.useMock ? new MockTranslator(settings) : new OpenAICompatibleTranslator(settings, 15_000);
    const translated = await translator.translate("Hello", signal);
    if (typeof translated !== "string" || !translated.trim()) {
      return {
        status: "invalid_response",
        message: "模型连接测试失败：模型返回异常。",
        code: "PROVIDER_REQUEST_FAILED"
      };
    }
    return {
      status: "success",
      message: "模型连接测试成功。"
    };
  } catch (error) {
    const normalized = normalizeTranslationError(error);
    return {
      status: statusForError(normalized),
      message: `模型连接测试失败：${normalized.message}`,
      code: normalized.code
    };
  }
}

function statusForError(error: TranslationError): TranslatorConnectionTestResult["status"] {
  if (error.code === "PROVIDER_AUTH_FAILED") {
    return "auth_failed";
  }
  if (error.code === "PROVIDER_TIMEOUT") {
    return "timeout";
  }
  if (error.code === "PROVIDER_REQUEST_FAILED" || error.code === "PROVIDER_RATE_LIMITED") {
    return "failed";
  }
  return "failed";
}
