import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getBookFingerprint, TranslationProfileStore } from "../src/main/profile/translationProfileStore.js";
import type { ImportedBook } from "../src/shared/types.js";

describe("TranslationProfileStore", () => {
  it("saves and loads a profile by book fingerprint", async () => {
    const store = new TranslationProfileStore(await filePath());
    const book = bookFixture("Book");
    const profile = await store.saveForBook(book, {
      baseUrl: "https://example.test",
      apiKey: "secret",
      model: "model",
      glossary: "agent => 智能体",
      style: "academic"
    });
    const loaded = await store.getByFingerprint(getBookFingerprint(book));
    expect(loaded).toMatchObject({
      id: profile.id,
      bookTitle: "Book",
      glossary: "agent => 智能体",
      style: "academic",
      model: "model"
    });
  });

  it("matches identical book fingerprints and rejects changed content", () => {
    const first = getBookFingerprint(bookFixture("Book"));
    const second = getBookFingerprint(bookFixture("Book"));
    const changed = getBookFingerprint({ ...bookFixture("Book"), chapters: [{ ...bookFixture("Book").chapters[0], html: "<html/>" }] });
    expect(first).toBe(second);
    expect(first).not.toBe(changed);
  });

  it("deletes a profile and never saves apiKey", async () => {
    const file = await filePath();
    const store = new TranslationProfileStore(file);
    const book = bookFixture("Book");
    await store.saveForBook(book, { baseUrl: "", apiKey: "secret-key", model: "m", style: "faithful" });
    const raw = await fs.readFile(file, "utf8");
    expect(raw).not.toContain("secret-key");
    expect(raw).not.toContain("apiKey");
    await store.delete(getBookFingerprint(book));
    expect(await store.getByFingerprint(getBookFingerprint(book))).toBeNull();
  });
});

async function filePath(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "booktrans-profile-"));
  return path.join(dir, "profiles.json");
}

function bookFixture(title: string): ImportedBook {
  return {
    filePath: "/tmp/book.epub",
    rootFilePath: "OPS/content.opf",
    opfDir: "OPS",
    metadata: { title, author: "Author", language: "en" },
    chapters: [
      {
        id: "c1",
        href: "chapter.xhtml",
        absolutePath: "OPS/chapter.xhtml",
        title: "Chapter",
        text: "Hello",
        html: '<html xmlns="http://www.w3.org/1999/xhtml"><body><p>Hello</p></body></html>',
        mediaType: "application/xhtml+xml",
        order: 0
      }
    ]
  };
}
