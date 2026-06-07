import type { ChapterProgress, ImportedDocument, ImportedPdfDocument } from "../../shared/types.js";
import { chapterStatusLabels } from "../uiText.js";

interface ChapterListProps {
  document: ImportedDocument | null;
  progress: ChapterProgress[];
}

export function ChapterList({ document, progress }: ChapterListProps) {
  const progressById = new Map(progress.map((item) => [item.chapterId, item]));
  const isPdfDocument = isPdf(document);
  const chapters = !document || isPdfDocument ? [] : document.chapters;
  const pdfPages = isPdfDocument ? document.pages : [];
  return (
    <section className="panel chapter-panel">
      <h2>{isPdfDocument ? "页面结构" : "章节结构"}</h2>
      {isPdfDocument && pdfPages.length ? (
        <div className="chapter-list">
          {pdfPages.map((page) => {
            const itemProgress = progressById.get(`pdf-page-${page.pageNumber}`);
            return (
              <div className="chapter-row" key={page.pageNumber}>
                <span className="chapter-order">{page.pageNumber}</span>
                <div>
                  <strong>第 {page.pageNumber} 页</strong>
                  <span>{page.textLength.toLocaleString()} 字符 · {page.paragraphCount} 段</span>
                </div>
                <em>{itemProgress ? chapterStatusLabels[itemProgress.status] : page.status === "skipped" ? "跳过" : "待翻译"}</em>
              </div>
            );
          })}
        </div>
      ) : chapters.length ? (
        <div className="chapter-list">
          {chapters.map((chapter) => {
            const itemProgress = progressById.get(chapter.id);
            return (
              <div className="chapter-row" key={chapter.id}>
                <span className="chapter-order">{chapter.order + 1}</span>
                <div>
                  <strong>{chapter.title}</strong>
                  <span>{chapter.text.length.toLocaleString()} 字符</span>
                </div>
                <em>{chapterStatusLabels[itemProgress?.status ?? "pending"]}</em>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">导入文件后，将在这里显示 EPUB 章节或 PDF 页面结构。</p>
      )}
    </section>
  );
}

function isPdf(document: ImportedDocument | null): document is ImportedPdfDocument {
  return document?.type === "pdf";
}
