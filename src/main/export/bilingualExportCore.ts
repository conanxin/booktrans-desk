import type { DocumentUnit, TranslationVersion, UnifiedDocument } from "../../shared/documentModel.js";
import type { BilingualExportOptions, BilingualExportScope, BilingualExportUnit, TranslationSummary } from "../../shared/types.js";
import { getUnitSourceHint } from "../../shared/documentReaderUtils.js";
import { findLatestMatchingTranslationVersion } from "../translate/translationVersionService.js";

export const MISSING_TRANSLATION_PLACEHOLDER = "【暂无译文，请先完成翻译或在后续版本生成。】";

export interface BilingualExportPayload {
  document: UnifiedDocument;
  scope: BilingualExportScope;
  scopeLabel: string;
  units: BilingualExportUnit[];
  summary: TranslationSummary;
  generatedAt: string;
  translationVersionId?: string;
  translationVersionLabel?: string;
}

export function buildBilingualPayload(document: UnifiedDocument, scope: BilingualExportScope, options: Pick<BilingualExportOptions, "translationVersionId" | "translationResolution"> = {}): BilingualExportPayload {
  const sourceUnits = selectUnits(document, scope).filter((unit) => unit.text.trim());
  const translation = findLatestMatchingTranslationVersion(document, scope, options);
  const translationByUnit = new Map<string, NonNullable<TranslationVersion["unitTranslations"][number]>>();
  for (const item of translation?.units ?? translation?.unitTranslations ?? []) {
    translationByUnit.set(item.sourceUnitId ?? item.unitId, item);
  }

  const units: BilingualExportUnit[] = sourceUnits.map((unit) => {
    const translated = translationByUnit.get(unit.id);
    const hasTranslation = Boolean(translated?.translatedText?.trim());
    const experimental = translated?.source === "pdf-experimental" || translation?.source === "pdf-experimental";
    return {
      unitId: unit.id,
      sourceHint: getUnitSourceHint(unit),
      chapterId: unit.chapterId,
      chapterTitle: unit.chapterTitle,
      pageNumber: unit.pageNumber,
      role: unit.role,
      originalText: unit.text,
      translatedText: hasTranslation ? translated?.translatedText : undefined,
      translationStatus: hasTranslation ? (experimental ? "experimental" : "available") : "missing"
    };
  });

  return {
    document,
    scope,
    scopeLabel: formatBilingualScope(document, scope),
    units,
    summary: summarizeTranslations(units),
    generatedAt: new Date().toISOString(),
    translationVersionId: translation?.id,
    translationVersionLabel: translation?.label
  };
}

export function selectUnits(document: UnifiedDocument, scope: BilingualExportScope): DocumentUnit[] {
  switch (scope.type) {
    case "chapter": {
      const chapter = document.chapters.find((item) => item.id === scope.chapterId);
      const unitIds = new Set(chapter?.unitIds ?? []);
      return document.units.filter((unit) => unitIds.has(unit.id)).sort(byOrder);
    }
    case "page":
      return document.units.filter((unit) => unit.pageNumber === scope.pageNumber).sort(byOrder);
    case "units": {
      const unitIds = new Set(scope.unitIds ?? []);
      return document.units.filter((unit) => unitIds.has(unit.id)).sort(byOrder);
    }
    case "full":
    default:
      return [...document.units].sort(byOrder);
  }
}

export function formatBilingualScope(document: UnifiedDocument, scope: BilingualExportScope): string {
  switch (scope.type) {
    case "chapter": {
      const chapter = document.chapters.find((item) => item.id === scope.chapterId);
      return `chapter:${chapter?.title ?? scope.chapterId ?? "unknown"}`;
    }
    case "page":
      return `page:${scope.pageNumber ?? "unknown"}`;
    case "units":
      return `units:${(scope.unitIds ?? []).join(",") || "none"}`;
    case "full":
    default:
      return "full";
  }
}

export function formatTranslationSummary(summary: TranslationSummary): string {
  return `total=${summary.totalUnits}; translated=${summary.translatedUnits}; missing=${summary.missingUnits}; experimental=${summary.experimentalUnits}`;
}

function summarizeTranslations(units: BilingualExportUnit[]): TranslationSummary {
  return {
    totalUnits: units.length,
    translatedUnits: units.filter((unit) => unit.translationStatus === "available" || unit.translationStatus === "experimental").length,
    missingUnits: units.filter((unit) => unit.translationStatus === "missing").length,
    experimentalUnits: units.filter((unit) => unit.translationStatus === "experimental").length
  };
}

function byOrder(left: DocumentUnit, right: DocumentUnit): number {
  return left.order - right.order;
}
