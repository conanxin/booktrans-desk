import type { PdfPage } from "../../shared/types.js";

export function detectScannedLikePdf(pages: PdfPage[]): boolean {
  if (!pages.length) {
    return true;
  }

  const totalTextLength = pages.reduce((sum, page) => sum + page.text.trim().length, 0);
  const emptyPages = pages.filter((page) => page.text.trim().length < 20).length;
  const emptyRatio = emptyPages / pages.length;

  return totalTextLength < 20 || emptyRatio >= 0.6;
}
