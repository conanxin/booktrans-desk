import type { IpcResult, TranslationErrorCode } from "../shared/types.js";

const messages: Record<TranslationErrorCode, string> = {
  USER_CANCELLED: "翻译启动失败：任务被取消。",
  PDF_NO_TEXT: "翻译启动失败：未能从 PDF 中生成可翻译文本分块。这个 PDF 可能是扫描版、加密文件，或文本提取失败。",
  PDF_CHUNKING_FAILED: "翻译启动失败：PDF 文本分块失败，请尝试较短或结构更简单的 PDF。",
  PROVIDER_REQUEST_FAILED: "翻译启动失败：模型服务请求失败，请检查 API 地址、网络连接和模型名称。",
  PROVIDER_AUTH_FAILED: "翻译启动失败：模型服务认证失败，请检查 API 密钥和服务商配置。",
  PROVIDER_RATE_LIMITED: "翻译启动失败：模型服务请求过于频繁，请稍后重试。",
  PROVIDER_TIMEOUT: "翻译启动失败：模型服务请求超时，请稍后重试或缩短文本。",
  TRANSLATION_OUTPUT_INVALID: "翻译启动失败：模型返回内容不符合翻译要求，已阻止写入结果。",
  TRANSLATION_QUALITY_GATE_BLOCKED: "翻译启动失败：译文中包含模型思考过程或提示词内容，请先重试失败段落。",
  UNKNOWN_TRANSLATION_ERROR: "翻译启动失败：请查看详细日志。"
};

export function formatIpcError(result: Pick<IpcResult<unknown>, "error" | "code">): string {
  const code = result.code;
  const message = code ? messages[code] : sanitizeRendererError(result.error ?? "操作失败。");
  return code ? `${message}\n错误代码：${code}` : message;
}

export function sanitizeRendererError(error: string): string {
  return error
    .replace(/Error invoking remote method '[^']+':\s*/gi, "")
    .replace(/^Error:\s*/i, "")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key|OPENAI_API_KEY)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]+/gi, "$1=[redacted]")
    .trim();
}
