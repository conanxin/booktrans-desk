import type { ImportedBook } from "../../shared/types.js";

interface BookInfoCardProps {
  book: ImportedBook | null;
}

export function BookInfoCard({ book }: BookInfoCardProps) {
  return (
    <section className="panel book-info">
      <h2>书籍信息</h2>
      {book ? (
        <dl>
          <div>
            <dt>书名</dt>
            <dd>{book.metadata.title}</dd>
          </div>
          <div>
            <dt>作者</dt>
            <dd>{book.metadata.author}</dd>
          </div>
          <div>
            <dt>语言</dt>
            <dd>{book.metadata.language || "未知"}</dd>
          </div>
          <div>
            <dt>章节数</dt>
            <dd>{book.chapters.length}</dd>
          </div>
          <div>
            <dt>文件路径</dt>
            <dd title={book.filePath}>{book.filePath}</dd>
          </div>
          <div>
            <dt>EPUB 类型</dt>
            <dd>reflowable EPUB</dd>
          </div>
        </dl>
      ) : (
        <p className="muted">导入 EPUB 后，这里会显示书籍信息。</p>
      )}
    </section>
  );
}
