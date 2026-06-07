import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { ImportedPdfDocument, TranslationSettings, TranslatedPdfPage } from "../../shared/types.js";
import { validateTranslationOutput } from "../translate/validateTranslationOutput.js";
import { TRANSLATION_FAILURE_PLACEHOLDER } from "../translate/translateWithQualityGate.js";
import { cleanPdfTitle } from "./cleanPdfTitle.js";

export const PDF_EXPORT_LAYOUT_CSS = `
@page {
  size: A4;
  margin: 18mm 16mm;
}
body {
  font-family: "Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.75;
  font-size: 11.5pt;
}
.page-section {
  break-inside: auto;
  page-break-inside: auto;
  margin-bottom: 18pt;
}
`;

export const PDF_EXPORT_LAYOUT = {
  pageWidth: 595.28,
  pageHeight: 841.89,
  marginTop: 51,
  marginRight: 45,
  marginBottom: 51,
  marginLeft: 45,
  bodyFontSize: 11.5,
  bodyLineHeight: 20.1,
  pageSectionMarginBottom: 18,
  fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", "Source Han Sans SC", sans-serif',
  bodyUsesMonospace: false
} as const;

export async function exportTranslatedPdf(
  document: ImportedPdfDocument,
  translatedPages: TranslatedPdfPage[],
  settings: TranslationSettings
): Promise<string> {
  assertPdfTranslationsExportable(translatedPages);

  const pdf = await PDFDocument.create();
  pdf.registerFontkit(resolveFontkit());
  const font = await loadCjkFont(pdf);
  const title = cleanPdfTitle(document.title, document.filePath);
  pdf.setTitle(title);

  const writer = new PdfTextWriter(pdf, font);
  writer.writeLine(title, 18, rgb(0.04, 0.33, 0.3));
  writer.writeLine(`源文件：${path.basename(document.filePath)}`, 10);
  writer.writeLine(`翻译模型：${settings.useMock ? "mock" : settings.model}`, 10);
  writer.writeLine(`翻译风格：${settings.style ?? "faithful"}`, 10);
  writer.writeLine(`生成时间：${new Date().toLocaleString("zh-CN")}`, 10);
  writer.addSpace(12);

  for (const translatedPage of translatedPages) {
    writer.writeLine(`第 ${translatedPage.pageNumber} 页`, 15, rgb(0.04, 0.33, 0.3));
    for (const paragraph of translatedPage.paragraphs) {
      writer.writeParagraph(paragraph.translated);
    }
    writer.addSpace(PDF_EXPORT_LAYOUT.pageSectionMarginBottom);
  }

  const outputPath = path.join(path.dirname(document.filePath), `${path.basename(document.filePath, path.extname(document.filePath))}.zh.pdf`);
  await fs.writeFile(outputPath, await pdf.save());
  return outputPath;
}

export function assertPdfTranslationsExportable(translatedPages: TranslatedPdfPage[]): void {
  const errors: string[] = [];
  for (const page of translatedPages) {
    for (const paragraph of page.paragraphs) {
      if (paragraph.translated === TRANSLATION_FAILURE_PLACEHOLDER) {
        continue;
      }
      const validation = validateTranslationOutput(paragraph.source, paragraph.translated);
      if (!validation.ok) {
        errors.push(`page ${page.pageNumber} paragraph ${paragraph.index}: ${validation.errors.join(", ")}`);
      }
    }
  }

  if (errors.length) {
    throw new Error(`PDF_EXPORT_BLOCKED_TRANSLATION_INVALID: 译文中包含模型思考过程或提示词内容，请先重试失败段落。 ${errors.slice(0, 3).join("; ")}`);
  }
}

class PdfTextWriter {
  private page: PDFPage;
  private y = PDF_EXPORT_LAYOUT.pageHeight - PDF_EXPORT_LAYOUT.marginTop;
  private readonly maxWidth = PDF_EXPORT_LAYOUT.pageWidth - PDF_EXPORT_LAYOUT.marginLeft - PDF_EXPORT_LAYOUT.marginRight;

  constructor(
    private readonly pdf: PDFDocument,
    private readonly font: PDFFont
  ) {
    this.page = pdf.addPage([PDF_EXPORT_LAYOUT.pageWidth, PDF_EXPORT_LAYOUT.pageHeight]);
  }

  writeParagraph(text: string): void {
    const lines = wrapTextByWidth(text, this.font, PDF_EXPORT_LAYOUT.bodyFontSize, this.maxWidth);
    for (const line of lines) {
      this.writeLine(line, PDF_EXPORT_LAYOUT.bodyFontSize);
    }
    this.addSpace(5);
  }

  writeLine(text: string, size: number = PDF_EXPORT_LAYOUT.bodyFontSize, color = rgb(0.09, 0.13, 0.17)): void {
    if (this.y < PDF_EXPORT_LAYOUT.marginBottom + PDF_EXPORT_LAYOUT.bodyLineHeight) {
      this.page = this.pdf.addPage([PDF_EXPORT_LAYOUT.pageWidth, PDF_EXPORT_LAYOUT.pageHeight]);
      this.y = PDF_EXPORT_LAYOUT.pageHeight - PDF_EXPORT_LAYOUT.marginTop;
    }
    this.page.drawText(text, {
      x: PDF_EXPORT_LAYOUT.marginLeft,
      y: this.y,
      size,
      font: this.font,
      color
    });
    this.y -= size >= 15 ? size + 9 : PDF_EXPORT_LAYOUT.bodyLineHeight;
  }

  addSpace(points: number): void {
    this.y -= points;
  }
}

async function loadCjkFont(pdf: PDFDocument) {
  const candidates = [
    "C:/Windows/Fonts/msyh.ttf",
    "C:/Windows/Fonts/simhei.ttf",
    "C:/Windows/Fonts/NotoSansSC-VF.ttf",
    "C:/Windows/Fonts/Deng.ttf",
    "C:/Windows/Fonts/msyh.ttc",
    "C:/Windows/Fonts/simsun.ttc",
    "C:/Windows/Fonts/arialuni.ttf",
    "/System/Library/Fonts/PingFang.ttc",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
  ];

  for (const candidate of candidates) {
    try {
      const bytes = await fs.readFile(candidate);
      return pdf.embedFont(bytes, { subset: false });
    } catch {
      // Try the next system font candidate.
    }
  }

  throw new Error("未找到可用于导出中文 PDF 的系统字体。");
}

export function wrapTextByWidth(text: string, font: Pick<PDFFont, "widthOfTextAtSize">, fontSize: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let current = "";
    for (const char of Array.from(paragraph)) {
      const next = `${current}${char}`;
      if (current && font.widthOfTextAtSize(next, fontSize) > maxWidth) {
        lines.push(current);
        current = char;
      } else {
        current = next;
      }
    }
    if (current) {
      lines.push(current);
    }
    if (!paragraph) {
      lines.push("");
    }
  }
  return lines.length ? lines : [""];
}

function resolveFontkit() {
  return ((fontkit as unknown as { default?: unknown }).default ?? fontkit) as Parameters<PDFDocument["registerFontkit"]>[0];
}
