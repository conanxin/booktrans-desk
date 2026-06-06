import type { TranslationSettings, TranslationStyle, Translator } from "../../shared/types.js";

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: unknown } }>;
}

const RETRY_STATUS = new Set([429, 500, 502, 503, 504]);
const DEFAULT_TIMEOUT_MS = 60_000;
const MAX_ATTEMPTS = 3;

export class OpenAICompatibleTranslator implements Translator {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly model: string;
  private readonly glossary: string;
  private readonly style: TranslationStyle;
  private readonly timeoutMs: number;

  constructor(settings: TranslationSettings, timeoutMs = DEFAULT_TIMEOUT_MS) {
    this.baseUrl = settings.baseUrl.replace(/\/$/, "");
    this.apiKey = settings.apiKey;
    this.model = settings.model;
    this.glossary = settings.glossary?.trim() ?? "";
    this.style = settings.style ?? "faithful";
    this.timeoutMs = timeoutMs;
  }

  async translate(text: string, signal?: AbortSignal): Promise<string> {
    if (!this.baseUrl || !this.apiKey || !this.model) {
      throw new Error("OpenAI-compatible API settings are incomplete.");
    }

    let lastError: Error | null = null;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      throwIfAborted(signal);
      try {
        return await this.requestTranslation(text, signal);
      } catch (error) {
        if (isAbortError(error) || signal?.aborted) {
          throw new Error("Translation cancelled.");
        }
        lastError = sanitizeError(error);
        if (attempt >= MAX_ATTEMPTS || !isRetryableError(error)) {
          throw lastError;
        }
        await delay(backoffMs(attempt), signal);
      }
    }

    throw lastError ?? new Error("Translation request failed.");
  }

  private async requestTranslation(text: string, signal?: AbortSignal): Promise<string> {
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), this.timeoutMs);
    const combinedSignal = anySignal([signal, timeoutController.signal]);

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        signal: combinedSignal,
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
              content: buildSystemPrompt(this.style, this.glossary)
            },
            { role: "user", content: text }
          ]
        })
      });

      if (!response.ok) {
        const body = await safeReadBody(response);
        throw new HttpTranslationError(response.status, `Translation request failed: ${response.status} ${body}`);
      }

      let data: ChatCompletionResponse;
      try {
        data = (await response.json()) as ChatCompletionResponse;
      } catch (error) {
        throw new Error(`Translation response JSON could not be parsed: ${messageOf(error)}`);
      }

      const translated = data.choices?.[0]?.message?.content;
      if (typeof translated !== "string") {
        throw new Error("Translation response message content was not a string.");
      }
      if (!translated.trim()) {
        throw new Error("Translation response message content was empty.");
      }
      return translated;
    } finally {
      clearTimeout(timeout);
    }
  }
}

class HttpTranslationError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

function buildSystemPrompt(style: TranslationStyle, glossary: string): string {
  const styleGuide: Record<TranslationStyle, string> = {
    faithful: "Use a faithful, accurate style.",
    fluent: "Use natural, fluent Simplified Chinese.",
    academic: "Use formal academic written Chinese.",
    popular: "Use plain, accessible Simplified Chinese."
  };
  const glossaryInstruction = glossary
    ? `\nMandatory glossary. Follow these source => target term mappings exactly:\n${glossary}`
    : "";
  return [
    "Translate EPUB body text into Simplified Chinese.",
    styleGuide[style],
    "Preserve paragraph breaks, inline markers, footnote references, placeholders, and heading intent.",
    "Return only the translation.",
    glossaryInstruction
  ]
    .filter(Boolean)
    .join("\n");
}

function isRetryableError(error: unknown): boolean {
  return error instanceof HttpTranslationError && RETRY_STATUS.has(error.status);
}

async function safeReadBody(response: Response): Promise<string> {
  try {
    return sanitizeText((await response.text()).slice(0, 240));
  } catch {
    return "";
  }
}

function anySignal(signals: Array<AbortSignal | undefined>): AbortSignal {
  const controller = new AbortController();
  const abort = () => controller.abort();
  for (const signal of signals) {
    if (!signal) {
      continue;
    }
    if (signal.aborted) {
      controller.abort();
      break;
    }
    signal.addEventListener("abort", abort, { once: true });
  }
  return controller.signal;
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeout);
        reject(new Error("Translation cancelled."));
      },
      { once: true }
    );
  });
}

function backoffMs(attempt: number): number {
  return 250 * 2 ** (attempt - 1);
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Translation cancelled.");
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function sanitizeError(error: unknown): Error {
  return new Error(sanitizeText(messageOf(error)));
}

function sanitizeText(text: string): string {
  return text.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]");
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
