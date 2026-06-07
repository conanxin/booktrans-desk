import crypto from "node:crypto";
import type { ChapterProgress, ImportedPdfDocument, PdfTranslationJobResult, TranslationProgress, TranslationQualityProgress, TranslationSettings, TranslatedPdfPage } from "../../shared/types.js";
import { chunkText } from "../translate/chunkText.js";
import { createTranslator } from "../translate/translator.js";
import { createStats, mergeQualityStats, translateWithQualityGate } from "../translate/translateWithQualityGate.js";

type ProgressCallback = (progress: TranslationProgress) => void;

export async function translatePdf(
  document: ImportedPdfDocument,
  settings: TranslationSettings,
  signal: AbortSignal,
  onProgress: ProgressCallback
): Promise<PdfTranslationJobResult> {
  if (document.isScannedLike) {
    throw new Error("这个 PDF 可能是扫描版或图片型 PDF。当前版本暂不支持 OCR，请等待后续版本。");
  }

  const translator = createTranslator(settings);
  const translatablePages = document.pageTexts.filter((page) => page.paragraphs.length > 0);
  const totalChunks = translatablePages.reduce(
    (sum, page) => sum + page.paragraphs.reduce((pageSum, paragraph) => pageSum + Math.max(chunkText(paragraph.text).length, 1), 0),
    0
  );
  let translatedChunks = 0;
  const translatedPages: TranslatedPdfPage[] = [];
  const quality: TranslationQualityProgress = createStats();
  const pageStatuses: ChapterProgress[] = document.pages.map((page) => ({
    chapterId: `pdf-page-${page.pageNumber}`,
    chapterTitle: `第 ${page.pageNumber} 页`,
    currentChunk: 0,
    totalChunks: Math.max(document.pageTexts[page.pageNumber - 1]?.paragraphs.length ?? 0, 1),
    status: page.status === "skipped" ? "completed" : "pending"
  }));
  const log = [`PDF 翻译任务已准备，共 ${document.pageCount} 页。`];

  const emit = (status: TranslationProgress["status"], currentPage?: number) => {
    onProgress({
      documentType: "pdf",
      currentPage,
      translatedPages: translatedPages.length,
      totalPages: document.pageCount,
      currentChapter: currentPage ? `第 ${currentPage} 页` : undefined,
      translatedChunks,
      totalChunks,
      status,
      chapters: pageStatuses.map((item) => ({ ...item })),
      log: [...log],
      quality: { ...quality, warnings: [...quality.warnings] }
    });
  };

  emit("pending");

  for (const page of document.pageTexts) {
    if (signal.aborted) {
      throw new Error("PDF 翻译已取消。");
    }
    const status = pageStatuses[page.pageNumber - 1];
    if (!page.paragraphs.length) {
      log.push(`跳过第 ${page.pageNumber} 页：没有可提取文本。`);
      emit("translating", page.pageNumber);
      continue;
    }

    status.status = "translating";
    status.currentChunk = 0;
    log.push(`正在翻译第 ${page.pageNumber} 页。`);
    emit("translating", page.pageNumber);

    const translatedPage: TranslatedPdfPage = {
      pageNumber: page.pageNumber,
      paragraphs: []
    };

    for (const paragraph of page.paragraphs) {
      const chunks = chunkText(paragraph.text);
      const translatedChunksForParagraph = [];
      for (const chunk of chunks.length ? chunks : [{ index: 0, text: paragraph.text }]) {
        if (signal.aborted) {
          throw new Error("PDF 翻译已取消。");
        }
        const translated = await translateWithQualityGate(translator, chunk.text, signal, {
          onStats: (stats) => {
            mergeQualityStats(quality, stats);
          },
          onLog: (message) => {
            log.push(message);
            emit("translating", page.pageNumber);
          }
        });
        translatedChunksForParagraph.push(translated);
        translatedChunks += 1;
        status.currentChunk += 1;
        emit("translating", page.pageNumber);
      }
      translatedPage.paragraphs.push({
        index: paragraph.index,
        source: paragraph.text,
        translated: translatedChunksForParagraph.join("\n\n")
      });
    }

    status.status = "completed";
    translatedPages.push(translatedPage);
    emit("translating", page.pageNumber);
  }

  log.push("PDF 翻译已完成。");
  emit("completed");

  return {
    document,
    translatedPages,
    jobId: crypto.randomUUID()
  };
}
