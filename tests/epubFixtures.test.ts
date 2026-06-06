import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import AdmZip from "adm-zip";
import { describe, expect, it } from "vitest";
import { readEpub } from "../src/main/epub/readEpub.js";
import { validateEpub } from "../src/main/epub/validateEpub.js";
import { writeTranslatedEpub } from "../src/main/epub/writeTranslatedEpub.js";
import { translateBook } from "../src/main/translationJob.js";
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
});

function createFixtures() {
  return createEpubFixtures(fs.mkdtempSync(path.join(os.tmpdir(), "booktrans-fixtures-")));
}
