import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { readEpub } from "../src/main/epub/readEpub.js";
import { countTranslatableTextNodeGroups } from "../src/main/epub/translateXhtmlTextNodes.js";
import { validateEpub } from "../src/main/epub/validateEpub.js";
import { writeTranslatedEpub } from "../src/main/epub/writeTranslatedEpub.js";
import { translateBook } from "../src/main/translationJob.js";
import type { TranslationProgress } from "../src/shared/types.js";
import { createEpubFixtures } from "./helpers/createEpubFixtures.js";

describe("generated EPUB fixtures", () => {
  it("validates minimal EPUB 3", async () => {
    const fixtures = createFixtures();
    await expect(validateEpub(fixtures.minimalEpub3)).resolves.toMatchObject({ status: "pass" });
  });

  it("validates EPUB 2 NCX without failing", async () => {
    const fixtures = createFixtures();
    const report = await validateEpub(fixtures.epub2Ncx);
    expect(report.status).not.toBe("fail");
  });

  it("keeps images and CSS after export", async () => {
    const fixtures = createFixtures();
    const output = path.join(path.dirname(fixtures.imagesAndCss), "images-and-css.zh.epub");
    const book = await readEpub(fixtures.imagesAndCss);
    const result = await translateBook(book, { baseUrl: "", apiKey: "", model: "", useMock: true }, new AbortController().signal, () => undefined);
    await writeTranslatedEpub(result.book, result.translatedChapters, output);
    const zip = new AdmZip(output);
    expect(zip.getEntry("OPS/images/pixel.png")).toBeTruthy();
    expect(zip.getEntry("OPS/styles/main.css")).toBeTruthy();
  });

  it("preserves footnote links, ids, classes, epub:type, and inline tags", async () => {
    const fixtures = createFixtures();
    const book = await readEpub(fixtures.footnotesInline);
    const result = await translateBook(book, { baseUrl: "", apiKey: "", model: "", useMock: true }, new AbortController().signal, () => undefined);
    const html = result.translatedChapters[0].html;
    expect(html).toContain('href="#fn1"');
    expect(html).toContain('id="ref1"');
    expect(html).toContain('class="lead"');
    expect(html).toContain('epub:type="noteref"');
    expect(html).toContain('epub:type="footnote"');
    expect(html).toContain("<strong>");
    expect(html).toContain("<em>");
  });

  it("exports CJK source without mojibake in body text", async () => {
    const fixtures = createFixtures();
    const output = path.join(path.dirname(fixtures.cjkSource), "cjk-source.zh.epub");
    const book = await readEpub(fixtures.cjkSource);
    const result = await translateBook(book, { baseUrl: "", apiKey: "", model: "", useMock: true }, new AbortController().signal, () => undefined);
    await writeTranslatedEpub(result.book, result.translatedChapters, output);
    const reread = await readEpub(output);
    expect(reread.chapters[0].text).toContain("中文段落");
    expect(reread.chapters[0].text).toContain("日本語テキスト");
  });

  it("fails malformed fixture with missing manifest resource", async () => {
    const fixtures = createFixtures();
    const report = await validateEpub(fixtures.malformedMissingResource);
    expect(report.status).toBe("fail");
    expect(report.errors.some((error) => error.includes("OPS/styles/main.css"))).toBe(true);
  });

  it("imports nested sections in spine order and skips non-linear appendix", async () => {
    const fixtures = createFixtures();
    const output = path.join(path.dirname(fixtures.nestedSections), "nested-sections.zh.epub");
    const book = await readEpub(fixtures.nestedSections);
    expect(book.chapters.map((chapter) => chapter.title)).toEqual(["Chapter One", "Chapter Two"]);

    const result = await translateBook(book, { baseUrl: "", apiKey: "", model: "", useMock: true }, new AbortController().signal, () => undefined);
    expect(result.translatedChapters[0].html).toContain("<h1>");
    expect(result.translatedChapters[0].html).toContain("<h2>");
    expect(result.translatedChapters[0].html).toContain("<h3>");
    expect(result.translatedChapters[0].html).toContain("[zh]Chapter One");
    await writeTranslatedEpub(result.book, result.translatedChapters, output);
    await expect(validateEpub(output)).resolves.toMatchObject({ status: "pass" });
  });

  it("preserves split inline text structure and hrefs", async () => {
    const fixtures = createFixtures();
    const book = await readEpub(fixtures.splitTextInline);
    const result = await translateBook(book, { baseUrl: "", apiKey: "", model: "", useMock: true }, new AbortController().signal, () => undefined);
    const html = result.translatedChapters[0].html;
    expect(html).toContain("<em>");
    expect(html).toContain("<strong>");
    expect(html).toContain('href="#note1"');
    expect(html).toContain("[zh]");
  });

  it("keeps entities and special characters parseable after translation", async () => {
    const fixtures = createFixtures();
    const output = path.join(path.dirname(fixtures.entitiesSpecialChars), "entities-special-chars.zh.epub");
    await expect(validateEpub(fixtures.entitiesSpecialChars)).resolves.toMatchObject({ status: "pass" });
    const book = await readEpub(fixtures.entitiesSpecialChars);
    expect(book.chapters[0].text).toContain("Tom & Jerry");

    const result = await translateBook(book, { baseUrl: "", apiKey: "", model: "", useMock: true }, new AbortController().signal, () => undefined);
    await writeTranslatedEpub(result.book, result.translatedChapters, output);
    const report = await validateEpub(output);
    expect(report.status).toBe("pass");
    const zip = new AdmZip(output);
    const chapter = zip.getEntry("OPS/chapters/chapter1.xhtml")?.getData().toString("utf8") ?? "";
    expect(chapter).not.toContain("&amp;amp;");
    expect(chapter).toContain("&lt;safe&gt;");
  });

  it("keeps nav landmarks out of translatable chapters", async () => {
    const fixtures = createFixtures();
    const book = await readEpub(fixtures.navLandmarks);
    expect(book.chapters).toHaveLength(1);
    expect(book.chapters[0].title).toBe("Readable Chapter");
    expect(book.chapters[0].absolutePath).toBe("OPS/chapters/chapter1.xhtml");
    const report = await validateEpub(fixtures.navLandmarks);
    expect(report.status).not.toBe("fail");
  });

  it("resolves duplicate filenames in separate resource directories", async () => {
    const fixtures = createFixtures();
    const output = path.join(path.dirname(fixtures.duplicateHrefs), "duplicate-hrefs.zh.epub");
    const book = await readEpub(fixtures.duplicateHrefs);
    expect(book.chapters.map((chapter) => chapter.absolutePath)).toEqual(["OPS/part-a/chapter.xhtml", "OPS/part-b/chapter.xhtml"]);
    const result = await translateBook(book, { baseUrl: "", apiKey: "", model: "", useMock: true }, new AbortController().signal, () => undefined);
    await writeTranslatedEpub(result.book, result.translatedChapters, output);
    const zip = new AdmZip(output);
    expect(zip.getEntry("OPS/part-a/styles/main.css")).toBeTruthy();
    expect(zip.getEntry("OPS/part-b/styles/main.css")).toBeTruthy();
    expect(zip.getEntry("OPS/part-a/images/pixel.png")).toBeTruthy();
    expect(zip.getEntry("OPS/part-b/images/pixel.png")).toBeTruthy();
    await expect(validateEpub(output)).resolves.toMatchObject({ status: "pass" });
  });

  it("reports multiple progress chunks for a large chapter", async () => {
    const fixtures = createFixtures();
    const book = await readEpub(fixtures.largeChapterChunking);
    expect(countTranslatableTextNodeGroups(book.chapters[0].html)).toBeGreaterThan(1);
    const updates: TranslationProgress[] = [];
    const result = await translateBook(
      book,
      { baseUrl: "", apiKey: "", model: "", useMock: true },
      new AbortController().signal,
      (progress) => updates.push(progress)
    );
    const completed = updates.at(-1);
    expect(completed?.status).toBe("completed");
    expect(completed?.totalChunks).toBeGreaterThan(1);
    expect(completed?.translatedChunks).toBe(completed?.totalChunks);
    expect(result.translatedChapters[0].html).toContain("[zh]Long chapter paragraph 18");
  });
});

function createFixtures() {
  return createEpubFixtures(fs.mkdtempSync(path.join(os.tmpdir(), "booktrans-fixtures-")));
}
