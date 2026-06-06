import type { Chapter, ChapterProgress } from "../../shared/types.js";

interface ChapterListProps {
  chapters: Chapter[];
  progress: ChapterProgress[];
}

export function ChapterList({ chapters, progress }: ChapterListProps) {
  const progressById = new Map(progress.map((item) => [item.chapterId, item]));
  return (
    <section className="panel chapter-panel">
      <h2>Chapters</h2>
      {chapters.length ? (
        <div className="chapter-list">
          {chapters.map((chapter) => {
            const itemProgress = progressById.get(chapter.id);
            return (
              <div className="chapter-row" key={chapter.id}>
                <span className="chapter-order">{chapter.order + 1}</span>
                <div>
                  <strong>{chapter.title}</strong>
                  <span>{chapter.text.length.toLocaleString()} characters</span>
                </div>
                <em>{itemProgress?.status ?? "pending"}</em>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">Import an EPUB to inspect its spine order.</p>
      )}
    </section>
  );
}
