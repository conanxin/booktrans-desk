import type { UnifiedDocument } from "../../shared/documentModel.js";

export function unifiedDocumentToJson(document: UnifiedDocument): string {
  return JSON.stringify(document, null, 2);
}

