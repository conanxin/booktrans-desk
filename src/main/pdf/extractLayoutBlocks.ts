import type { PdfBoundingBox } from "../../shared/types.js";

export interface PdfTextItemLike {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  fontName?: string;
}

export interface PdfTextSpan {
  text: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  fontName?: string;
}

export interface PdfTextBlock {
  id: string;
  pageNumber: number;
  text: string;
  spans: PdfTextSpan[];
  bbox: PdfBoundingBox;
}

export interface PdfLayoutPage {
  pageNumber: number;
  width: number;
  height: number;
  blocks: PdfTextBlock[];
}

export function extractLayoutBlocks(items: PdfTextItemLike[], pageNumber: number, pageSize: { width: number; height: number }): PdfLayoutPage {
  const spans = items
    .map((item): PdfTextSpan => {
      const transform = item.transform ?? [];
      const text = item.str ?? "";
      return {
        text,
        pageNumber,
        x: transform[4] ?? 0,
        y: transform[5] ?? 0,
        width: item.width ?? Math.max(text.length * 5, 1),
        height: item.height ?? Math.abs(transform[3] ?? transform[0] ?? 10),
        fontName: item.fontName
      };
    })
    .filter((span) => span.text.trim());

  const lineMap = new Map<number, PdfTextSpan[]>();
  for (const span of spans) {
    const key = Math.round(span.y / 3) * 3;
    lineMap.set(key, [...(lineMap.get(key) ?? []), span]);
  }

  const blocks = [...lineMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .flatMap(([, line]) => splitLineIntoClusters(line.sort((a, b) => a.x - b.x)))
    .map((cluster, index) => spansToBlock(cluster, pageNumber, index))
    .filter((block) => block.text.trim());

  return { pageNumber, width: pageSize.width, height: pageSize.height, blocks };
}

function splitLineIntoClusters(spans: PdfTextSpan[]): PdfTextSpan[][] {
  const clusters: PdfTextSpan[][] = [];
  let current: PdfTextSpan[] = [];
  let previousRight = 0;
  for (const span of spans) {
    const gap = span.x - previousRight;
    if (current.length && gap > 48) {
      clusters.push(current);
      current = [span];
    } else {
      current.push(span);
    }
    previousRight = span.x + span.width;
  }
  if (current.length) {
    clusters.push(current);
  }
  return clusters;
}

function spansToBlock(spans: PdfTextSpan[], pageNumber: number, index: number): PdfTextBlock {
  const text = joinSpans(spans);
  const left = Math.min(...spans.map((span) => span.x));
  const right = Math.max(...spans.map((span) => span.x + span.width));
  const bottom = Math.min(...spans.map((span) => span.y));
  const top = Math.max(...spans.map((span) => span.y + span.height));
  return {
    id: `pdf-page-${pageNumber}-block-${index + 1}`,
    pageNumber,
    text,
    spans,
    bbox: { x: left, y: bottom, width: right - left, height: top - bottom }
  };
}

function joinSpans(spans: PdfTextSpan[]): string {
  let output = "";
  let previousRight = 0;
  for (const [index, span] of spans.entries()) {
    const gap = span.x - previousRight;
    const splitShortName = /\b[A-Z][a-z]{0,2}$/.test(output) && /^[a-z]\b/.test(span.text);
    const needsSpace = index > 0 && gap > Math.max(span.height * 0.2, 2) && !output.endsWith(" ") && !splitShortName;
    output += `${needsSpace ? " " : ""}${span.text}`;
    previousRight = span.x + span.width;
  }
  return output.replace(/\s+/g, " ").trim();
}
