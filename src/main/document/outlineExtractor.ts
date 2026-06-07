import type { DocumentUnit, UnifiedDocument, UnifiedDocumentOutlineNode } from "../../shared/documentModel.js";

export interface OutlineExtractionResult {
  flat: UnifiedDocumentOutlineNode[];
  tree: UnifiedDocumentOutlineNode[];
}

export function extractOutline(document: UnifiedDocument): OutlineExtractionResult {
  const flat = document.sourceFormat === "epub" ? outlineFromChapters(document) : outlineFromPdfUnits(document);
  return {
    flat,
    tree: buildOutlineTree(flat)
  };
}

export function flattenOutline(nodes: UnifiedDocumentOutlineNode[]): UnifiedDocumentOutlineNode[] {
  return nodes.flatMap((node) => [{ ...node, children: [] }, ...flattenOutline(node.children)]);
}

function outlineFromChapters(document: UnifiedDocument): UnifiedDocumentOutlineNode[] {
  return document.chapters.map((chapter, index) => ({
    id: `outline-${chapter.id}`,
    title: chapter.title || `Chapter ${index + 1}`,
    level: 1,
    order: index,
    chapterId: chapter.id,
    unitId: chapter.unitIds[0],
    pageNumber: chapter.pageNumber,
    children: []
  }));
}

function outlineFromPdfUnits(document: UnifiedDocument): UnifiedDocumentOutlineNode[] {
  const nodes: UnifiedDocumentOutlineNode[] = [];
  for (const unit of document.units) {
    const heading = detectHeading(unit);
    if (!heading) {
      continue;
    }
    nodes.push({
      id: `outline-${unit.id}`,
      title: heading.title,
      level: heading.level,
      order: nodes.length,
      unitId: unit.id,
      chapterId: unit.chapterId,
      pageNumber: unit.pageNumber,
      children: []
    });
  }
  return nodes;
}

function detectHeading(unit: DocumentUnit): { title: string; level: number } | null {
  const title = unit.text.replace(/\s+/g, " ").trim();
  if (!title || title.length > 120) {
    return null;
  }
  if (unit.role === "title" || unit.role === "heading") {
    return { title, level: inferLevel(title, 1) };
  }
  if (unit.role !== "paragraph" && unit.role !== "chapter") {
    return null;
  }
  if (isKnownHeading(title)) {
    return { title, level: inferLevel(title, 1) };
  }
  return null;
}

function isKnownHeading(title: string): boolean {
  return hasAny(title, [
    /^摘要$/,
    /^引言$/,
    /^方法$/,
    /^结果$/,
    /^讨论$/,
    /^结论$/,
    /^参考文献$/,
    /^第\s*[一二三四五六七八九十百\d]+\s*章/,
    /^abstract$/i,
    /^introduction$/i,
    /^methods?$/i,
    /^results?$/i,
    /^discussion$/i,
    /^conclusion$/i,
    /^references$/i,
    /^chapter\s+\d+/i,
    /^\d+(\.\d+){0,3}\s+\S+/
  ]);
}

function inferLevel(title: string, fallback: number): number {
  const numbered = title.match(/^(\d+(?:\.\d+){0,3})\s+/);
  if (numbered) {
    return Math.min(4, numbered[1].split(".").length);
  }
  if (/^第\s*[一二三四五六七八九十百\d]+\s*章/.test(title) || /^chapter\s+\d+/i.test(title)) {
    return 1;
  }
  return fallback;
}

function buildOutlineTree(flat: UnifiedDocumentOutlineNode[]): UnifiedDocumentOutlineNode[] {
  const roots: UnifiedDocumentOutlineNode[] = [];
  const stack: UnifiedDocumentOutlineNode[] = [];
  for (const node of flat) {
    const next: UnifiedDocumentOutlineNode = { ...node, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= next.level) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];
    if (parent) {
      parent.children.push(next);
    } else {
      roots.push(next);
    }
    stack.push(next);
  }
  return roots;
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

