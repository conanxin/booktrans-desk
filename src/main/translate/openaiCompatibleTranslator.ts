import type { TranslationSettings, Translator } from "../../shared/types.js";

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

export class OpenAICompatibleTranslator implements Translator {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(settings: TranslationSettings) {
    this.baseUrl = settings.baseUrl.replace(/\/$/, "");
    this.apiKey = settings.apiKey;
    this.model = settings.model;
  }

  async translate(text: string, signal?: AbortSignal): Promise<string> {
    if (!this.baseUrl || !this.apiKey || !this.model) {
      throw new Error("OpenAI-compatible API settings are incomplete.");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Translate the user's EPUB body text into Simplified Chinese. Preserve paragraph breaks, inline markers, notes, and heading intent. Return only the translation."
          },
          { role: "user", content: text }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Translation request failed: ${response.status} ${body.slice(0, 240)}`);
    }

    const data = (await response.json()) as ChatCompletionResponse;
    const translated = data.choices?.[0]?.message?.content;
    if (!translated) {
      throw new Error("Translation response did not include message content.");
    }
    return translated;
  }
}
