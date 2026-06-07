import type { PdfParagraph } from "../../shared/types.js";
import type { ClassifiedPdfBlock } from "./classifyPdfRegions.js";

const PARAGRAPH_ROLES = new Set(["title", "subtitle", "quote-box", "references"]);

export function reconstructParagraphs(blocks: ClassifiedPdfBlock[], pageNumber: number): PdfParagraph[] {
  const paragraphs: PdfParagraph[] = [];
  let buffer: ClassifiedPdfBlock[] = [];

  const flush = () => {
    if (!buffer.length) {
      return;
    }
    const role = buffer[0].role;
    const text = normalizeParagraphText(buffer.map((block) => block.text));
    if (text) {
      const bbox = mergeBbox(buffer);
      paragraphs.push({
        id: `pdf-page-${pageNumber}-paragraph-${paragraphs.length + 1}`,
        pageNumber,
        index: paragraphs.length,
        text,
        role,
        bbox
      });
    }
    buffer = [];
  };

  for (const block of blocks) {
    if (block.role === "header" || block.role === "footer") {
      continue;
    }
    if (!buffer.length) {
      buffer.push(block);
      if (PARAGRAPH_ROLES.has(block.role)) {
        flush();
      }
      continue;
    }
    const previous = buffer[buffer.length - 1];
    if (shouldContinueParagraph(previous, block)) {
      buffer.push(block);
    } else {
      flush();
      buffer.push(block);
      if (PARAGRAPH_ROLES.has(block.role)) {
        flush();
      }
    }
  }
  flush();
  return paragraphs;
}

export function normalizeParagraphText(lines: string[]): string {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .reduce((parts, line) => {
      if (!parts.length) {
        return [line];
      }
      const previous = parts[parts.length - 1];
      if (/-$/.test(previous)) {
        parts[parts.length - 1] = `${previous.slice(0, -1)}${line}`;
      } else if (isSplitName(previous, line)) {
        parts[parts.length - 1] = `${previous}${line}`;
      } else {
        parts.push(line);
      }
      return parts;
    }, [] as string[])
    .join(" ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldContinueParagraph(previous: ClassifiedPdfBlock, next: ClassifiedPdfBlock): boolean {
  if (previous.role !== next.role) {
    return false;
  }
  if (PARAGRAPH_ROLES.has(next.role)) {
    return false;
  }
  const lineGap = previous.bbox.y - next.bbox.y;
  const sameColumn = Math.abs(previous.bbox.x - next.bbox.x) < 28;
  const indentedContinuation = next.bbox.x - previous.bbox.x < 42;
  return lineGap >= 0 && lineGap < 28 && sameColumn && indentedContinuation && !/[.!?\u3002\uff01\uff1f]\s*$/.test(previous.text.trim());
}

function isSplitName(previous: string, next: string): boolean {
  return /\b[A-Z][a-z]{0,2}$/.test(previous) && /^[a-z]\b/.test(next);
}

function mergeBbox(blocks: ClassifiedPdfBlock[]) {
  const left = Math.min(...blocks.map((block) => block.bbox.x));
  const right = Math.max(...blocks.map((block) => block.bbox.x + block.bbox.width));
  const bottom = Math.min(...blocks.map((block) => block.bbox.y));
  const top = Math.max(...blocks.map((block) => block.bbox.y + block.bbox.height));
  return { x: left, y: bottom, width: right - left, height: top - bottom };
}
