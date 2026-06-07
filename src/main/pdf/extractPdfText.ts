import type { PdfPage, PdfParagraph } from "../../shared/types.js";

interface TextItemLike {
  str?: string;
  transform?: number[];
  width?: number;
}

interface LineItem {
  text: string;
  x: number;
  y: number;
}

export function extractReadableTextItems(items: TextItemLike[], pageNumber: number): PdfPage {
  const lines = mergeItemsIntoLines(items);
  const text = lines.map((line) => line.text).join("\n");
  const paragraphs = splitParagraphs(text, pageNumber);

  return {
    pageNumber,
    text,
    paragraphs
  };
}

export function splitParagraphs(text: string, pageNumber: number): PdfParagraph[] {
  return text
    .split(/\n{2,}|(?<=\.)\s*\n/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((paragraph, index) => ({
      id: `pdf-page-${pageNumber}-paragraph-${index + 1}`,
      pageNumber,
      index,
      text: paragraph
    }));
}

function mergeItemsIntoLines(items: TextItemLike[]): LineItem[] {
  const normalized = items
    .map((item) => ({
      text: item.str ?? "",
      x: item.transform?.[4] ?? 0,
      y: item.transform?.[5] ?? 0
    }))
    .filter((item) => item.text.trim());

  const lineMap = new Map<number, LineItem[]>();
  for (const item of normalized) {
    const yKey = Math.round(item.y / 3) * 3;
    const line = lineMap.get(yKey) ?? [];
    line.push(item);
    lineMap.set(yKey, line);
  }

  return [...lineMap.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, line]) => {
      const sorted = line.sort((a, b) => a.x - b.x);
      return {
        x: sorted[0]?.x ?? 0,
        y: sorted[0]?.y ?? 0,
        text: joinLineItems(sorted)
      };
    })
    .filter((line) => line.text.trim());
}

function joinLineItems(items: LineItem[]): string {
  let output = "";
  let previousX = 0;
  for (const [index, item] of items.entries()) {
    const gap = item.x - previousX;
    const needsSpace = index > 0 && gap > 4 && !output.endsWith(" ");
    output += `${needsSpace ? " " : ""}${item.text}`;
    previousX = item.x + item.text.length * 5;
  }
  return output.replace(/\s+/g, " ").trim();
}
