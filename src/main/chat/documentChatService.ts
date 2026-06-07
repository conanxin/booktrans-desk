import type { ChatMessage, ChatSource, UnifiedDocument } from "../../shared/documentModel.js";
import { getUnitSourceHint } from "../../shared/documentReaderUtils.js";
import type { DocumentLibraryStore } from "../document/documentLibraryStore.js";

export type DocumentChatSource = ChatSource;

export type DocumentChatMessage = ChatMessage;

export class DocumentChatService {
  private readonly messages = new Map<string, DocumentChatMessage[]>();

  ask(document: UnifiedDocument, question: string): DocumentChatMessage {
    const { userMessage, answer } = createChatExchange(document, question);
    const list = this.messages.get(document.id) ?? [];
    list.push(userMessage, answer);
    this.messages.set(document.id, list);
    return answer;
  }

  async askAndPersist(document: UnifiedDocument, question: string, store: DocumentLibraryStore): Promise<DocumentChatMessage> {
    const { userMessage, answer } = createChatExchange(document, question);
    await store.appendDocumentChatMessages(document.id, [userMessage, answer]);
    const list = this.messages.get(document.id) ?? [];
    list.push(userMessage, answer);
    this.messages.set(document.id, list);
    return answer;
  }

  list(documentId: string): DocumentChatMessage[] {
    return this.messages.get(documentId) ?? [];
  }

  async listPersisted(store: DocumentLibraryStore, documentId: string): Promise<DocumentChatMessage[]> {
    const document = await store.readDocument(documentId);
    if (!document) {
      return this.list(documentId);
    }
    return document.chatMessages ?? [];
  }

  clear(documentId: string): void {
    this.messages.delete(documentId);
  }

  async clearPersisted(store: DocumentLibraryStore, documentId: string): Promise<void> {
    await store.clearDocumentChatMessages(documentId);
    this.clear(documentId);
  }
}

function createChatExchange(document: UnifiedDocument, question: string): { userMessage: DocumentChatMessage; answer: DocumentChatMessage } {
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
  return { userMessage, answer };
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
    sourceHint: getUnitSourceHint(unit),
    pageNumber: unit.pageNumber,
    chapterId: unit.chapterId,
    chapterTitle: unit.chapterTitle,
    role: unit.role,
    quote: trimQuote(unit.text),
    score
  }));
}

function buildAnswer(question: string, sources: DocumentChatSource[]): string {
  if (!sources.length) {
    return `I could not find extractable source text for: ${question}`;
  }
  const strongest = sources[0];
  return [`Based on the strongest local source match: ${strongest.quote ?? ""}`, `Matched sources: ${sources.length}.`].join("\n\n");
}

function tokenize(text: string): string[] {
  return [...new Set(text.toLowerCase().match(/[a-z][a-z0-9-]{2,}|[\u4e00-\u9fff]{2,}/g) ?? [])].filter((term) => !STOP_WORDS.has(term));
}

function trimQuote(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length > 240 ? `${normalized.slice(0, 237)}...` : normalized;
}

const STOP_WORDS = new Set(["the", "and", "for", "with", "what", "where", "when", "why", "how", "tell", "about"]);
