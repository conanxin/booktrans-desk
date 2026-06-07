import type { ImportedDocument, ImportedPdfDocument } from "../../shared/types.js";

interface BookInfoCardProps {
  book: ImportedDocument | null;
}

export function BookInfoCard({ book }: BookInfoCardProps) {
  return (
    <section className="panel book-info">
      <h2>书籍信息</h2>
      {isPdf(book) ? (
        <dl>
          <div>
            <dt>文件名</dt>
            <dd>{basename(book.filePath)}</dd>
          </div>
          <div>
            <dt>标题</dt>
            <dd>{book.title || "未知"}</dd>
          </div>
          <div>
            <dt>作者</dt>
            <dd>{book.author || "未知"}</dd>
          </div>
          <div>
            <dt>页数</dt>
            <dd>{book.pageCount}</dd>
          </div>
          <div>
            <dt>可提取文本量</dt>
            <dd>{book.textLength.toLocaleString()} 字符</dd>
          </div>
          <div>
            <dt>PDF 类型</dt>
            <dd>{book.isScannedLike ? "可能是扫描版 PDF" : "文本型 PDF"}</dd>
          </div>
        </dl>
      ) : book ? (
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

function isPdf(book: ImportedDocument | null): book is ImportedPdfDocument {
  return book?.type === "pdf";
}

function basename(filePath: string): string {
  return filePath.split(/[\\/]/).filter(Boolean).at(-1) ?? filePath;
}
