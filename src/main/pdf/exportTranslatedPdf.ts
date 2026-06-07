import fs from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { ImportedPdfDocument, TranslationSettings, TranslatedPdfPage } from "../../shared/types.js";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const FONT_SIZE = 11;
const LINE_HEIGHT = 17;

export async function exportTranslatedPdf(
  document: ImportedPdfDocument,
  translatedPages: TranslatedPdfPage[],
  settings: TranslationSettings
): Promise<string> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(resolveFontkit());
  const font = await loadCjkFont(pdf);
  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;

  const writeLine = (text: string, size = FONT_SIZE, color = rgb(0.09, 0.13, 0.17)) => {
    if (y < MARGIN + LINE_HEIGHT) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
    page.drawText(text, { x: MARGIN, y, size, font, color });
    y -= size + 7;
  };

  writeLine(document.title || path.basename(document.filePath), 18, rgb(0.04, 0.33, 0.3));
  writeLine(`原文件：${path.basename(document.filePath)}`, 10);
  writeLine(`翻译模型：${settings.useMock ? "mock" : settings.model}`, 10);
  writeLine(`翻译风格：${settings.style ?? "faithful"}`, 10);
  writeLine(`生成时间：${new Date().toLocaleString("zh-CN")}`, 10);
  y -= 12;

  for (const translatedPage of translatedPages) {
    writeLine(`第 ${translatedPage.pageNumber} 页`, 15, rgb(0.04, 0.33, 0.3));
    for (const paragraph of translatedPage.paragraphs) {
      for (const line of wrapText(paragraph.translated, 62)) {
        writeLine(line);
      }
      y -= 5;
    }
    y -= 10;
  }

  const outputPath = path.join(path.dirname(document.filePath), `${path.basename(document.filePath, path.extname(document.filePath))}.zh.pdf`);
  await fs.writeFile(outputPath, await pdf.save());
  return outputPath;
}

async function loadCjkFont(pdf: PDFDocument) {
  const candidates = [
    "C:/Windows/Fonts/simhei.ttf",
    "C:/Windows/Fonts/NotoSansSC-VF.ttf",
    "C:/Windows/Fonts/Deng.ttf",
    "C:/Windows/Fonts/msyh.ttf",
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

function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let current = "";
    for (const char of paragraph) {
      current += char;
      if (current.length >= maxChars) {
        lines.push(current);
        current = "";
      }
    }
    if (current) {
      lines.push(current);
    }
  }
  return lines.length ? lines : [""];
}

function resolveFontkit() {
  return ((fontkit as unknown as { default?: unknown }).default ?? fontkit) as Parameters<PDFDocument["registerFontkit"]>[0];
}
