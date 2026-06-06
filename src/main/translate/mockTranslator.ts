import type { TranslationSettings, Translator } from "../../shared/types.js";

export class MockTranslator implements Translator {
  private readonly glossary: Array<[string, string]>;

  constructor(settings: Pick<TranslationSettings, "glossary"> = {}) {
    this.glossary = parseGlossary(settings.glossary ?? "");
  }

  async translate(text: string): Promise<string> {
    return text
      .split(/\n/)
      .map((line) => (line.trim() ? `[zh]${applyGlossary(line, this.glossary)}` : line))
      .join("\n");
  }
}

function parseGlossary(glossary: string): Array<[string, string]> {
  return glossary
    .split(/\r?\n/)
    .map((line) => line.split("=>").map((part) => part.trim()))
    .filter((parts): parts is [string, string] => Boolean(parts[0] && parts[1]));
}

function applyGlossary(text: string, glossary: Array<[string, string]>): string {
  return glossary.reduce((current, [source, target]) => current.replaceAll(source, target), text);
}
