import type { TranslationErrorCode } from "../../shared/types.js";

export class TranslationError extends Error {
  constructor(
    readonly code: TranslationErrorCode,
    message: string,
    readonly causeMessage?: string
  ) {
    super(message);
    this.name = "TranslationError";
  }
}

export function createTranslationError(code: TranslationErrorCode, cause?: unknown): TranslationError {
  return new TranslationError(code, messageForCode(code), sanitizeErrorText(messageOf(cause)));
}

export function normalizeTranslationError(error: unknown): TranslationError {
  if (error instanceof TranslationError) {
    return new TranslationError(error.code, messageForCode(error.code), sanitizeErrorText(error.causeMessage ?? error.message));
  }
  const message = messageOf(error);
  if (/cancelled|canceled|abort/i.test(message)) {
    return createTranslationError("USER_CANCELLED", error);
  }
  if (/PDF_EXPORT_BLOCKED_TRANSLATION_INVALID|quality/i.test(message)) {
    return createTranslationError("TRANSLATION_QUALITY_GATE_BLOCKED", error);
  }
  return createTranslationError("UNKNOWN_TRANSLATION_ERROR", error);
}

export function messageForCode(code: TranslationErrorCode): string {
  const messages: Record<TranslationErrorCode, string> = {
    USER_CANCELLED: "任务已取消。",
    PDF_NO_TEXT: "未能从 PDF 中生成可翻译文本分块。这个 PDF 可能是扫描版、加密文件，或文本提取失败。",
    PDF_CHUNKING_FAILED: "PDF 文本分块失败，请尝试较短或结构更简单的 PDF。",
    PROVIDER_REQUEST_FAILED: "模型服务请求失败，请检查 API 地址、网络连接和模型名称。",
    PROVIDER_AUTH_FAILED: "模型服务认证失败，请检查 API 密钥和服务商配置。",
    PROVIDER_RATE_LIMITED: "模型服务请求过于频繁，请稍后重试。",
    PROVIDER_TIMEOUT: "模型服务请求超时，请稍后重试或缩短文本。",
    TRANSLATION_OUTPUT_INVALID: "模型返回内容不符合翻译要求，已阻止写入结果。",
    TRANSLATION_QUALITY_GATE_BLOCKED: "译文中包含模型思考过程或提示词内容，请先重试失败段落。",
    UNKNOWN_TRANSLATION_ERROR: "翻译任务失败，请查看详细日志。"
  };
  return messages[code];
}

export function sanitizeErrorText(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key|OPENAI_API_KEY)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]+/gi, "$1=[redacted]")
    .slice(0, 500);
}

export function toDiagnosticLines(error: unknown): string[] {
  const normalized = normalizeTranslationError(error);
  const lines = [`错误代码：${normalized.code}`, normalized.message];
  if (normalized.causeMessage && normalized.causeMessage !== normalized.message) {
    lines.push(`诊断信息：${normalized.causeMessage}`);
  }
  return lines;
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error ?? "");
}
