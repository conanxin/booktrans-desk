import type { DocumentAnalysisRecord } from "../analysis/analysisService.js";
import type { DocumentChatMessage } from "../chat/documentChatService.js";
import type { UnifiedDocument } from "../../shared/documentModel.js";
import { analysisToMarkdown, chatToMarkdown, unifiedDocumentToMarkdown } from "./markdownExporter.js";
import { unifiedDocumentToJson } from "./jsonExporter.js";

export class ExportCenter {
  documentMarkdown(document: UnifiedDocument): string {
    return unifiedDocumentToMarkdown(document);
  }

  documentJson(document: UnifiedDocument): string {
    return unifiedDocumentToJson(document);
  }

  chatMarkdown(document: UnifiedDocument, messages: DocumentChatMessage[]): string {
    return chatToMarkdown(document.title, messages);
  }

  analysisMarkdown(analysis: DocumentAnalysisRecord): string {
    return analysisToMarkdown(analysis);
  }
}

