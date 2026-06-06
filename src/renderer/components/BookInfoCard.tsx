import type { ImportedBook } from "../../shared/types.js";

interface BookInfoCardProps {
  book: ImportedBook | null;
}

export function BookInfoCard({ book }: BookInfoCardProps) {
  return (
    <section className="panel book-info">
      <h2>Book Info</h2>
      {book ? (
        <dl>
          <div>
            <dt>Title</dt>
            <dd>{book.metadata.title}</dd>
          </div>
          <div>
            <dt>Author</dt>
            <dd>{book.metadata.author}</dd>
          </div>
          <div>
            <dt>Language</dt>
            <dd>{book.metadata.language || "Unknown"}</dd>
          </div>
          <div>
            <dt>Chapters</dt>
            <dd>{book.chapters.length}</dd>
          </div>
        </dl>
      ) : (
        <p className="muted">No EPUB imported yet.</p>
      )}
    </section>
  );
}
