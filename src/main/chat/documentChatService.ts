import type { UnifiedDocument } from "../../shared/documentModel.js";

export interface DocumentChatSource {
  unitId: string;
  pageNumber?: number;
  chapterId?: string;
  chapterTitle?: string;
  quote: string;
  score: number;
}

export interface DocumentChatMessage {
  id: string;
  documentId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sources?: DocumentChatSource[];
}

export class DocumentChatService {
  private readonly messages = new Map<string, DocumentChatMessage[]>();

  ask(document: UnifiedDocument, question: string): DocumentChatMessage {
    const createdAt = new Date().toISOString();
    const userMessage: DocumentChatMessage = {
      id: `chat-${document.id}-${createdAt}-user`,
      documentId: document.id,
      role: "user",
      content: question,
      createdAt
    };
    const sources = retrieveSources(document, question);
    const answer: DocumentChatMessage = {
      id: `chat-${document.id}-${createdAt}-assistant`,
      documentId: document.id,
      role: "assistant",
      content: buildAnswer(question, sources),
      createdAt,
      sources
    };
    const list = this.messages.get(document.id) ?? [];
    list.push(userMessage, answer);
    this.messages.set(document.id, list);
    return answer;
  }

  list(documentId: string): DocumentChatMessage[] {
    return this.messages.get(documentId) ?? [];
  }

  clear(documentId: string): void {
    this.messages.delete(documentId);
  }
}

function retrieveSources(document: UnifiedDocument, question: string): DocumentChatSource[] {
  const terms = tokenize(question);
  const scored = document.units
    .filter((unit) => unit.text.trim())
    .map((unit) => {
      const lower = unit.text.toLowerCase();
      const score = terms.reduce((sum, term) => sum + (lower.includes(term) ? 1 : 0), 0);
      return { unit, score };
    })
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.unit.order - right.unit.order)
    .slice(0, 4);

  const fallback = scored.length ? scored : document.units.filter((unit) => unit.text.trim()).slice(0, 2).map((unit) => ({ unit, score: 0 }));
  return fallback.map(({ unit, score }) => ({
    unitId: unit.id,
    pageNumber: unit.pageNumber,
    chapterId: unit.chapterId,
    chapterTitle: unit.chapterTitle,
    quote: trimQuote(unit.text),
    score
  }));
}

function buildAnswer(question: string, sources: DocumentChatSource[]): string {
  if (!sources.length) {
    return `I could not find extractable source text for: ${question}`;
  }
  const strongest = sources[0];
  return [`Based on the strongest local source match: ${strongest.quote}`, `Matched sources: ${sources.length}.`].join("\n\n");
}

function tokenize(text: string): string[] {
  return [...new Set(text.toLowerCase().match(/[a-z][a-z0-9-]{2,}|[\u4e00-\u9fff]{2,}/g) ?? [])].filter((term) => !STOP_WORDS.has(term));
}

function trimQuote(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}

const STOP_WORDS = new Set(["the", "and", "for", "with", "what", "where", "when", "why", "how", "tell", "about"]);

