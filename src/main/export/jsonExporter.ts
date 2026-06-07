import type { UnifiedDocument } from "../../shared/documentModel.js";

export function unifiedDocumentToJson(document: UnifiedDocument): string {
  return JSON.stringify(document, redactUnsafeFields, 2);
}

function redactUnsafeFields(key: string, value: unknown): unknown {
  const normalized = key.toLowerCase();
  if (normalized.includes("apikey") || normalized === "api_key" || normalized === "authorization" || normalized.includes("rawresponse") || normalized.includes("rawprovider")) {
    return undefined;
  }
  return value;
}
