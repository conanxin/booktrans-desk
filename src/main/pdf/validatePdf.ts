import fs from "node:fs/promises";
import type { PdfValidationReport } from "../../shared/types.js";
import { readPdf } from "./readPdf.js";

export async function validatePdf(filePath: string): Promise<PdfValidationReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checkedFiles = [filePath];
  let fileSize = 0;
  let pageCount = 0;
  let title: string | undefined;
  let author: string | undefined;

  try {
    const stat = await fs.stat(filePath);
    fileSize = stat.size;
    if (stat.size <= 0) {
      errors.push("PDF 文件大小为 0。");
    }
  } catch {
    errors.push("PDF 文件不存在。");
  }

  if (!errors.length) {
    try {
      const pdf = await readPdf(filePath);
      pageCount = pdf.pageCount;
      title = pdf.title;
      author = pdf.author;
      if (pdf.pageCount <= 0) {
        errors.push("PDF 页数为 0。");
      }
      if (pdf.isScannedLike) {
        warnings.push("PDF 可提取文本很少，可能是扫描版或图片型 PDF。");
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  const status = errors.length ? "fail" : warnings.length ? "warning" : "pass";
  return {
    status,
    errors,
    warnings,
    checkedFiles,
    summary: status === "pass" ? "PDF 验证通过。" : status === "warning" ? "PDF 可读取，但存在警告。" : "PDF 验证失败。",
    pageCount,
    fileSize,
    title,
    author
  };
}
