import path from "node:path";
import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";
import * as cheerio from "cheerio";
import type { BookMetadata, Chapter, ImportedBook } from "../../shared/types.js";

interface ContainerXml {
  container?: {
    rootfiles?: Array<{
      rootfile?: Array<{ $?: { "full-path"?: string } }>;
    }>;
  };
}

interface OpfPackage {
  package?: {
    metadata?: Array<Record<string, unknown>>;
    manifest?: Array<{ item?: Array<{ $: { id: string; href: string; "media-type": string; properties?: string } }> }>;
    spine?: Array<{ itemref?: Array<{ $: { idref: string; linear?: string } }> }>;
  };
}

export async function readEpub(filePath: string): Promise<ImportedBook> {
  const zip = new AdmZip(filePath);
  const containerXml = readZipText(zip, "META-INF/container.xml");
  const container = (await parseStringPromise(containerXml)) as ContainerXml;
  const rootFilePath = container.container?.rootfiles?.[0]?.rootfile?.[0]?.$?.["full-path"];
  if (!rootFilePath) {
    throw new Error("EPUB container does not declare an OPF rootfile.");
  }

  const opfXml = readZipText(zip, rootFilePath);
  const opf = (await parseStringPromise(opfXml)) as OpfPackage;
  const metadata = extractMetadata(opf);
  const manifest = opf.package?.manifest?.[0]?.item ?? [];
  const spine = opf.package?.spine?.[0]?.itemref ?? [];
  const opfDir = path.posix.dirname(rootFilePath) === "." ? "" : path.posix.dirname(rootFilePath);

  const chapters: Chapter[] = [];
  for (const itemRef of spine) {
    if (itemRef.$.linear === "no") {
      continue;
    }
    const item = manifest.find((entry) => entry.$.id === itemRef.$.idref);
    if (!item || !isHtmlMediaType(item.$["media-type"]) || hasManifestProperty(item.$.properties, "nav")) {
      continue;
    }

    const absolutePath = normalizeZipPath(path.posix.join(opfDir, decodeHref(item.$.href)));
    const html = readZipText(zip, absolutePath);
    chapters.push({
      id: item.$.id,
      href: item.$.href,
      absolutePath,
      title: extractChapterTitle(html, `Chapter ${chapters.length + 1}`),
      text: extractBodyText(html),
      html,
      mediaType: item.$["media-type"],
      order: chapters.length
    });
  }

  return {
    filePath,
    rootFilePath,
    opfDir,
    metadata,
    chapters
  };
}

export function readZipText(zip: AdmZip, entryPath: string): string {
  const entry = zip.getEntry(entryPath);
  if (!entry) {
    throw new Error(`EPUB entry not found: ${entryPath}`);
  }
  return entry.getData().toString("utf8");
}

export function extractBodyText(html: string): string {
  const $ = cheerio.load(html, { xmlMode: true });
  const body = $("body");
  const root = body.length ? body : $("html");
  const lines: string[] = [];
  root.find("h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,figcaption").each((_, element) => {
    const text = $(element).text().replace(/\s+/g, " ").trim();
    if (text) {
      lines.push(text);
    }
  });
  return lines.join("\n\n");
}

function extractChapterTitle(html: string, fallback: string): string {
  const $ = cheerio.load(html, { xmlMode: true });
  return $("title").first().text().trim() || $("h1,h2,h3").first().text().trim() || fallback;
}

function extractMetadata(opf: OpfPackage): BookMetadata {
  const metadata = opf.package?.metadata?.[0] ?? {};
  return {
    title: firstMetadataValue(metadata, "dc:title") || "Untitled",
    author: firstMetadataValue(metadata, "dc:creator") || "Unknown",
    language: firstMetadataValue(metadata, "dc:language") || ""
  };
}

function firstMetadataValue(metadata: Record<string, unknown>, key: string): string {
  const value = metadata[key];
  if (!Array.isArray(value)) {
    return "";
  }
  const first = value[0];
  if (typeof first === "string") {
    return first;
  }
  if (first && typeof first === "object" && "_" in first) {
    return String((first as { _: string })._);
  }
  return "";
}

function isHtmlMediaType(mediaType: string): boolean {
  return mediaType === "application/xhtml+xml" || mediaType === "text/html";
}

function hasManifestProperty(properties: string | undefined, property: string): boolean {
  return properties?.split(/\s+/).includes(property) ?? false;
}

function decodeHref(href: string): string {
  try {
    return decodeURIComponent(href.split("#")[0]);
  } catch {
    return href.split("#")[0];
  }
}

function normalizeZipPath(entryPath: string): string {
  return entryPath.replace(/\\/g, "/").replace(/^\.\//, "");
}
