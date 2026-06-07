import type { DocumentChapter, DocumentUnit, UnifiedDocument } from "./documentModel.js";

export interface DocumentPageSummary {
  pageNumber: number;
  title: string;
  unitIds: string[];
  unitCount: number;
  textLength: number;
  sourceHint: string;
}

export function getDocumentChapters(document: UnifiedDocument): DocumentChapter[] {
  return [...document.chapters].sort((left, right) => left.order - right.order);
}

export function getUnitsForChapter(document: UnifiedDocument, chapterId: string | null | undefined): DocumentUnit[] {
  const chapter = document.chapters.find((item) => item.id === chapterId);
  if (!chapter) {
    return document.units.slice(0, 1);
  }
  const unitIds = new Set(chapter.unitIds);
  return document.units.filter((unit) => unitIds.has(unit.id)).sort((left, right) => left.order - right.order);
}

export function getDocumentPages(document: UnifiedDocument): DocumentPageSummary[] {
  const groups = new Map<number, DocumentUnit[]>();
  for (const unit of document.units) {
    if (typeof unit.pageNumber !== "number") {
      continue;
    }
    const list = groups.get(unit.pageNumber) ?? [];
    list.push(unit);
    groups.set(unit.pageNumber, list);
  }

  return [...groups.entries()]
    .sort(([left], [right]) => left - right)
    .map(([pageNumber, units]) => {
      const sortedUnits = units.sort((left, right) => left.order - right.order);
      return {
        pageNumber,
        title: `Page ${pageNumber}`,
        unitIds: sortedUnits.map((unit) => unit.id),
        unitCount: sortedUnits.length,
        textLength: sortedUnits.reduce((sum, unit) => sum + unit.text.length, 0),
        sourceHint: `Page ${pageNumber}`
      };
    });
}

export function getUnitsForPage(document: UnifiedDocument, pageNumber: number | null | undefined): DocumentUnit[] {
  if (typeof pageNumber !== "number") {
    return document.units.filter((unit) => unit.text.trim()).slice(0, 1);
  }
  return document.units.filter((unit) => unit.pageNumber === pageNumber).sort((left, right) => left.order - right.order);
}

export function getUnitSourceHint(unit: DocumentUnit): string {
  const explicitHint = unit.metadata?.sourceHint;
  if (typeof explicitHint === "string" && explicitHint.trim()) {
    return explicitHint;
  }
  if (unit.chapterTitle && unit.pageNumber) {
    return `${unit.chapterTitle} - page ${unit.pageNumber}`;
  }
  if (unit.chapterTitle) {
    return unit.chapterTitle;
  }
  if (unit.pageNumber) {
    return `Page ${unit.pageNumber}`;
  }
  return unit.sourceHref ?? unit.id;
}

export function formatBoundingBox(unit: DocumentUnit): string {
  if (!unit.bbox) {
    return "";
  }
  const { x, y, width, height } = unit.bbox;
  return `x:${round(x)} y:${round(y)} w:${round(width)} h:${round(height)}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
