import type { UnifiedDocument, UnifiedDocumentKind, UnifiedDocumentKindValue } from "../../shared/documentModel.js";

type OutlineOrChapters = Array<string | { title?: string; text?: string }>;

interface KindScore {
  kind: UnifiedDocumentKindValue;
  score: number;
  reasons: string[];
  signals: string[];
}

export function detectDocumentKindFromText(text: string, outlineOrChapters: OutlineOrChapters = []): UnifiedDocumentKind {
  const outlineText = outlineOrChapters
    .map((item) => (typeof item === "string" ? item : [item.title, item.text].filter(Boolean).join("\n")))
    .join("\n");
  const searchable = normalize(`${text}\n${outlineText}`).slice(0, 80000);
  const lower = searchable.toLowerCase();
  const scores = [
    scorePaper(searchable, lower),
    scoreInterview(searchable, lower),
    scoreBusinessReport(searchable, lower),
    scoreFiction(searchable, lower),
    scoreManual(searchable, lower),
    scoreBookChapter(searchable, lower),
    scoreArticle(searchable, lower)
  ].sort((left, right) => right.score - left.score);

  const best = scores[0];
  const secondScore = scores[1]?.score ?? 0;
  if (!best || best.score < 2) {
    return {
      kind: "unknown",
      confidence: 0.15,
      reasons: ["Not enough reliable structure or vocabulary signals were found."],
      signals: [],
      detectedAt: new Date().toISOString()
    };
  }

  const confidence = Math.max(0.2, Math.min(0.98, (best.score + Math.max(0, best.score - secondScore)) / 10));
  return {
    kind: confidence < 0.35 && best.kind !== "article" ? "unknown" : best.kind,
    confidence,
    reasons: best.reasons.slice(0, 8),
    signals: best.signals,
    detectedAt: new Date().toISOString()
  };
}

export function detectDocumentKindForDocument(document: UnifiedDocument): UnifiedDocumentKind {
  const text = document.units.map((unit) => unit.text).join("\n\n");
  return detectDocumentKindFromText(
    text,
    document.outline.length > 0 ? document.outline : document.chapters.map((chapter) => ({ title: chapter.title }))
  );
}

function scorePaper(text: string, lower: string): KindScore {
  return score("paper", [
    [hasAny(text, [/摘要/, /\babstract\b/i]), 2, "Contains Abstract or Chinese summary heading.", "abstract"],
    [hasAny(text, [/参考文献/, /\breferences\b/i, /\bbibliography\b/i]), 2, "Contains references or bibliography.", "references"],
    [/\b(introduction|methods?|methodology|results?|discussion|conclusion)\b/i.test(text), 3, "Contains common academic section headings.", "academic-sections"],
    [/引言|方法|结果|讨论|结论/.test(text), 3, "Contains Chinese academic section headings.", "zh-academic-sections"],
    [/\b(doi|arxiv|journal|citation|et al\.)\b/i.test(lower) || /\[[0-9]{1,3}\]/.test(text), 2, "Contains citation, DOI, arXiv, or journal signals.", "citations"]
  ]);
}

function scoreInterview(text: string, lower: string): KindScore {
  const qaCount = countMatches(text, /^\s*(q|question|a|answer|问|答|提问|回答)\s*[:：]/gim);
  return score("interview", [
    [qaCount >= 4, 5, "Contains repeated Q/A or question-answer labels.", "qa-pattern"],
    [/\b(interview|interviewer|interviewee)\b/i.test(lower) || /访谈|采访|受访者|采访者/.test(text), 3, "Contains interview vocabulary.", "interview-terms"],
    [countMatches(text, /^[\u4e00-\u9fffA-Z][\u4e00-\u9fffA-Za-z\s]{1,18}\s*[:：]/gm) >= 5, 1, "Contains speaker-label dialogue lines.", "speaker-dialogue"]
  ]);
}

