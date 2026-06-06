import fs from "node:fs/promises";
import path from "node:path";
import { buildZip, type ZipOutputEntry } from "../epub/writeTranslatedEpub.js";
import type { ExportHistoryItem, ExternalEpubCheckReport, TranslationJobSummary, ValidationReport } from "../../shared/types.js";
import { validationReportToMarkdown } from "../../shared/validationReport.js";

export interface DiagnosticBundleInput {
  outputPath: string;
  appVersion?: string;
  validationReport?: ValidationReport | null;
  externalReport?: ExternalEpubCheckReport;
  jobSummary?: TranslationJobSummary | null;
  exportHistory?: ExportHistoryItem[];
  appLog?: string;
  redactPaths?: boolean;
}

interface SafeJobSummary {
  status: TranslationJobSummary["status"];
  [key: string]: unknown;
}

export interface DiagnosticSafetySummary {
  includedFiles: string[];
  redactedFields: string[];
  excludedSensitiveContent: string[];
  outputPath?: string;
}

export async function createDiagnosticBundle(input: DiagnosticBundleInput): Promise<string> {
  const createdAt = new Date().toISOString();
  const exportHistory = (input.exportHistory ?? []).map((item) => sanitizeExportHistory(item, input.redactPaths !== false));
  const jobSummary = sanitizeJobSummary(input.jobSummary ?? null);
  const safetySummary = createDiagnosticSafetySummary(input.outputPath);
  const entries: ZipOutputEntry[] = [
    jsonEntry("diagnostics.json", {
      createdAt,
      appVersion: input.appVersion ?? "unknown",
      hasValidationReport: Boolean(input.validationReport),
      hasExternalEpubCheck: Boolean(input.externalReport),
      jobStatus: jobSummary?.status,
      exportHistoryCount: exportHistory.length
    }),
    textEntry("validation-report.md", input.validationReport ? validationReportToMarkdown(input.validationReport, input.externalReport) : "No validation report available.\n"),
    textEntry("external-epubcheck-summary.md", externalSummary(input.externalReport)),
    jsonEntry("job-summary.json", jobSummary ?? {}),
    jsonEntry("export-history-summary.json", exportHistory),
    textEntry("diagnostic-summary.md", diagnosticSafetySummaryToMarkdown(safetySummary)),
    textEntry("app-log-redacted.txt", safeLogSummary(input.appLog))
  ];
  await fs.mkdir(path.dirname(input.outputPath), { recursive: true });
  await fs.writeFile(input.outputPath, buildZip(entries));
  return input.outputPath;
}

export function createDiagnosticSafetySummary(outputPath?: string): DiagnosticSafetySummary {
  return {
    includedFiles: [
      "diagnostics.json",
      "validation-report.md",
      "external-epubcheck-summary.md",
      "job-summary.json",
      "export-history-summary.json",
      "app-log-redacted.txt"
    ],
    redactedFields: ["file system paths", "provider tokens", "API key patterns", "Authorization headers", "provider error snippets"],
    excludedSensitiveContent: [
      "Original EPUB files excluded",
      "Exported EPUB files excluded",
      "API keys excluded",
      "Authorization headers excluded",
      "Full book text excluded"
    ],
    outputPath
  };
}

export function diagnosticSafetySummaryToMarkdown(summary: DiagnosticSafetySummary): string {
  return [
    "# Diagnostic Bundle Safety Summary",
    "",
    "## Included Files",
    ...summary.includedFiles.map((file) => `- ${file}`),
    "",
    "## Redacted Fields",
    ...summary.redactedFields.map((field) => `- ${field}`),
    "",
    "## Excluded Sensitive Content",
    ...summary.excludedSensitiveContent.map((item) => `- ${item}`),
    "",
    "## Output Path",
    summary.outputPath ? redact(summary.outputPath) : "Selected after export."
  ].join("\n");
}

export function defaultDiagnosticBundleName(date = new Date()): string {
  const stamp = date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "")
    .replace("T", "-");
  return `booktrans-diagnostic-${stamp}.zip`;
}

function textEntry(name: string, text: string): ZipOutputEntry {
  return { name, method: 8, data: Buffer.from(redact(text), "utf8") };
}

function jsonEntry(name: string, value: unknown): ZipOutputEntry {
  return textEntry(name, `${JSON.stringify(value, null, 2)}\n`);
}

function externalSummary(report?: ExternalEpubCheckReport): string {
  if (!report) {
    return "External EPUBCheck not available.\n";
  }
  const issues = report.issues?.map((issue) => `- ${issue.severity.toUpperCase()} ${issue.code ?? ""} ${issue.file ?? ""}: ${issue.message}`) ?? [];
  return [`# External EPUBCheck Summary`, "", `Status: ${report.status}`, `Summary: ${report.summary}`, `Exit code: ${report.exitCode ?? "N/A"}`, "", ...issues].join("\n");
}

function sanitizeJobSummary(summary: TranslationJobSummary | null): SafeJobSummary | null {
  if (!summary) {
    return null;
  }
  return {
    jobId: summary.jobId,
    bookTitle: summary.bookTitle,
    targetLanguage: summary.targetLanguage,
    status: summary.status,
    totalChapters: summary.totalChapters,
    completedChapters: summary.completedChapters,
    failedChapters: summary.failedChapters,
    pendingChapters: summary.pendingChapters,
    chapters: summary.chapters.map((chapter) => ({
      index: chapter.index,
      title: chapter.title,
      status: chapter.status,
      completedChunks: chapter.completedChunks,
      totalChunks: chapter.totalChunks,
      failedReason: chapter.failedReason ? redact(chapter.failedReason) : undefined
    }))
  };
}

function sanitizeExportHistory(item: ExportHistoryItem, redactPath: boolean): unknown {
  return {
    id: item.id,
    jobId: item.jobId,
    sourceBookTitle: item.sourceBookTitle,
    outputFileName: path.basename(item.outputEpubPath),
    outputEpubPath: redactPath ? `[redacted]/${path.basename(item.outputEpubPath)}` : redact(item.outputEpubPath),
    createdAt: item.createdAt,
    validationStatus: item.validationStatus,
    externalValidationStatus: item.externalValidationStatus,
    targetLanguage: item.targetLanguage,
    model: item.model,
    style: item.style,
    fileExists: item.fileExists,
    fileSize: item.fileSize
  };
}

function redact(text: string): string {
  return text
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key|OPENAI_API_KEY)\s*[:=]\s*["']?[A-Za-z0-9._~+/=-]+/gi, "$1=[redacted]")
    .replace(/sk-[A-Za-z0-9_-]{12,}/g, "sk-[redacted]");
}

function safeLogSummary(appLog?: string): string {
  if (!appLog?.trim()) {
    return "No app log provided.\n";
  }
  return "App log text was omitted from this diagnostic bundle to avoid exporting book content or credentials.\n";
}
