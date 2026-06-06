import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type { ImportedBook, TranslationProfile, TranslationSettings } from "../../shared/types.js";
import { fingerprintBook } from "../translate/translationJobStore.js";

interface ProfileFile {
  profiles: TranslationProfile[];
}

export class TranslationProfileStore {
  constructor(private readonly filePath: string) {}

  async getByFingerprint(bookFingerprint: string): Promise<TranslationProfile | null> {
    return (await this.readFile()).profiles.find((profile) => profile.bookFingerprint === bookFingerprint) ?? null;
  }

  async saveForBook(book: ImportedBook, settings: TranslationSettings, targetLanguage = "zh-CN"): Promise<TranslationProfile> {
    const bookFingerprint = fingerprintBook(book);
    const file = await this.readFile();
    const existing = file.profiles.find((profile) => profile.bookFingerprint === bookFingerprint);
    const profile: TranslationProfile = {
      id: existing?.id ?? crypto.randomUUID(),
      bookFingerprint,
      bookTitle: book.metadata.title,
      sourceLanguage: book.metadata.language,
      targetLanguage,
      style: settings.style ?? "faithful",
      glossary: settings.glossary ?? "",
      model: settings.model,
      baseUrl: settings.baseUrl,
      updatedAt: new Date().toISOString()
    };
    file.profiles = [profile, ...file.profiles.filter((item) => item.bookFingerprint !== bookFingerprint)];
    await this.writeFile(file);
    return profile;
  }

  async delete(bookFingerprint: string): Promise<void> {
    const file = await this.readFile();
    file.profiles = file.profiles.filter((profile) => profile.bookFingerprint !== bookFingerprint);
    await this.writeFile(file);
  }

  private async readFile(): Promise<ProfileFile> {
    try {
      return JSON.parse(await fs.readFile(this.filePath, "utf8")) as ProfileFile;
    } catch {
      return { profiles: [] };
    }
  }

  private async writeFile(file: ProfileFile): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    const safe = JSON.parse(JSON.stringify(file, (key, value) => (key.toLowerCase().includes("apikey") ? undefined : value))) as ProfileFile;
    await fs.writeFile(this.filePath, JSON.stringify(safe, null, 2), "utf8");
  }
}

export function createTranslationProfileStore(userDataDir: string): TranslationProfileStore {
  return new TranslationProfileStore(path.join(userDataDir, "profiles", "translation-profiles.json"));
}

export function getBookFingerprint(book: ImportedBook): string {
  return fingerprintBook(book);
}
