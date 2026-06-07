import type { TranslationQualityProgress, Translator } from "../../shared/types.js";
import { sanitizeTranslationOutput } from "./sanitizeTranslationOutput.js";
import { createTranslationError } from "./translationErrors.js";
import { validateTranslationOutput } from "./validateTranslationOutput.js";

export const TRANSLATION_FAILURE_PLACEHOLDER = "【本段翻译失败，请重试。】";

export interface QualityTranslationCallbacks {
  onStats?: (stats: TranslationQualityProgress) => void;
  onLog?: (message: string) => void;
}

interface MutableQualityStats extends TranslationQualityProgress {}

export async function translateWithQualityGate(
  translator: Translator,
  sourceText: string,
  signal?: AbortSignal,
  callbacks: QualityTranslationCallbacks = {}
): Promise<string> {
  const stats = createStats();
  let lastCleaned = "";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const raw = await translator.translate(sourceText, signal, { repair: attempt > 0 });
    const sanitized = sanitizeTranslationOutput(raw);
    lastCleaned = sanitized.cleanedText;
    if (sanitized.removedReasoning) {
      stats.cleanedReasoningCount += 1;
      stats.status = "warning";
      callbacks.onLog?.("检测到模型返回了思考过程，已自动清理并重试。");
    }
    if (!sanitized.isValid) {
      stats.status = "warning";
      callbacks.onLog?.("检测到模型返回了英文说明，已自动重试。");
    }

    const validation = validateTranslationOutput(sourceText, sanitized.cleanedText);
    for (const warning of validation.warnings) {
      if (!stats.warnings.includes(warning)) {
        stats.warnings.push(warning);
      }
    }

    if (sanitized.isValid && validation.ok) {
      emitStats(stats, callbacks);
      return sanitized.cleanedText;
    }

    if (attempt < 2) {
      stats.retryCount += 1;
      callbacks.onLog?.("输出疑似包含提示词或不合规内容，已重试。");
      continue;
    }
  }

  stats.failedChunkCount += 1;
  stats.status = "failed";
  callbacks.onLog?.("仍有分块翻译失败，请重试失败章节或页面。");
  emitStats(stats, callbacks);

  const finalValidation = validateTranslationOutput(sourceText, lastCleaned);
  if (finalValidation.ok && lastCleaned) {
    return lastCleaned;
  }
  throw createTranslationError("TRANSLATION_OUTPUT_INVALID", finalValidation.errors.join(", ") || "quality gate rejected translation output");
}

export function createStats(): MutableQualityStats {
  return {
    cleanedReasoningCount: 0,
    retryCount: 0,
    failedChunkCount: 0,
    status: "normal",
    warnings: []
  };
}

export function mergeQualityStats(target: TranslationQualityProgress, next: TranslationQualityProgress): TranslationQualityProgress {
  target.cleanedReasoningCount += next.cleanedReasoningCount;
  target.retryCount += next.retryCount;
  target.failedChunkCount += next.failedChunkCount;
  target.status = target.failedChunkCount > 0 || next.status === "failed" ? "failed" : target.retryCount > 0 || target.cleanedReasoningCount > 0 || next.status === "warning" ? "warning" : "normal";
  for (const warning of next.warnings) {
    if (!target.warnings.includes(warning)) {
      target.warnings.push(warning);
    }
  }
  return target;
}

function emitStats(stats: TranslationQualityProgress, callbacks: QualityTranslationCallbacks): void {
  callbacks.onStats?.({ ...stats, warnings: [...stats.warnings] });
}
