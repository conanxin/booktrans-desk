import fs from "node:fs/promises";
import AdmZip from "adm-zip";
import type { ExportValidation } from "../../shared/types.js";

const SENSITIVE_PATTERNS = [/apiKey/i, /authorization/i, /rawProvider/i, /rawResponse/i, /Bearer\s+[A-Za-z0-9._-]+/i];

export async function validateMarkdownExport(filePath: string, expectedTitle?: string): Promise<ExportValidation> {
  const base = await validateGenericExport(filePath);
  if (base.status === "fail") {
    return base;
  }
  const content = await fs.readFile(filePath, "utf8");
  const warnings = [...base.warnings];
  const errors = [...base.errors];
  if (!content.trim()) {
    errors.push("Markdown file is empty.");
  }
  if (expectedTitle && !content.includes(expectedTitle)) {
    warnings.push("Markdown file does not contain the expected document title.");
  }
  addSensitiveWarnings(content, warnings);
  return finalizeValidation(errors, warnings, [filePath], "Markdown export validated.");
}

export async function validateJsonExport(filePath: string): Promise<ExportValidation> {
  const base = await validateGenericExport(filePath);
  if (base.status === "fail") {
    return base;
  }
  const content = await fs.readFile(filePath, "utf8");
  const errors = [...base.errors];
  const warnings = [...base.warnings];
  try {
    const parsed = JSON.parse(content) as Record<string, unknown>;
    if (!parsed.id || !parsed.sourceFormat || !parsed.units) {
      warnings.push("JSON export is parseable but does not look like a full UnifiedDocument snapshot.");
    }
  } catch {
    errors.push("JSON export is not parseable.");
  }
  addSensitiveWarnings(content, warnings);
  return finalizeValidation(errors, warnings, [filePath], "JSON export validated.");
}

export async function validateZipExport(filePath: string, expectedEntries: string[]): Promise<ExportValidation> {
  const base = await validateGenericExport(filePath);
  if (base.status === "fail") {
    return base;
  }
  const errors = [...base.errors];
  const warnings = [...base.warnings];
  try {
    const zip = new AdmZip(filePath);
    const names = new Set(zip.getEntries().map((entry) => entry.entryName));
    for (const expected of expectedEntries) {
      if (!names.has(expected)) {
        errors.push(`ZIP is missing ${expected}.`);
      }
    }
  } catch {
    errors.push("ZIP export cannot be opened.");
  }
  return finalizeValidation(errors, warnings, [filePath, ...expectedEntries], "ZIP archive structure validated.");
}

export async function validatePptxExport(filePath: string): Promise<ExportValidation> {
  const expected = ["[Content_Types].xml", "ppt/presentation.xml"];
  const result = await validateZipExport(filePath, expected);
  return {
    ...result,
    summary: result.status === "fail" ? "PPTX structure validation failed." : "PPTX package structure validated."
  };
}

export async function validateGenericExport(filePath: string): Promise<ExportValidation> {
  try {
    const stat = await fs.stat(filePath);
    const errors = stat.size > 0 ? [] : ["Export file is empty."];
    return finalizeValidation(errors, [], [filePath], "Export file exists and is non-empty.");
  } catch {
    return finalizeValidation(["Export file does not exist."], [], [filePath], "Export file is missing.");
  }
}

export function statusToValidationStatus(status: ExportValidation["status"]): "pass" | "warning" | "fail" {
  return status;
}

function addSensitiveWarnings(content: string, warnings: string[]): void {
  if (SENSITIVE_PATTERNS.some((pattern) => pattern.test(content))) {
    warnings.push("Export may contain sensitive provider or authorization fields.");
  }
}

function finalizeValidation(errors: string[], warnings: string[], checkedFiles: string[], summary: string): ExportValidation {
  return {
    status: errors.length ? "fail" : warnings.length ? "warning" : "pass",
    errors,
    warnings,
    checkedFiles,
    summary
  };
}
