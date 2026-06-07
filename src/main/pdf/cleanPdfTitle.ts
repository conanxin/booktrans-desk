import path from "node:path";

export function cleanPdfTitle(metadataTitle: string | undefined, sourceFilePath: string): string {
  const fallback = path.basename(sourceFilePath, path.extname(sourceFilePath));
  const cleaned = (metadataTitle ?? "")
    .replace(/^\s*Microsoft Word\s*-\s*/i, "")
    .replace(/\.(docx?|rtf)\s*$/i, "")
    .trim();

  if (!cleaned || cleaned.length < 2 || /\.docx?$/i.test(cleaned)) {
    return fallback;
  }
  return cleaned;
}
