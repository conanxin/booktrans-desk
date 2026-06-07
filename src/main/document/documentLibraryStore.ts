import fs from "node:fs/promises";
import path from "node:path";
import type { UnifiedDocument } from "../../shared/documentModel.js";

interface DocumentLibraryEntry {
  document: UnifiedDocument;
}

export class DocumentLibraryStore {
  constructor(private readonly documentsDir: string) {}

  async listDocuments(): Promise<UnifiedDocument[]> {
    await fs.mkdir(this.documentsDir, { recursive: true });
    const entries = await fs.readdir(this.documentsDir, { withFileTypes: true });
    const documents: UnifiedDocument[] = [];
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        continue;
      }
      const document = await this.readDocument(entry.name.replace(/\.json$/, ""));
      if (document) {
        documents.push(document);
      }
    }
    return documents.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  async readDocument(id: string): Promise<UnifiedDocument | null> {
    try {
      const raw = await fs.readFile(this.documentPath(id), "utf8");
      const entry = JSON.parse(raw) as DocumentLibraryEntry | UnifiedDocument;
      return "document" in entry ? entry.document : entry;
    } catch {
      return null;
    }
  }

  async saveDocument(document: UnifiedDocument): Promise<UnifiedDocument> {
    await fs.mkdir(this.documentsDir, { recursive: true });
    const now = new Date().toISOString();
    const next: UnifiedDocument = {
      ...document,
      updatedAt: now,
      createdAt: document.createdAt || now
    };
    await fs.writeFile(this.documentPath(next.id), JSON.stringify(redactSecrets({ document: next }), null, 2), "utf8");
    return next;
  }

  async deleteDocument(id: string): Promise<void> {
    await fs.rm(this.documentPath(id), { force: true });
  }

  async importDocumentSnapshot(document: UnifiedDocument): Promise<UnifiedDocument> {
    return this.saveDocument(document);
  }

  private documentPath(id: string): string {
    return path.join(this.documentsDir, `${safeDocumentId(id)}.json`);
  }
}

export function createDocumentLibraryStore(userDataDir: string): DocumentLibraryStore {
  return new DocumentLibraryStore(path.join(userDataDir, "documents"));
}

function safeDocumentId(id: string): string {
  return id.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function redactSecrets<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (key, item) => {
      const normalized = key.toLowerCase();
      if (normalized.includes("apikey") || normalized === "api_key" || normalized === "authorization") {
        return undefined;
      }
      return item;
    })
  ) as T;
}