function scoreBusinessReport(text: string, lower: string): KindScore {
  const terms = countTerms(text, lower, [
    "annual report",
    "quarterly report",
    "revenue",
    "profit",
    "cash flow",
    "shareholder",
    "governance",
    "market share",
    "risk management",
    "business segment",
    "esg",
    "营收",
    "财报",
    "股东",
    "公司治理",
    "风险管理",
    "业务板块",
    "年度报告",
    "季度报告",
    "战略",
    "利润",
    "现金流",
    "市场份额"
  ]);
  return score("business-report", [
    [terms >= 3, 4, "Contains several financial, governance, or business-operation terms.", "business-terms"],
    [terms >= 6, 2, "Business and financial terms are dense.", "dense-business-terms"],
    [/\b(10-k|annual report|shareholder letter)\b/i.test(lower) || /董事会|管理层讨论|年度报告/.test(text), 2, "Contains formal report or governance vocabulary.", "formal-report"]
  ]);
}

function scoreFiction(text: string, lower: string): KindScore {
  return score("fiction", [
    [/\b(prologue|epilogue|novel|story|character|plot)\b/i.test(lower) || /小说|人物|情节|场景|叙事|主角|故事/.test(text), 4, "Contains fiction or narrative vocabulary.", "fiction-terms"],
    [countMatches(text, /["“”][^"“”]{2,80}["“”]/g) >= 3 || /他说|她说|我说|问道|望向|推开|走进|命运/.test(text), 3, "Contains narrative dialogue or action language.", "narrative-dialogue"],
    [hasAny(text, [/第\s*[一二三四五六七八九十百\d]+\s*章/, /\bchapter\s+\d+\b/i]) && !/参考文献|\breferences\b/i.test(text), 1, "Uses chapter structure without reference signals.", "fiction-chapters"]
  ]);
}

function scoreManual(text: string, lower: string): KindScore {
  return score("manual", [
    [/\b(step\s+\d+|install|setup|configure|troubleshooting|faq|parameter|command|api reference)\b/i.test(lower), 4, "Contains procedural, configuration, or reference terms.", "procedure-terms"],
    [/步骤|安装|配置|故障排除|常见问题|参数|命令|接口说明|注意事项/.test(text), 4, "Contains Chinese manual or procedure terms.", "zh-procedure-terms"],
    [/\b(warning|note|caution)\b/i.test(lower) || /警告|提示|注意/.test(text), 1, "Contains warning, note, or caution labels.", "warnings"]
  ]);
}

function scoreBookChapter(text: string, lower: string): KindScore {
  return score("book-chapter", [
    [hasAny(text, [/第\s*[一二三四五六七八九十百\d]+\s*[章节]/, /\bchapter\s+\d+\b/i, /^chapter\b/im]), 3, "Contains explicit chapter headings.", "chapter-heading"],
    [/\b(in this chapter|chapter summary|exercises)\b/i.test(lower) || /本章|小结|练习|案例|概念|知识点/.test(text), 3, "Contains textbook chapter explanation, summary, or exercise signals.", "chapter-learning-terms"],
    [/参考文献|\breferences\b/i.test(text) ? false : text.length > 2000, 1, "Long-form chapter-like text without reference section.", "long-chapter-text"]
  ]);
}

function scoreArticle(text: string, lower: string): KindScore {
  return score("article", [
    [/\b(article|essay|opinion|commentary)\b/i.test(lower) || /文章|评论|随笔|观点/.test(text), 3, "Contains article, essay, commentary, or opinion vocabulary.", "article-terms"],
    [text.replace(/[^a-z0-9\u4e00-\u9fff]/gi, "").length >= 600, 2, "Has substantial prose without stronger specialist signals.", "general-prose"]
  ]);
}

function score(kind: UnifiedDocumentKindValue, checks: Array<[boolean, number, string, string]>): KindScore {
  const result: KindScore = { kind, score: 0, reasons: [], signals: [] };
  for (const [matched, value, reason, signal] of checks) {
    if (matched) {
      result.score += value;
      result.reasons.push(reason);
      result.signals.push(signal);
    }
  }
  return result;
}

function normalize(value: string): string {
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function countTerms(text: string, lower: string, terms: string[]): number {
  return terms.filter((term) => (/[a-z]/i.test(term) ? lower.includes(term.toLowerCase()) : text.includes(term))).length;
}

