import type { PdfRegionRole } from "../../shared/types.js";
import type { PdfLayoutPage, PdfTextBlock } from "./extractLayoutBlocks.js";

export interface ClassifiedPdfBlock extends PdfTextBlock {
  role: PdfRegionRole;
}

export function classifyPdfRegions(page: PdfLayoutPage): ClassifiedPdfBlock[] {
  const center = page.width / 2;
  const bodyBlocks = page.blocks.filter((block) => !isHeader(block, page.height) && !isFooter(block, page.height));
  const topBodyY = Math.max(...bodyBlocks.map((block) => block.bbox.y), 0);
  let seenReferences = false;

  return page.blocks.map((block) => {
    let role: PdfRegionRole;
    if (isHeader(block, page.height)) {
      role = "header";
    } else if (isFooter(block, page.height)) {
      role = "footer";
    } else if (isReferenceStart(block.text) || seenReferences) {
      role = "references";
      seenReferences = true;
    } else if (isQuoteBox(block, page.width)) {
      role = "quote-box";
    } else if (block.bbox.y >= topBodyY - 12 && block.bbox.width > page.width * 0.45) {
      role = "title";
    } else if (block.bbox.y >= topBodyY - 48 && block.bbox.width > page.width * 0.35) {
      role = "subtitle";
    } else {
      role = block.bbox.x + block.bbox.width / 2 < center ? "body-left-column" : "body-right-column";
    }
    return { ...block, role };
  });
}

function isHeader(block: PdfTextBlock, pageHeight: number): boolean {
  return block.bbox.y > pageHeight * 0.93;
}

function isFooter(block: PdfTextBlock, pageHeight: number): boolean {
  return block.bbox.y < pageHeight * 0.06;
}

function isReferenceStart(text: string): boolean {
  return /^(references|bibliography|\u53c2\u8003\u6587\u732e)\b/i.test(text.trim());
}

function isQuoteBox(block: PdfTextBlock, pageWidth: number): boolean {
  const text = block.text.trim();
  return /^["\u201c\u201d]/.test(text) || /\b(box|sidebar|quote)\b/i.test(text) || (block.bbox.width > pageWidth * 0.55 && block.bbox.x > pageWidth * 0.12 && block.bbox.x < pageWidth * 0.35);
}
