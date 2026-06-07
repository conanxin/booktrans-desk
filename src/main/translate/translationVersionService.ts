import crypto from "node:crypto";
import type { DocumentUnit, TranslationScope, TranslationUnitRecord, TranslationVersion, UnifiedDocument } from "../../shared/documentModel.js";
import type { ImportedBook, PdfTranslationJobResult, TranslationSettings, TranslationJobResult, Translator } from "../../shared/types.js";
import { getUnitSourceHint } from "../../shared/documentReaderUtils.js";
import { extractBodyText } from "../epub/readEpub.js";
import { translateWithQualityGate } from "./translateWithQualityGate.js";

export interface TranslationVersionSummary {
  id: string;
  label: string;
  sourceFormat: UnifiedDocument["sourceFormat"];
  source: NonNullable<TranslationVersion["source"]>;
  scope: TranslationScope;
  status: TranslationVersion["status"];
  translatedUnitCount: number;
  totalUnitCount: number;
  missingUnitCount: number;
  provider?: string;
  model?: string;
  style?: string;
  jobId?: string;
  updatedAt: string;
}

export interface TranslationResolutionOptions {
  translationVersionId?: string;
  translationResolution?: "latest" | "specific" | "none";
}

export function buildTranslationVersionFromEpubResult(
  document: UnifiedDocument,
  result: TranslationJobResult,
  settings: TranslationSettings,
  scope: TranslationScope = { type: "full" }
): TranslationVersion {
  const translatedByChapterId = new Map(result.translatedChapters.map((chapter) => [chapter.chapterId, extractBodyText(chapter.html)]));
  const units = selectUnitsForScope(document, scope);
  return createTranslationVersion(
    document,
    units.map((unit) => {
      const originalChapterId = typeof unit.metadata?.originalChapterId === "string" ? unit.metadata.originalChapterId : undefined;
      const translatedText = originalChapterId ? translatedByChapterId.get(originalChapterId) : undefined;
      return buildUnitRecord(unit, translatedText, translatedText ? "translated" : "missing", translatedText ? "epub-translation" : "missing");
    }),
    {
      label: labelForScope("EPUB translation", document, scope),
      jobId: result.jobId,
      source: "epub-translation",
      scope,
      settings
    }
  );
}

export function buildTranslationVersionFromPdfResult(
  document: UnifiedDocument,
  result: PdfTranslationJobResult,
  settings: TranslationSettings,
  scope: TranslationScope = { type: "full" }
): TranslationVersion {
  const translatedByParagraphId = new Map<string, string>();
  for (const page of result.translatedPages) {
    for (const paragraph of page.paragraphs) {
      if (paragraph.id && paragraph.translated) {
        translatedByParagraphId.set(paragraph.id, paragraph.translated);
      }
    }
  }
  const units = selectUnitsForScope(document, scope);
  return createTranslationVersion(
    document,
    units.map((unit) => {
      const originalParagraphId = typeof unit.metadata?.originalParagraphId === "string" ? unit.metadata.originalParagraphId : undefined;
      const translatedText = originalParagraphId ? translatedByParagraphId.get(originalParagraphId) : undefined;
      return buildUnitRecord(unit, translatedText, translatedText ? "experimental" : "missing", translatedText ? "pdf-experimental" : "missing");
    }),
    {
      label: labelForScope("PDF experimental translation", document, scope),
      jobId: result.jobId,
      source: "pdf-experimental",
      scope,
      settings
    }
  );
}

