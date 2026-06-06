import type { Translator } from "../../shared/types.js";

export class MockTranslator implements Translator {
  async translate(text: string): Promise<string> {
    return text
      .split(/\n/)
      .map((line) => (line.trim() ? `【中文】${line}` : line))
      .join("\n");
  }
}
