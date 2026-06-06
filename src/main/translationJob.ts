import type {
  ChapterProgress,
  ImportedBook,
  TranslationJobResult,
  TranslationProgress,
  TranslationSettings,
  TranslatedChapter
} from "../shared/types.js";
import { applyTranslatedTextToHtml } from "./epub/writeTranslatedEpub.js";
import { chunkText } from "./translate/chunkText.js";
import { createTranslator } from "./translate/translator.js";

export type ProgressCallback = (progress: TranslationProgress) => void;

export async function translateBook(
  book: ImportedBook,
  settings: TranslationSettings,
  signal: AbortSignal,
  onProgress: ProgressCallback
): Promise<TranslationJobResult> {
  const translator = createTranslator(settings);
  const chapterChunks = book.chapters.map((chapter) => ({ chapter, chunks: chunkText(chapter.text) }));
  const totalChunks = chapterChunks.reduce((sum, item) => sum + item.chunks.length, 0);
  const chapterProgress: ChapterProgress[] = book.chapters.map((chapter) => ({
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    currentChunk: 0,
    totalChunks: chunkText(chapter.text).length,
    status: "pending"
  }));
  const log: string[] = ["Translation task created."];
  const translatedChapters: TranslatedChapter[] = [];
  let translatedChunks = 0;

  const emit = (status: TranslationProgress["status"], currentChapter?: string) => {
    onProgress({
      currentChapter,
      translatedChunks,
      totalChunks,
      status,
      chapters: [...chapterProgress],
      log: [...log]
    });
  };

  emit("pending");

  for (const [chapterIndex, item] of chapterChunks.entries()) {
    if (signal.aborted) {
      throw new Error("Translation cancelled.");
    }

    const progress = chapterProgress[chapterIndex];
    progress.status = "translating";
    log.push(`Translating chapter: ${item.chapter.title}`);
    emit("translating", item.chapter.title);

    const translatedParts: string[] = [];
    for (const chunk of item.chunks) {
      if (signal.aborted) {
        progress.status = "cancelled";
        emit("cancelled", item.chapter.title);
        throw new Error("Translation cancelled.");
      }
      const translated = await translator.translate(chunk.text, signal);
      translatedParts.push(translated);
      progress.currentChunk = chunk.index + 1;
      translatedChunks += 1;
      emit("translating", item.chapter.title);
    }

    const translatedText = translatedParts.join("\n\n");
    translatedChapters.push({
      chapterId: item.chapter.id,
      href: item.chapter.href,
      html: applyTranslatedTextToHtml(item.chapter.html, translatedText)
    });
    progress.status = "completed";
    emit("translating", item.chapter.title);
  }

  log.push("Translation completed.");
  emit("completed");
  return { book, translatedChapters };
}
