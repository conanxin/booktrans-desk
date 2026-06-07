import type { PdfRegionRole } from "../../shared/types.js";
import type { ClassifiedPdfBlock } from "./classifyPdfRegions.js";

const ORDER: Record<PdfRegionRole, number> = {
  title: 0,
  subtitle: 1,
  "body-left-column": 2,
  "body-right-column": 3,
  "quote-box": 4,
  references: 5,
  header: 6,
  footer: 7
};

export function reconstructReadingOrder(blocks: ClassifiedPdfBlock[]): ClassifiedPdfBlock[] {
  return [...blocks].sort((a, b) => {
    const roleDelta = ORDER[a.role] - ORDER[b.role];
    if (roleDelta !== 0) {
      return roleDelta;
    }
    const yDelta = b.bbox.y - a.bbox.y;
    if (Math.abs(yDelta) > 2) {
      return yDelta;
    }
    return a.bbox.x - b.bbox.x;
  });
}

export function bodyReadingBlocks(blocks: ClassifiedPdfBlock[]): ClassifiedPdfBlock[] {
  return reconstructReadingOrder(blocks).filter((block) => block.role !== "header" && block.role !== "footer");
}
