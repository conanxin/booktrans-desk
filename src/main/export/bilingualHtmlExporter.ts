import type { UnifiedDocument } from "../../shared/documentModel.js";
import type { BilingualExportOptions, BilingualExportScope, BilingualHtmlLayout } from "../../shared/types.js";
import { buildBilingualPayload, formatTranslationSummary, MISSING_TRANSLATION_PLACEHOLDER } from "./bilingualExportCore.js";

export function bilingualDocumentToHtml(
  document: UnifiedDocument,
  scope: BilingualExportScope,
  layout: BilingualHtmlLayout = "side-by-side",
  options: Pick<BilingualExportOptions, "translationVersionId" | "translationResolution"> = {}
): string {
  const payload = buildBilingualPayload(document, scope, options);
  const sections = payload.units
    .map(
      (unit, index) => `<section class="unit ${escapeHtml(unit.translationStatus)}">
  <header>
    <span class="source">${escapeHtml(unit.sourceHint)}</span>
    <span class="meta">Unit ${index + 1} · ${escapeHtml(unit.role ?? "unknown")}${unit.pageNumber ? ` · Page ${unit.pageNumber}` : ""}</span>
  </header>
  <div class="bilingual-pair">
    <article>
      <h2>原文</h2>
      ${paragraphs(unit.originalText)}
    </article>
    <article>
      <h2>译文</h2>
      ${paragraphs(unit.translatedText || MISSING_TRANSLATION_PLACEHOLDER)}
    </article>
  </div>
</section>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(document.title)} · 双语导出</title>
<style>
:root { color-scheme: light; --text:#15202b; --muted:#667085; --line:#d8e0e7; --panel:#ffffff; --soft:#f6f8fa; --brand:#0f766e; --warn:#9a5b00; }
body { margin:0; font-family:"Microsoft YaHei","PingFang SC","Noto Sans CJK SC",Arial,sans-serif; color:var(--text); background:#eef2f5; }
main { max-width:1180px; margin:0 auto; padding:28px 18px 48px; }
h1 { margin:0 0 10px; font-size:28px; }
.meta-list { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:8px; margin:16px 0 22px; }
.meta-list div { border:1px solid var(--line); border-radius:8px; padding:10px; background:var(--panel); }
.meta-list dt { color:var(--muted); font-size:12px; }
.meta-list dd { margin:4px 0 0; overflow-wrap:anywhere; font-weight:700; }
.unit { margin:0 0 18px; border:1px solid var(--line); border-radius:10px; background:var(--panel); overflow:hidden; }
.unit header { display:flex; flex-wrap:wrap; justify-content:space-between; gap:8px; border-bottom:1px solid var(--line); padding:10px 12px; background:var(--soft); }
.source { color:var(--brand); font-weight:700; }
.meta { color:var(--muted); font-size:13px; }
.unit.missing .source::after { content:" · missing translation"; color:var(--warn); font-weight:600; }
.bilingual-pair { display:grid; grid-template-columns:${layout === "stacked" ? "1fr" : "minmax(0,1fr) minmax(0,1fr)"}; gap:0; }
article { padding:14px 16px; border-left:1px solid var(--line); }
article:first-child { border-left:0; }
h2 { margin:0 0 10px; color:var(--muted); font-size:13px; text-transform:uppercase; }
p { margin:0 0 10px; line-height:1.75; white-space:pre-wrap; overflow-wrap:anywhere; }
@media (max-width:760px) { .bilingual-pair { grid-template-columns:1fr; } article { border-left:0; border-top:1px solid var(--line); } article:first-child { border-top:0; } }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(document.title)} · 双语导出</h1>
<dl class="meta-list">
  <div><dt>Source format</dt><dd>${escapeHtml(document.sourceFormat)}</dd></div>
  <div><dt>Document kind</dt><dd>${escapeHtml(document.documentKind?.kind ?? "unknown")}</dd></div>
  <div><dt>Scope</dt><dd>${escapeHtml(payload.scopeLabel)}</dd></div>
  <div><dt>Generated at</dt><dd>${escapeHtml(payload.generatedAt)}</dd></div>
  <div><dt>Translation summary</dt><dd>${escapeHtml(formatTranslationSummary(payload.summary))}</dd></div>
  <div><dt>Translation version</dt><dd>${escapeHtml(payload.translationVersionLabel ?? "missing fallback")}</dd></div>
</dl>
${sections}
</main>
</body>
</html>`;
}

function paragraphs(value: string): string {
  const text = value.trim() || MISSING_TRANSLATION_PLACEHOLDER;
  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph.trim())}</p>`)
    .join("\n");
}

export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
