import type { Chapter } from "../../shared/types.js";
import { readEpub } from "./readEpub.js";

export async function extractChapters(filePath: string): Promise<Chapter[]> {
  const book = await readEpub(filePath);
  return book.chapters;
}
