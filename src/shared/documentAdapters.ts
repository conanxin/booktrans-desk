import type { ImportedBook, ImportedPdfDocument, PdfRegionRole } from "./types.js";
import type { DocumentChapter, DocumentUnit, DocumentUnitRole, UnifiedDocument } from "./documentModel.js";

export function fromImportedBook(book: ImportedBook): UnifiedDocument {
  const title = cleanTitle(book.metadata.title) || fallbackTitleFromPath(book.filePath, "Untitled EPUB");
  const documentId = stableId("doc", ["epub", book.filePath, title, book.chapters.map((chapter) => chapter.id).join("|")]);
  const now = new Date().toISOString();
  const chapters: DocumentChapter[] = [];
  const units: DocumentUnit[] = [];

  for (const chapter of [...book.chapters].sort((left, right) => left.order - right.order)) {
    const chapterId = stableId("chapter", [documentId, chapter.id, chapter.href, String(chapter.order)]);
    const unitId = stableId("unit", [chapterId, "chapter", String(chapter.order)]);
    units.push({
      id: unitId,
      documentId,
      sourceFormat: "epub",
      role: "chapter",
      text: chapter.text,
      order: units.length,
      chapterId,
      chapterTitle: chapter.title,
      sourceHref: chapter.href,
      metadata: {
        originalChapterId: chapter.id,
        absolutePath: chapter.absolutePath,
        mediaType: chapter.mediaType
      }
    });
    chapters.push({
      id: chapterId,
      documentId,
      title: cleanTitle(chapter.title) || `Chapter ${chapter.order + 1}`,
      order: chapter.order,
      unitIds: [unitId],
      sourceHref: chapter.href,
      metadata: {
        originalChapterId: chapter.id,
        absolutePath: chapter.absolutePath,
        mediaType: chapter.mediaType
      }
    });
  }

  return {
    id: documentId,
    sourceFormat: "epub",
    sourcePath: book.filePath,
    title,
    metadata: {
      title,
      author: book.metadata.author,
      language: book.metadata.language,
      rootFilePath: book.rootFilePath,
      opfDir: book.opfDir,
      bookFingerprint: book.bookFingerprint
    },
    units,
    chapters,
    outline: [],
    translations: [],
    exports: [],
    diagnostics: {
      parser: "booktrans-epub",
      textLength: units.reduce((sum, unit) => sum + unit.text.length, 0),
      chapterCount: chapters.length,
      unitCount: units.length,
      warnings: [],
      errors: []
    },
    createdAt: now,
    updatedAt: now
  };
}

export function fromImportedPdfDocument(pdf: ImportedPdfDocument): UnifiedDocument {
  const title = cleanTitle(pdf.title) || fallbackTitleFromPath(pdf.filePath, "Untitled PDF");
  const documentId = stableId("doc", ["pdf", pdf.filePath, title, String(pdf.pageCount), String(pdf.textLength)]);
  const now = new Date().toISOString();
  const units: DocumentUnit[] = [];
  const chapters: DocumentChapter[] = [];

  for (const page of [...pdf.pageTexts].sort((left, right) => left.pageNumber - right.pageNumber)) {
    const chapterId = stableId("page", [documentId, String(page.pageNumber)]);
    const pageUnitIds: string[] = [];
    for (const paragraph of [...page.paragraphs].sort((left, right) => left.index - right.index)) {
      const unitId = stableId("unit", [documentId, String(page.pageNumber), paragraph.id, String(paragraph.index), paragraph.text]);
      const mappedRole = mapPdfRole(paragraph.role);
      units.push({
        id: unitId,
        documentId,
        sourceFormat: "pdf",
        role: mappedRole,
        text: paragraph.text,
        order: units.length,
        chapterId,
        chapterTitle: `Page ${page.pageNumber}`,
        pageNumber: page.pageNumber,
        bbox: paragraph.bbox,
        metadata: {
          originalParagraphId: paragraph.id,
          paragraphIndex: paragraph.index,
          pdfRole: paragraph.role,
          sourceHint: buildPdfSourceHint(page.pageNumber, mappedRole, paragraph.index)
        }
      });
      pageUnitIds.push(unitId);
    }
    chapters.push({
      id: chapterId,
      documentId,
      title: `Page ${page.pageNumber}`,
      order: page.pageNumber - 1,
      unitIds: pageUnitIds,
      pageNumber: page.pageNumber,
      metadata: {
        textLength: page.text.length,
        paragraphCount: page.paragraphs.length
      }
    });
  }

  return {
    id: documentId,
    sourceFormat: "pdf",
    sourcePath: pdf.filePath,
    title,
    metadata: {
      title,
      author: pdf.author,
      pageCount: pdf.pageCount,
      textLength: pdf.textLength,
      isScannedLike: pdf.isScannedLike
    },
    units,
    chapters,
    outline: [],
    translations: [],
    exports: [],
    diagnostics: {
      parser: "booktrans-pdf-layout-aware",
      textLength: pdf.textLength,
      pageCount: pdf.pageCount,
      chapterCount: chapters.length,
      unitCount: units.length,
      isScannedLike: pdf.isScannedLike,
      warnings: pdf.isScannedLike ? ["PDF appears scanned-like or text-sparse."] : [],
      errors: []
    },
    createdAt: now,
    updatedAt: now
  };
}

function mapPdfRole(role: PdfRegionRole | undefined): DocumentUnitRole {
  switch (role) {
    case "title":
      return "title";
    case "subtitle":
      return "subtitle";
    case "quote-box":
      return "quote";
    case "header":
      return "header";
    case "footer":
      return "footer";
    case "references":
      return "reference";
    case "body-left-column":
    case "body-right-column":
    case undefined:
      return "paragraph";
    default:
      return "unknown";
  }
}

function cleanTitle(value: string | undefined): string {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

function fallbackTitleFromPath(filePath: string, fallback: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const name = normalized.split("/").pop()?.replace(/\.[^.]+$/, "").trim();
  return name || fallback;
}

function buildPdfSourceHint(pageNumber: number, role: DocumentUnitRole, paragraphIndex: number): string {
  const roleText = role === "paragraph" ? undefined : role;
  return [`Page ${pageNumber}`, roleText, `paragraph ${paragraphIndex + 1}`].filter(Boolean).join(" - ");
}

function stableId(prefix: string, parts: string[]): string {
  return `${prefix}-${hash(parts.join("\u001f"))}`;
}

function hash(input: string): string {
  let value = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 0x01000193);
  }
  return (value >>> 0).toString(36);
}
