import fs from "node:fs/promises";
import path from "node:path";
import { deflateRawSync } from "node:zlib";
import AdmZip from "adm-zip";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import { Builder, parseStringPromise } from "xml2js";
import type { ImportedBook, TranslatedChapter } from "../../shared/types.js";

interface OpfXml {
  package?: {
    metadata?: Array<Record<string, unknown>>;
  };
}

export async function writeTranslatedEpub(
  book: ImportedBook,
  translatedChapters: TranslatedChapter[],
  outputPath?: string
): Promise<string> {
  const sourceZip = new AdmZip(book.filePath);
  const chapterMap = new Map(
    translatedChapters.flatMap((chapter) => {
      const original = book.chapters.find((item) => item.href === chapter.href);
      return original ? [[original.absolutePath, chapter] as const] : [];
    })
  );
  const targetPath = outputPath ?? defaultOutputPath(book.filePath, book.metadata.title);
  const outputEntries: ZipOutputEntry[] = [];
  const mimeEntry = sourceZip.getEntry("mimetype");
  outputEntries.push({
    name: "mimetype",
    data: mimeEntry?.getData() ?? Buffer.from("application/epub+zip", "utf8"),
    method: 0
  });

  for (const entry of sourceZip.getEntries()) {
    if (entry.entryName === "mimetype") {
      continue;
    }

    if (entry.entryName === book.rootFilePath) {
      const updatedOpf = await updateMetadata(entry.getData().toString("utf8"), book.metadata.title);
      outputEntries.push({ name: entry.entryName, data: Buffer.from(updatedOpf, "utf8"), method: 8 });
      continue;
    }

    const matching = chapterMap.get(entry.entryName);
    if (matching) {
      outputEntries.push({ name: entry.entryName, data: Buffer.from(matching.html, "utf8"), method: 8 });
      continue;
    }

    outputEntries.push({ name: entry.entryName, data: entry.getData(), method: entry.isDirectory ? 0 : 8 });
  }

  await fs.writeFile(targetPath, buildZip(outputEntries));
  return targetPath;
}

export function applyTranslatedTextToHtml(html: string, translatedText: string): string {
  const $ = cheerio.load(html, { xmlMode: true });
  const segments = translatedText.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  let index = 0;
  $("body")
    .find("h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,figcaption")
    .each((_, element) => {
      if (index >= segments.length) {
        return;
      }
      const node = $(element);
      if (!node.text().trim()) {
        return;
      }
      replaceTextNodes($, node, segments[index]);
      index += 1;
    });
  return $.xml();
}

function replaceTextNodes($: cheerio.CheerioAPI, node: cheerio.Cheerio<AnyNode>, text: string): void {
  const textNodes = node.contents().filter((_index: number, child: AnyNode) => child.type === "text");
  if (textNodes.length > 0) {
    textNodes.first().replaceWith(text);
    textNodes.slice(1).remove();
    return;
  }
  node.text(text);
}

async function updateMetadata(opfXml: string, title: string): Promise<string> {
  const opf = (await parseStringPromise(opfXml)) as OpfXml;
  const metadata = opf.package?.metadata?.[0];
  if (metadata) {
    metadata["dc:language"] = ["zh-CN"];
    metadata["dc:title"] = [`${title}（中文翻译版）`];
  }
  return new Builder({ renderOpts: { pretty: true }, xmldec: { version: "1.0", encoding: "UTF-8" } }).buildObject(opf);
}

function defaultOutputPath(filePath: string, title: string): string {
  const safeTitle = title.replace(/[\\/:*?"<>|]+/g, "_").trim() || path.basename(filePath, ".epub");
  return path.join(path.dirname(filePath), `${safeTitle}.zh.epub`);
}

export interface ZipOutputEntry {
  name: string;
  data: Buffer;
  method: 0 | 8;
}

interface CentralDirectoryEntry {
  nameBuffer: Buffer;
  crc: number;
  method: 0 | 8;
  compressedSize: number;
  uncompressedSize: number;
  offset: number;
}

export function buildZip(entries: ZipOutputEntry[]): Buffer {
  const fileParts: Buffer[] = [];
  const centralEntries: CentralDirectoryEntry[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const compressed = entry.method === 0 ? entry.data : deflateRawSync(entry.data);
    const crc = crc32(entry.data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(entry.method === 0 ? 10 : 20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(entry.method, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(entry.data.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    fileParts.push(localHeader, nameBuffer, compressed);
    centralEntries.push({
      nameBuffer,
      crc,
      method: entry.method,
      compressedSize: compressed.length,
      uncompressedSize: entry.data.length,
      offset
    });
    offset += localHeader.length + nameBuffer.length + compressed.length;
  }

  const centralStart = offset;
  const centralParts = centralEntries.map((entry) => {
    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(entry.method === 0 ? 10 : 20, 6);
    header.writeUInt16LE(0x0800, 8);
    header.writeUInt16LE(entry.method, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt16LE(0, 14);
    header.writeUInt32LE(entry.crc, 16);
    header.writeUInt32LE(entry.compressedSize, 20);
    header.writeUInt32LE(entry.uncompressedSize, 24);
    header.writeUInt16LE(entry.nameBuffer.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(entry.offset, 42);
    return Buffer.concat([header, entry.nameBuffer]);
  });
  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);

  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(centralEntries.length, 8);
  end.writeUInt16LE(centralEntries.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(centralStart, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...fileParts, ...centralParts, end]);
}

const crcTable = new Uint32Array(256).map((_, tableIndex) => {
  let c = tableIndex;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(data: Buffer): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
