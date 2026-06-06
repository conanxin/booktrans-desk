import type { Chapter, ChapterProgress } from "../../shared/types.js";
import { chapterStatusLabels } from "../uiText.js";

interface ChapterListProps {
  chapters: Chapter[];
  progress: ChapterProgress[];
}

export function ChapterList({ chapters, progress }: ChapterListProps) {
  const progressById = new Map(progress.map((item) => [item.chapterId, item]));
  return (
    <section className="panel chapter-panel">
      <h2>章节结构</h2>
      {chapters.length ? (
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
        <p className="muted">导入电子书后，将在这里显示 spine 顺序中的章节。</p>
      )}
    </section>
  );
}
