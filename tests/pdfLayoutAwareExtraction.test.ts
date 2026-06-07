import { describe, expect, it } from "vitest";
import { classifyPdfRegions } from "../src/main/pdf/classifyPdfRegions.js";
import { extractLayoutBlocks, type PdfTextItemLike } from "../src/main/pdf/extractLayoutBlocks.js";
import { bodyReadingBlocks } from "../src/main/pdf/reconstructReadingOrder.js";
import { normalizeParagraphText, reconstructParagraphs } from "../src/main/pdf/reconstructParagraphs.js";

describe("layout-aware PDF extraction", () => {
  it("orders two-column body text left column first, then right column", () => {
    const ordered = orderedTexts([
      item("right first", 330, 700),
      item("left first", 72, 720),
      item("right second", 330, 680),
      item("left second", 72, 700)
    ]);
    expect(ordered).toEqual(["left first", "left second", "right first", "right second"]);
  });

  it("excludes header and footer from body paragraphs", () => {
    const page = extractLayoutBlocks([item("Nature", 72, 820), item("body line", 72, 700), item("page 1", 280, 20)], 1, size());
    const paragraphs = reconstructParagraphs(bodyReadingBlocks(classifyPdfRegions(page)), 1);
    expect(paragraphs.map((paragraph) => paragraph.text)).toEqual(["body line"]);
  });

  it("keeps quote boxes and references separate", () => {
    const page = extractLayoutBlocks([item("body line", 72, 700), item('"Important quote"', 160, 640, 320), item("References", 72, 160), item("1. Smith et al.", 72, 140)], 1, size());
    const paragraphs = reconstructParagraphs(bodyReadingBlocks(classifyPdfRegions(page)), 1);
    expect(paragraphs.find((paragraph) => paragraph.role === "quote-box")?.text).toContain("Important quote");
    expect(paragraphs.filter((paragraph) => paragraph.role === "references").map((paragraph) => paragraph.text)).toEqual(["References", "1. Smith et al."]);
  });

  it("repairs hyphenated words and split short names", () => {
    expect(normalizeParagraphText(["inten-", "tional binding", "Li", "u studied this."])).toBe("intentional binding Liu studied this.");
  });

  it("handles a synthetic Nature-style two-column short article", () => {
    const page = extractLayoutBlocks(
      [
        item("Nature | News", 72, 820),
        item("Brain systems and agency", 72, 760, 410),
        item("Research briefing", 72, 735, 250),
        item("The inten-", 72, 690),
        item("tional stance depends on context", 72, 672),
        item("Li", 72, 654),
        item("u and colleagues tested agents [1].", 89, 654),
        item("Right-column findings follow here.", 330, 690),
        item('"A quote box stays separate."', 160, 610, 320),
        item("References", 72, 180),
        item("1. Liu et al. Nature.", 72, 160),
        item("1", 296, 20)
      ],
      1,
      size()
    );
    const paragraphs = reconstructParagraphs(bodyReadingBlocks(classifyPdfRegions(page)), 1);
    const bodyText = paragraphs.map((paragraph) => paragraph.text).join(" ");
    expect(bodyText).toContain("intentional stance depends on context Liu and colleagues tested agents [1].");
    expect(paragraphs.find((paragraph) => paragraph.role === "body-left-column")?.text).toContain("intentional");
    expect(paragraphs.some((paragraph) => paragraph.role === "body-right-column" && paragraph.text.includes("Right-column"))).toBe(true);
    expect(paragraphs.some((paragraph) => paragraph.role === "references")).toBe(true);
  });
});

function orderedTexts(items: PdfTextItemLike[]) {
  const page = extractLayoutBlocks(items, 1, size());
  return bodyReadingBlocks(classifyPdfRegions(page)).map((block) => block.text);
}

function item(str: string, x: number, y: number, width = str.length * 5): PdfTextItemLike {
  return { str, transform: [10, 0, 0, 10, x, y], width, height: 10 };
}

function size() {
  return { width: 595.28, height: 841.89 };
}