export async function buildTranslationVersionForSelectedUnits(
  document: UnifiedDocument,
  scope: TranslationScope,
  translator: Translator,
  settings: TranslationSettings,
  source: "manual" | "pdf-experimental" = "manual",
  signal?: AbortSignal
): Promise<TranslationVersion> {
  const units = selectUnitsForScope(document, scope).filter((unit) => unit.text.trim());
  const records: TranslationUnitRecord[] = [];
  for (const unit of units) {
    try {
      const translated = await translateWithQualityGate(translator, unit.text, signal);
      records.push(buildUnitRecord(unit, translated, source === "pdf-experimental" ? "experimental" : "translated", source));
    } catch (error) {
      records.push(buildUnitRecord(unit, undefined, "failed", source, error instanceof Error ? error.message : "Translation failed."));
    }
  }
  return createTranslationVersion(document, records, {
    label: labelForScope(source === "pdf-experimental" ? "PDF page experimental translation" : "Selected translation", document, scope),
    source,
    scope,
    settings
  });
}

export function mergeTranslationVersion(document: UnifiedDocument, version: TranslationVersion): UnifiedDocument {
  const existing = document.translations ?? [];
  const withoutSameScope = existing.filter((item) => !(item.jobId && version.jobId && item.jobId === version.jobId && sameScope(item.scope, version.scope)));
  return {
    ...document,
    translations: [...withoutSameScope, version]
  };
}

export function findLatestMatchingTranslationVersion(
  document: UnifiedDocument,
  scope: TranslationScope,
  options: TranslationResolutionOptions = {}
): TranslationVersion | undefined {
  const versions = document.translations ?? [];
  if (options.translationResolution === "none") {
    return undefined;
  }
  if (options.translationVersionId) {
    return versions.find((version) => version.id === options.translationVersionId);
  }
  const completed = versions.filter((version) => version.status === "completed" || version.status === "partial");
  return (
    completed.filter((version) => sameScope(version.scope, scope)).sort(byUpdatedDesc)[0] ??
    completed.filter((version) => version.scope?.type === "full").sort(byUpdatedDesc)[0] ??
    completed.sort(byUpdatedDesc)[0]
  );
}

export function resolveTranslationForUnit(document: UnifiedDocument, unit: DocumentUnit, scope: TranslationScope, options: TranslationResolutionOptions = {}): TranslationUnitRecord | undefined {
  const version = findLatestMatchingTranslationVersion(document, scope, options);
  const records = version?.units ?? version?.unitTranslations ?? [];
  return records.find((record) => (record.sourceUnitId ?? record.unitId) === unit.id);
}

export function summarizeTranslationVersion(version: TranslationVersion): TranslationVersionSummary {
  const records = version.units ?? version.unitTranslations ?? [];
  const translatedUnitCount = version.translatedUnitCount ?? records.filter((unit) => unit.status === "translated" || unit.status === "completed" || unit.status === "experimental").length;
  const totalUnitCount = version.totalUnitCount ?? records.length;
  const missingUnitCount = version.missingUnitCount ?? Math.max(0, totalUnitCount - translatedUnitCount);
  return {
    id: version.id,
    label: version.label ?? labelForScope("Translation", { title: "document" } as UnifiedDocument, version.scope ?? { type: "full" }),
    sourceFormat: version.sourceFormat ?? "epub",
    source: version.source ?? "manual",
    scope: version.scope ?? { type: "full" },
    status: version.status,
    translatedUnitCount,
    totalUnitCount,
    missingUnitCount,
    provider: version.provider,
    model: version.model,
    style: version.style,
    jobId: version.jobId,
    updatedAt: version.updatedAt
  };
}

export function selectUnitsForScope(document: UnifiedDocument, scope: TranslationScope): DocumentUnit[] {
  if (scope.type === "chapter") {
    const chapter = document.chapters.find((item) => item.id === scope.chapterId);
    const unitIds = new Set(chapter?.unitIds ?? []);
    return document.units.filter((unit) => unitIds.has(unit.id)).sort(byOrder);
  }
  if (scope.type === "page") {
    return document.units.filter((unit) => unit.pageNumber === scope.pageNumber).sort(byOrder);
  }
  if (scope.type === "units") {
    const unitIds = new Set(scope.unitIds ?? []);
    return document.units.filter((unit) => unitIds.has(unit.id)).sort(byOrder);
  }
  return [...document.units].sort(byOrder);
}

