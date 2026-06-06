import { parseStringPromise } from "xml2js";
import { describe, expect, it } from "vitest";
import { translateXhtmlTextNodes } from "../src/main/epub/translateXhtmlTextNodes.js";
import type { Translator } from "../src/shared/types.js";

class PrefixTranslator implements Translator {
  async translate(text: string): Promise<string> {
    return text
      .split("__BOOKTRANS_TEXT_NODE_BREAK__")
      .map((part) => `T(${part.trim()})`)
      .join("__BOOKTRANS_TEXT_NODE_BREAK__");
  }
}

describe("translateXhtmlTextNodes", () => {
  it("preserves inline tags", async () => {
    const html = xhtml(`<p>Hello <em>world</em>.</p>`);
    const translated = await translateXhtmlTextNodes(html, new PrefixTranslator());
    expect(translated).toContain("<em>");
    expect(translated).toContain("</em>");
    expect(translated).toContain("T(world)");
  });

  it("preserves href, src, id, class, and epub:type attributes", async () => {
    const html = xhtml(`<p id="p1" class="lead" epub:type="footnote"><a href="#n1">note</a><img src="cover.png"/></p>`);
    const translated = await translateXhtmlTextNodes(html, new PrefixTranslator());
    expect(translated).toContain('id="p1"');
    expect(translated).toContain('class="lead"');
    expect(translated).toContain('epub:type="footnote"');
    expect(translated).toContain('href="#n1"');
    expect(translated).toContain('src="cover.png"');
  });

  it("skips code, pre, script, and style text", async () => {
    const html = xhtml(`<p>Hello <code>const x = 1</code></p><pre>raw text</pre><script>run()</script><style>p{}</style>`);
    const translated = await translateXhtmlTextNodes(html, new PrefixTranslator());
    expect(translated).toContain("T(Hello");
    expect(translated).toContain("const x = 1");
    expect(translated).toContain("<pre>raw text</pre>");
    expect(translated).toContain("<script>run()</script>");
    expect(translated).toContain("<style>p{}</style>");
  });

  it("only replaces text nodes", async () => {
    const html = xhtml(`<p data-title="Hello">Hello<span title="world">world</span></p>`);
    const translated = await translateXhtmlTextNodes(html, new PrefixTranslator());
    expect(translated).toContain('data-title="Hello"');
    expect(translated).toContain('title="world"');
    expect(translated).toContain("T(Hello");
    expect(translated).toContain("T(world)");
  });

  it("keeps translated XHTML parseable", async () => {
    const translated = await translateXhtmlTextNodes(xhtml(`<p>Hello <strong>world</strong></p>`), new PrefixTranslator());
    await expect(parseStringPromise(translated)).resolves.toBeTruthy();
  });
});

function xhtml(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><body>${body}</body></html>`;
}
