import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { ExportHistoryItem, ExternalValidationStatus, TranslationSettings, ValidationStatus } from "../../shared/types.js";

interface ExportHistoryFile {
  items: ExportHistoryItem[];
}

export class ExportHistoryStore {
  constructor(private readonly filePath: string) {}

  async add(
    input: Omit<ExportHistoryItem, "id" | "createdAt" | "glossaryHash"> & { settings?: TranslationSettings }
  ): Promise<ExportHistoryItem> {
    const file = await this.readFile();
    const item: ExportHistoryItem = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      glossaryHash: input.settings?.glossary ? hash(input.settings.glossary) : undefined,
      model: input.model ?? input.settings?.model,
      style: input.style ?? input.settings?.style
    };
    delete (item as { settings?: TranslationSettings }).settings;
    file.items.unshift(item);
    await this.writeFile(file);
    return item;
  }

  async list(): Promise<ExportHistoryItem[]> {
    return (await this.readFile()).items;
  }

  async get(id: string): Promise<ExportHistoryItem | null> {
    return (await this.readFile()).items.find((item) => item.id === id) ?? null;
  }

  async delete(id: string): Promise<void> {
    const file = await this.readFile();
    file.items = file.items.filter((item) => item.id !== id);
    await this.writeFile(file);
  }

  async clear(): Promise<void> {
    await this.writeFile({ items: [] });
  }

  async refresh(id: string): Promise<ExportHistoryItem | null> {
    const file = await this.readFile();
    const index = file.items.findIndex((item) => item.id === id);
    if (index < 0) {
      return null;
    }
    file.items[index] = await refreshItem(file.items[index]);
    await this.writeFile(file);
    return file.items[index];
  }

  async refreshAll(): Promise<ExportHistoryItem[]> {
    const file = await this.readFile();
    file.items = await Promise.all(file.items.map(refreshItem));
    await this.writeFile(file);
    return file.items;
  }

  async removeMissing(): Promise<number> {
    const file = await this.readFile();
    const refreshed = await Promise.all(file.items.map(refreshItem));
    const kept = refreshed.filter((item) => item.fileExists !== false);
    const removed = refreshed.length - kept.length;
    await this.writeFile({ items: kept });
    return removed;
  }

  private async readFile(): Promise<ExportHistoryFile> {
    try {
      return JSON.parse(await fs.readFile(this.filePath, "utf8")) as ExportHistoryFile;
    } catch {
      return { items: [] };
    }
  }

  private async writeFile(file: ExportHistoryFile): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const safe = JSON.parse(JSON.stringify(file, (key, value) => (key.toLowerCase().includes("apikey") ? undefined : value))) as ExportHistoryFile;
    await fs.writeFile(this.filePath, JSON.stringify(safe, null, 2), "utf8");
  }
}

export function createExportHistoryStore(userDataDir: string): ExportHistoryStore {
  return new ExportHistoryStore(path.join(userDataDir, "exports", "history.json"));
}

export function normalizeValidationStatus(status?: ValidationStatus): ValidationStatus | "unknown" {
  return status ?? "unknown";
}

export function normalizeExternalStatus(status?: ExternalValidationStatus): ExternalValidationStatus | undefined {
  return status;
}

function hash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

async function refreshItem(item: ExportHistoryItem): Promise<ExportHistoryItem> {
  const outputPath = item.outputPath ?? item.outputEpubPath;
  try {
    const stat = await fs.stat(outputPath);
    return {
      ...item,
      fileExists: true,
      fileSize: stat.size,
      lastModified: stat.mtime.toISOString()
    };
  } catch {
    return {
      ...item,
      fileExists: false,
      fileSize: undefined,
      lastModified: undefined
    };
  }
}
