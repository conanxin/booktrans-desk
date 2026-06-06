import path from "node:path";
import AdmZip from "adm-zip";
import { parseStringPromise } from "xml2js";
import type { ValidationReport, ValidationStatus } from "../../shared/types.js";

interface ContainerXml {
  container?: {
    rootfiles?: Array<{
      rootfile?: Array<{ $?: { "full-path"?: string } }>;
    }>;
  };
}

interface OpfPackage {
  package?: {
    manifest?: Array<{ item?: Array<{ $?: { id?: string; href?: string; "media-type"?: string } }> }>;
    spine?: Array<{ itemref?: Array<{ $?: { idref?: string } }> }>;
  };
}

export async function validateEpub(epubPath: string): Promise<ValidationReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checkedFiles: string[] = [];
  let xhtmlCheckedCount = 0;

  let zip: AdmZip;
  try {
    zip = new AdmZip(epubPath);
  } catch (error) {
    return buildReport("fail", [`Unable to open EPUB zip: ${messageOf(error)}`], warnings, checkedFiles);
  }

  const entries = zip.getEntries();
  const entryNames = new Set(entries.map((entry) => entry.entryName));
  const firstEntry = entries[0];
  const mimetype = zip.getEntry("mimetype");
  if (!mimetype) {
    errors.push("Missing mimetype entry.");
  } else {
    checkedFiles.push("mimetype");
    const value = mimetype.getData().toString("utf8").trim();
    if (value !== "application/epub+zip") {
      errors.push("mimetype must equal application/epub+zip.");
    }
    if (firstEntry?.entryName !== "mimetype") {
      errors.push("mimetype must be the first zip entry.");
    }
    if (mimetype.header.method !== 0) {
      errors.push("mimetype must be stored without compression.");
    }
  }

  const containerPath = "META-INF/container.xml";
  const containerEntry = zip.getEntry(containerPath);
  if (!containerEntry) {
    errors.push("Missing META-INF/container.xml.");
    return buildReport("fail", errors, warnings, checkedFiles);
  }
  checkedFiles.push(containerPath);

  let rootFilePath = "";
  try {
    const container = (await parseStringPromise(containerEntry.getData().toString("utf8"))) as ContainerXml;
    rootFilePath = container.container?.rootfiles?.[0]?.rootfile?.[0]?.$?.["full-path"] ?? "";
    if (!rootFilePath) {
      errors.push("container.xml does not declare an OPF rootfile.");
    }
  } catch (error) {
    errors.push(`container.xml is not parseable XML: ${messageOf(error)}`);
  }

  if (!rootFilePath) {
    return buildReport("fail", errors, warnings, checkedFiles, { opfPath: rootFilePath });
  }

  const opfEntry = zip.getEntry(rootFilePath);
  if (!opfEntry) {
    errors.push(`OPF rootfile not found: ${rootFilePath}.`);
    return buildReport("fail", errors, warnings, checkedFiles, { opfPath: rootFilePath });
  }
  checkedFiles.push(rootFilePath);

  let opf: OpfPackage | null = null;
  try {
    opf = (await parseStringPromise(opfEntry.getData().toString("utf8"))) as OpfPackage;
  } catch (error) {
    errors.push(`OPF is not parseable XML: ${messageOf(error)}`);
  }

  const manifest = opf?.package?.manifest?.[0]?.item ?? [];
  const spine = opf?.package?.spine?.[0]?.itemref ?? [];
  if (!manifest.length) {
    errors.push("OPF manifest is missing or empty.");
  }
  if (!spine.length) {
    errors.push("OPF spine is missing or empty.");
  }

  const manifestById = new Map<string, { href: string; mediaType: string }>();
  for (const item of manifest) {
    const id = item.$?.id;
    const href = item.$?.href;
    const mediaType = item.$?.["media-type"] ?? "";
    if (!id || !href) {
      warnings.push("Manifest item is missing id or href.");
      continue;
    }
    manifestById.set(id, { href, mediaType });
  }

  for (const itemref of spine) {
    const idref = itemref.$?.idref;
    if (!idref) {
      errors.push("Spine itemref is missing idref.");
      continue;
    }
    if (!manifestById.has(idref)) {
      errors.push(`Spine itemref references missing manifest id: ${idref}.`);
    }
  }

  const opfDir = path.posix.dirname(rootFilePath) === "." ? "" : path.posix.dirname(rootFilePath);
  for (const [id, item] of manifestById.entries()) {
    const entryPath = normalizeZipPath(path.posix.join(opfDir, decodeHref(item.href)));
    if (!entryNames.has(entryPath)) {
      errors.push(`Manifest href for ${id} is missing from zip: ${entryPath}.`);
      continue;
    }
    checkedFiles.push(entryPath);
    if (isXhtml(item.mediaType, item.href)) {
      xhtmlCheckedCount += 1;
      try {
        await parseStringPromise(zip.getEntry(entryPath)?.getData().toString("utf8") ?? "");
      } catch (error) {
        errors.push(`XHTML file is not parseable XML (${entryPath}): ${messageOf(error)}`);
      }
    }
  }

  return buildReport(errors.length ? "fail" : warnings.length ? "warning" : "pass", errors, warnings, checkedFiles, {
    opfPath: rootFilePath,
    manifestItemCount: manifest.length,
    spineItemCount: spine.length,
    xhtmlCheckedCount
  });
}

function buildReport(
  status: ValidationStatus,
  errors: string[],
  warnings: string[],
  checkedFiles: string[],
  stats: Partial<Pick<ValidationReport, "opfPath" | "manifestItemCount" | "spineItemCount" | "xhtmlCheckedCount">> = {}
): ValidationReport {
  return {
    status,
    errors,
    warnings,
    checkedFiles: [...new Set(checkedFiles)],
    summary: `${status.toUpperCase()}: ${checkedFiles.length} files checked, ${errors.length} errors, ${warnings.length} warnings.`,
    ...stats
  };
}

function isXhtml(mediaType: string, href: string): boolean {
  return mediaType === "application/xhtml+xml" || /\.x?html?$/i.test(href);
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

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
