import AdmZip from "adm-zip";
import { analysisStateToRecord } from "../analysis/analysisService.js";
import type { UnifiedDocument } from "../../shared/documentModel.js";
import { buildExportPresetMarkdown } from "./exportPresets.js";

export interface PptxSlidePlan {
  title: string;
  bullets: string[];
}

export function buildBaselinePptx(document: UnifiedDocument): Buffer {
  const slides = buildBaselinePptxPlan(document);
  const zip = new AdmZip();
  zip.addFile("[Content_Types].xml", Buffer.from(contentTypesXml(slides.length), "utf8"));
  zip.addFile("_rels/.rels", Buffer.from(rootRelsXml(), "utf8"));
  zip.addFile("ppt/presentation.xml", Buffer.from(presentationXml(slides.length), "utf8"));
  zip.addFile("ppt/_rels/presentation.xml.rels", Buffer.from(presentationRelsXml(slides.length), "utf8"));
  for (const [index, slide] of slides.entries()) {
    zip.addFile(`ppt/slides/slide${index + 1}.xml`, Buffer.from(slideXml(slide), "utf8"));
  }
  return zip.toBuffer();
}

export function buildBaselinePptxPlan(document: UnifiedDocument): PptxSlidePlan[] {
  const analysis = analysisStateToRecord(document, document.analysisState);
  const keyPoints = analysis?.keyPoints.length ? analysis.keyPoints : ["No key points have been generated yet."];
  const outline = buildExportPresetMarkdown(document, "presentation-outline")
    .split("\n")
    .filter((line) => line.startsWith("## Slide"))
    .slice(0, 6)
    .map((line) => line.replace(/^##\s+/, ""));
  const chatHighlights = (document.chatMessages ?? [])
    .filter((message) => message.role === "assistant")
    .slice(-3)
    .map((message) => truncate(message.content.replace(/\s+/g, " ").trim(), 150));
  const sourceHints = (analysis?.sources ?? [])
    .map((source) => [source.chapterTitle, source.pageNumber ? `page ${source.pageNumber}` : undefined, source.unitId].filter(Boolean).join(" - "))
    .filter(Boolean)
    .slice(0, 6);

  return [
    {
      title: document.title || "DocuMuse Studio Export",
      bullets: [`Source format: ${document.sourceFormat.toUpperCase()}`, `Document kind: ${document.documentKind?.kind ?? "unknown"}`, `Generated at: ${new Date().toISOString()}`]
    },
    {
      title: "Summary",
      bullets: [analysis?.oneSentenceSummary, analysis?.summary].filter(Boolean) as string[]
    },
    {
      title: "Key Points",
      bullets: keyPoints.slice(0, 8)
    },
    {
      title: "Presentation Outline",
      bullets: outline.length ? outline : ["Add outline after running analysis."]
    },
    {
      title: "Chat Highlights",
      bullets: chatHighlights.length ? chatHighlights : ["No chat highlights yet."]
    },
    {
      title: "Sources",
      bullets: sourceHints.length ? sourceHints : ["No source hints available yet."]
    }
  ];
}

function contentTypesXml(slideCount: number): string {
  const slideOverrides = Array.from({ length: slideCount }, (_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>${slideOverrides}</Types>`;
}

function rootRelsXml(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>`;
}

function presentationXml(slideCount: number): string {
  const slideIds = Array.from({ length: slideCount }, (_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 1}"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldIdLst>${slideIds}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="wide"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`;
}

function presentationRelsXml(slideCount: number): string {
  const rels = Array.from({ length: slideCount }, (_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}</Relationships>`;
}

function slideXml(slide: PptxSlidePlan): string {
  const body = slide.bullets.slice(0, 8).map((bullet, index) => textShape(3 + index, 700000, 1500000 + index * 560000, 10800000, 430000, bullet, 2200, false)).join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${textShape(2, 650000, 520000, 11000000, 700000, slide.title, 3400, true)}${body}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;
}

function textShape(id: number, x: number, y: number, w: number, h: number, text: string, size: number, bold: boolean): string {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/><a:p><a:r><a:rPr lang="en-US" sz="${size}"${bold ? ' b="1"' : ""}/><a:t>${escapeXml(truncate(text || " ", 240))}</a:t></a:r></a:p></p:txBody></p:sp>`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, Math.max(0, max - 3))}...` : value;
}
