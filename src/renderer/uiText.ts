import type { ExternalValidationStatus, TranslationStatus, ValidationStatus } from "../shared/types.js";

export const styleLabels = {
  faithful: "忠实准确",
  fluent: "自然流畅",
  academic: "学术书面",
  popular: "通俗易懂"
} as const;

export const translationStatusLabels: Record<TranslationStatus, string> = {
  pending: "等待任务",
  translating: "正在翻译",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消"
};

export const chapterStatusLabels: Record<TranslationStatus, string> = {
  pending: "待翻译",
  translating: "翻译中",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消"
};

export const jobStatusLabels: Record<string, string> = {
  running: "运行中",
  paused: "已暂停",
  completed: "已完成",
  failed: "失败",
  cancelled: "已取消"
};

export const validationStatusLabels: Record<ValidationStatus | "unknown", string> = {
  pass: "通过",
  warning: "警告",
  fail: "失败",
  unknown: "未验证"
};

const externalValidationStatusLabels: Record<ExternalValidationStatus, string> = {
  pass: "验证通过",
  warning: "有警告",
  fail: "验证失败",
  unavailable: "未配置"
};

export function formatStatusLabel(status?: TranslationStatus): string {
  return status ? translationStatusLabels[status] : "等待任务";
}

export function formatValidationLabel(status?: ValidationStatus | "unknown"): string {
  return validationStatusLabels[status ?? "unknown"];
}

export function formatExternalValidationLabel(status?: ExternalValidationStatus): string {
  return externalValidationStatusLabels[status ?? "unavailable"];
}
