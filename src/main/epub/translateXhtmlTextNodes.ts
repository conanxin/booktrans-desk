import * as cheerio from "cheerio";
import type { AnyNode, Element, Text } from "domhandler";
import type { Translator } from "../../shared/types.js";
import { translateWithQualityGate, type QualityTranslationCallbacks } from "../translate/translateWithQualityGate.js";

const SKIP_TAGS = new Set(["script", "style", "svg", "math", "code", "pre", "noscript"]);
const GROUP_DELIMITER = "__BOOKTRANS_TEXT_NODE_BREAK__";

export interface TranslateXhtmlTextNodesOptions {
  signal?: AbortSignal;
  onNodeTranslated?: () => void;
  quality?: QualityTranslationCallbacks;
}

interface TextTarget {
  node: Text;
  text: string;
}

interface TextGroup {
  targets: TextTarget[];
}

export async function translateXhtmlTextNodes(
  html: string,
  translator: Translator,
  options: TranslateXhtmlTextNodesOptions = {}
): Promise<string> {
  const $ = cheerio.load(html, { xmlMode: true });
  const groups = collectTextNodeGroups($);

  for (const group of groups) {
    throwIfAborted(options.signal);
    if (group.targets.length === 1) {
      await translateSingleNode(translator, group.targets[0], options);
      continue;
    }

    /*
     * EPUB chapters often split one sentence across inline tags such as <em>,
     * footnote anchors, or small spans. We first translate a short run with a
     * stable delimiter so the model sees nearby context, then map each segment
     * back to its original text node. If the delimiter is not preserved exactly,
     * we fall back to one request per text node to protect the XHTML structure.
     */
    const source = group.targets.map((target) => target.text).join(`\n${GROUP_DELIMITER}\n`);
    const translated = await translateWithQualityGate(translator, source, options.signal, options.quality);
    const pieces = translated.split(new RegExp(`\\s*${GROUP_DELIMITER}\\s*`));
    if (pieces.length === group.targets.length) {
      group.targets.forEach((target, index) => {
        replaceTextPreservingOuterWhitespace(target.node, target.text, pieces[index]);
      });
      options.onNodeTranslated?.();
    } else {
      for (const target of group.targets) {
        await translateSingleNode(translator, target, options);
      }
    }
  }

  return $.xml();
}

export function countTranslatableTextNodeGroups(html: string): number {
  const $ = cheerio.load(html, { xmlMode: true });
  return collectTextNodeGroups($).length;
}

function collectTextNodeGroups($: cheerio.CheerioAPI): TextGroup[] {
  const body = $("body").first();
  const root = body.length ? body : $("html").first();
  const blocks = root.find("h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,figcaption").toArray();
  const groups: TextGroup[] = [];

  for (const block of blocks) {
    const targets = collectTextTargets(block);
    if (!targets.length) {
      continue;
    }
    const totalLength = targets.reduce((sum, target) => sum + target.text.length, 0);
    const hasOnlyShortNodes = targets.every((target) => target.text.length <= 120);
    if (targets.length > 1 && hasOnlyShortNodes && totalLength <= 900) {
      groups.push({ targets });
    } else {
      groups.push(...targets.map((target) => ({ targets: [target] })));
    }
  }

  return groups;
}

function collectTextTargets(node: AnyNode, skipped = false): TextTarget[] {
  if (node.type === "tag") {
    const tagName = (node as Element).name.toLowerCase();
    skipped = skipped || SKIP_TAGS.has(tagName);
  }

  if (node.type === "text") {
    const textNode = node as Text;
    const text = textNode.data ?? "";
    return !skipped && hasActualText(text) ? [{ node: textNode, text }] : [];
  }

  const children = "children" in node && Array.isArray(node.children) ? node.children : [];
  return children.flatMap((child) => collectTextTargets(child, skipped));
}

async function translateSingleNode(
  translator: Translator,
  target: TextTarget,
  options: TranslateXhtmlTextNodesOptions
): Promise<void> {
  throwIfAborted(options.signal);
  const translated = await translateWithQualityGate(translator, target.text.trim(), options.signal, options.quality);
  replaceTextPreservingOuterWhitespace(target.node, target.text, translated);
  options.onNodeTranslated?.();
}

function replaceTextPreservingOuterWhitespace(node: Text, original: string, translated: string): void {
  const leading = original.match(/^\s*/)?.[0] ?? "";
  const trailing = original.match(/\s*$/)?.[0] ?? "";
  node.data = `${leading}${translated.trim()}${trailing}`;
}

function hasActualText(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new Error("Translation cancelled.");
  }
}