function createTranslationVersion(
  document: UnifiedDocument,
  records: TranslationUnitRecord[],
  options: {
    label: string;
    jobId?: string;
    source: NonNullable<TranslationVersion["source"]>;
    scope: TranslationScope;
    settings: TranslationSettings;
  }
): TranslationVersion {
  const now = new Date().toISOString();
  const translatedUnitCount = records.filter((unit) => unit.status === "translated" || unit.status === "completed" || unit.status === "experimental").length;
  const missingUnitCount = records.filter((unit) => unit.status === "missing" || unit.status === "failed").length;
  const status: TranslationVersion["status"] = translatedUnitCount === records.length ? "completed" : translatedUnitCount > 0 ? "partial" : "failed";
  return {
    id: `translation-${crypto.randomUUID()}`,
    documentId: document.id,
    label: options.label,
    jobId: options.jobId,
    sourceFormat: document.sourceFormat,
    source: options.source,
    scope: options.scope,
    provider: options.settings.providerPreset,
    model: options.settings.useMock ? "mock" : options.settings.model,
    style: options.settings.style,
    targetLanguage: "zh-CN",
    status,
    translatedUnitCount,
    totalUnitCount: records.length,
    missingUnitCount,
    units: records,
    unitTranslations: records,
    createdAt: now,
    updatedAt: now
  };
}

function buildUnitRecord(
  unit: DocumentUnit,
  translatedText: string | undefined,
  status: TranslationUnitRecord["status"],
  source: NonNullable<TranslationUnitRecord["source"]>,
  error?: string
): TranslationUnitRecord {
  return {
    unitId: unit.id,
    sourceUnitId: unit.id,
    sourceText: unit.text,
    sourceTextPreview: unit.text.replace(/\s+/g, " ").trim().slice(0, 220),
    sourceHash: hash(unit.text),
    translatedText,
    status,
    source,
    error,
    updatedAt: new Date().toISOString()
  };
}

function labelForScope(prefix: string, document: Pick<UnifiedDocument, "title" | "chapters">, scope: TranslationScope): string {
  if (scope.type === "chapter") {
    const chapter = document.chapters?.find((item) => item.id === scope.chapterId);
    return `${prefix}: ${chapter?.title ?? scope.chapterId ?? "chapter"}`;
  }
  if (scope.type === "page") {
    return `${prefix}: page ${scope.pageNumber ?? "unknown"}`;
  }
  if (scope.type === "units") {
    return `${prefix}: selected units`;
  }
  return `${prefix}: ${document.title}`;
}

function sameScope(left: TranslationScope | undefined, right: TranslationScope | undefined): boolean {
  const normalizedLeft = left ?? { type: "full" };
  const normalizedRight = right ?? { type: "full" };
  if (normalizedLeft.type !== normalizedRight.type) {
    return false;
  }
  if (normalizedLeft.type === "chapter") {
    return normalizedLeft.chapterId === normalizedRight.chapterId;
  }
  if (normalizedLeft.type === "page") {
    return normalizedLeft.pageNumber === normalizedRight.pageNumber;
  }
  if (normalizedLeft.type === "units") {
    return (normalizedLeft.unitIds ?? []).join("|") === (normalizedRight.unitIds ?? []).join("|");
  }
  return true;
}

function byOrder(left: DocumentUnit, right: DocumentUnit): number {
  return left.order - right.order;
}

function byUpdatedDesc(left: TranslationVersion, right: TranslationVersion): number {
  return right.updatedAt.localeCompare(left.updatedAt);
}

function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function sourceHintForTranslationUnit(document: UnifiedDocument, sourceUnitId: string): string {
  const unit = document.units.find((item) => item.id === sourceUnitId);
  return unit ? getUnitSourceHint(unit) : sourceUnitId;
}
