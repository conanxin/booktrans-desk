import type { DocumentAnalysisRecord } from "../analysis/analysisService.js";
import type { DocumentChatMessage } from "../chat/documentChatService.js";
import type { UnifiedDocument } from "../../shared/documentModel.js";
import { analysisStateToRecord } from "../analysis/analysisService.js";
import { buildExportPresetMarkdown, EXPORT_PRESETS, type ExportPresetDefinition, type ExportPresetId } from "./exportPresets.js";
import { buildFullArchiveZip } from "./fullArchiveExporter.js";
import { analysisToMarkdown, chatToMarkdown, unifiedDocumentToMarkdown } from "./markdownExporter.js";
import { unifiedDocumentToJson } from "./jsonExporter.js";
import { buildBaselinePptx } from "./pptxExporter.js";

export class ExportCenter {
  presets(): ExportPresetDefinition[] {
    return EXPORT_PRESETS;
  }

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

  analysisMarkdownFromDocument(document: UnifiedDocument): string {
    const analysis = analysisStateToRecord(document, document.analysisState);
    if (!analysis) {
      return [`# ${document.title} Analysis`, "", "No analysis is available for this document yet."].join("\n");
    }
    return this.analysisMarkdown(analysis);
  }

  presetMarkdown(document: UnifiedDocument, presetId: ExportPresetId): string {
    return buildExportPresetMarkdown(document, presetId);
  }

  fullArchiveZip(document: UnifiedDocument): Buffer {
    return buildFullArchiveZip(document, this);
  }

  baselinePptx(document: UnifiedDocument): Buffer {
    return buildBaselinePptx(document);
  }
}
