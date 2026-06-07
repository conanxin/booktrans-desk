import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface PdfFixtureSet {
  dir: string;
  minimalText: string;
  multiPageText: string;
  cjkText: string;
  emptyOrImageLike: string;
}

export async function createPdfFixtures(): Promise<PdfFixtureSet> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "booktrans-pdf-fixtures-"));
  const minimalText = path.join(dir, "minimal-text.pdf");
  const multiPageText = path.join(dir, "multi-page-text.pdf");
  const cjkText = path.join(dir, "cjk-text.pdf");
  const emptyOrImageLike = path.join(dir, "empty-or-image-like.pdf");

  await writePdf(minimalText, [["Minimal Text PDF", "This is a small text PDF for translation."]], { title: "Minimal Text", author: "BookTrans Test" });
  await writePdf(
    multiPageText,
    [
      ["Page one", "First page has extractable text."],
      ["Page two", "Second page keeps page order."],
      ["Page three", "Third page completes the fixture."]
    ],
    { title: "Multi Page Text", author: "BookTrans Test" }
  );
  await writePdf(cjkText, [["CJK Text", "CJK mixed with English text for PDF export testing."]], { title: "CJK Text", author: "BookTrans Test" });
  await writePdf(emptyOrImageLike, [["", ""]], { title: "Empty Like", author: "BookTrans Test" });

  return { dir, minimalText, multiPageText, cjkText, emptyOrImageLike };
}

async function writePdf(filePath: string, pages: Array<[string, string]>, metadata: { title: string; author: string }): Promise<void> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(metadata.title);
  pdf.setAuthor(metadata.author);
  const font = await pdf.embedFont(StandardFonts.Helvetica);

  for (const [heading, body] of pages) {
    const page = pdf.addPage([595.28, 841.89]);
    if (heading) {
      page.drawText(heading, { x: 72, y: 760, size: 18, font, color: rgb(0.1, 0.1, 0.1) });
    }
    if (body) {
      page.drawText(body, { x: 72, y: 720, size: 12, font, color: rgb(0.1, 0.1, 0.1) });
    }
  }

  await fs.writeFile(filePath, await pdf.save());
}
