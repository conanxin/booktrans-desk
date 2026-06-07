import crypto from "node:crypto";
import type { ChapterProgress, ImportedPdfDocument, PdfTranslationJobResult, TranslationProgress, TranslationQualityProgress, TranslationSettings, TranslatedPdfPage } from "../../shared/types.js";
import { chunkText } from "../translate/chunkText.js";
import { createTranslator } from "../translate/translator.js";
import { createTranslationError } from "../translate/translationErrors.js";
import { createStats, mergeQualityStats, translateWithQualityGate } from "../translate/translateWithQualityGate.js";

type ProgressCallback = (progress: TranslationProgress) => void;
type TextChunker = typeof chunkText;

export interface PdfChunkPlan {
  totalChunks: number;
  pageChunkCounts: Map<number, number>;
  paragraphChunks: Map<string, Array<{ index: number; text: string }>>;
}

export async function translatePdf(
  document: ImportedPdfDocument,
  settings: TranslationSettings,
  signal: AbortSignal,
  onProgress: ProgressCallback
): Promise<PdfTranslationJobResult> {
  if (document.isScannedLike) {
    throw createTranslationError("PDF_NO_TEXT");
  }

  const jobId = crypto.randomUUID();
  const translator = createTranslator(settings);
  const chunkPlan = createPdfChunkPlan(document);
  const totalChunks = chunkPlan.totalChunks;
  let translatedChunks = 0;
  const translatedPages: TranslatedPdfPage[] = [];
  const quality: TranslationQualityProgress = createStats();
  const pageStatuses: ChapterProgress[] = document.pages.map((page) => ({
    chapterId: `pdf-page-${page.pageNumber}`,
    chapterTitle: `第 ${page.pageNumber} 页`,
    currentChunk: 0,
    totalChunks: Math.max(chunkPlan.pageChunkCounts.get(page.pageNumber) ?? 0, 1),
    status: page.status === "skipped" ? "completed" : "pending"
  }));
  const log = [
    `PDF import loaded: pageCount=${document.pageCount}, textLength=${document.textLength}`,
    `PDF translation start: jobId=${jobId}, providerPreset=${settings.providerPreset ?? "openai-compatible"}, model=${settings.useMock ? "mock" : settings.model}, pageCount=${document.pageCount}, totalChunks=${totalChunks}`
  ];

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
      throw createTranslationError("USER_CANCELLED");
    }
    const status = pageStatuses[page.pageNumber - 1];
    if (!page.paragraphs.length) {
      log.push(`PDF page chunked: pageNumber=${page.pageNumber}, paragraphCount=0, chunkCount=0`);
      emit("translating", page.pageNumber);
      continue;
    }

    status.status = "translating";
    status.currentChunk = 0;
    log.push(`PDF page chunked: pageNumber=${page.pageNumber}, paragraphCount=${page.paragraphs.length}, chunkCount=${chunkPlan.pageChunkCounts.get(page.pageNumber) ?? 0}`);
    emit("translating", page.pageNumber);

    const translatedPage: TranslatedPdfPage = {
      pageNumber: page.pageNumber,
      paragraphs: []
    };

    for (const paragraph of page.paragraphs) {
      const chunks = chunkPlan.paragraphChunks.get(paragraph.id) ?? [];
      const translatedChunksForParagraph = [];
      for (const chunk of chunks) {
        if (signal.aborted) {
          throw createTranslationError("USER_CANCELLED");
        }
        log.push(`Provider request start: providerPreset=${settings.providerPreset ?? "openai-compatible"}, model=${settings.useMock ? "mock" : settings.model}, textLength=${chunk.text.length}`);
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

  log.push("PDF translation completed.");
  emit("completed");

  return {
    document,
    translatedPages,
    jobId
  };
}

export function createPdfChunkPlan(document: ImportedPdfDocument, chunker: TextChunker = chunkText): PdfChunkPlan {
  if (!document.textLength || !document.pageTexts.some((page) => page.paragraphs.some((paragraph) => paragraph.text.trim()))) {
    throw createTranslationError("PDF_NO_TEXT");
  }

  const pageChunkCounts = new Map<number, number>();
  const paragraphChunks = new Map<string, Array<{ index: number; text: string }>>();
  let totalChunks = 0;
  let sawParagraph = false;

  for (const page of document.pageTexts) {
    let pageCount = 0;
    for (const paragraph of page.paragraphs) {
      if (!paragraph.text.trim()) {
        continue;
      }
      sawParagraph = true;
      const chunks = chunker(paragraph.text).filter((chunk) => chunk.text.trim());
      if (!chunks.length) {
        throw createTranslationError("PDF_CHUNKING_FAILED", `page=${page.pageNumber}, paragraph=${paragraph.index}`);
      }
      paragraphChunks.set(paragraph.id, chunks);
      pageCount += chunks.length;
      totalChunks += chunks.length;
    }
    pageChunkCounts.set(page.pageNumber, pageCount);
  }

  if (!sawParagraph || totalChunks === 0) {
    throw createTranslationError(sawParagraph ? "PDF_CHUNKING_FAILED" : "PDF_NO_TEXT");
  }

  return {
    totalChunks,
    pageChunkCounts,
    paragraphChunks
  };
}
