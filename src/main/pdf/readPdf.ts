import fs from "node:fs/promises";
import path from "node:path";
import type { ImportedPdfDocument, PdfPageInfo } from "../../shared/types.js";
import { detectScannedLikePdf } from "./detectPdfType.js";
import { classifyPdfRegions } from "./classifyPdfRegions.js";
import { extractLayoutBlocks } from "./extractLayoutBlocks.js";
import { bodyReadingBlocks } from "./reconstructReadingOrder.js";
import { reconstructParagraphs } from "./reconstructParagraphs.js";

export async function readPdf(filePath: string): Promise<ImportedPdfDocument> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(await fs.readFile(filePath));
  const loadingTask = pdfjs.getDocument({
    data,
    disableFontFace: true,
    useSystemFonts: true
  });

  try {
    const document = await loadingTask.promise;
    const metadata = await document.getMetadata().catch(() => null as Awaited<ReturnType<typeof document.getMetadata>> | null);
    const pageTexts = [];

    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 });
      const layout = extractLayoutBlocks(
        content.items as Array<{ str?: string; transform?: number[]; width?: number; height?: number; fontName?: string }>,
        pageNumber,
        { width: viewport.width, height: viewport.height }
      );
      const classified = classifyPdfRegions(layout);
      const ordered = bodyReadingBlocks(classified);
      const paragraphs = reconstructParagraphs(ordered, pageNumber);
      pageTexts.push({
        pageNumber,
        text: paragraphs.map((paragraph) => paragraph.text).join("\n\n"),
        paragraphs
      });
      page.cleanup();
    }

    const pages: PdfPageInfo[] = pageTexts.map((page) => ({
      pageNumber: page.pageNumber,
      textLength: page.text.length,
      paragraphCount: page.paragraphs.length,
      status: page.text.trim() ? "pending" : "skipped"
    }));
    const textLength = pages.reduce((sum, page) => sum + page.textLength, 0);

    return {
      type: "pdf",
      title: getInfoValue(metadata?.info, "Title") || path.basename(filePath, path.extname(filePath)),
      author: getInfoValue(metadata?.info, "Author"),
      filePath,
      pageCount: document.numPages,
      textLength,
      pages,
      pageTexts,
      isScannedLike: detectScannedLikePdf(pageTexts)
    };
  } catch (error) {
    throw new Error(`PDF 解析失败：${error instanceof Error ? error.message : String(error)}`);
  } finally {
    loadingTask.destroy();
  }
}

function getInfoValue(info: unknown, key: string): string | undefined {
  if (!info || typeof info !== "object") {
    return undefined;
  }
  const value = (info as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
