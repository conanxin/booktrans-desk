import type { TranslationSettings, Translator } from "../../shared/types.js";
import { MockTranslator } from "./mockTranslator.js";
import { OpenAICompatibleTranslator } from "./openaiCompatibleTranslator.js";

export function createTranslator(settings: TranslationSettings): Translator {
  if (settings.useMock) {
    return new MockTranslator(settings);
  }
  return new OpenAICompatibleTranslator(settings);
}
