import fs from "node:fs";
import path from "node:path";
import { buildZip, type ZipOutputEntry } from "../../src/main/epub/writeTranslatedEpub.js";

export interface FixturePaths {
  minimalEpub3: string;
  epub2Ncx: string;
  imagesAndCss: string;
  footnotesInline: string;
  cjkSource: string;
  malformedMissingResource: string;
  nestedSections: string;
  splitTextInline: string;
  entitiesSpecialChars: string;
  navLandmarks: string;
  duplicateHrefs: string;
  largeChapterChunking: string;
}

export function createEpubFixtures(outputDir: string): FixturePaths {
  fs.mkdirSync(outputDir, { recursive: true });
  const paths: FixturePaths = {
    minimalEpub3: path.join(outputDir, "minimal-epub3.epub"),
    epub2Ncx: path.join(outputDir, "epub2-ncx.epub"),
    imagesAndCss: path.join(outputDir, "images-and-css.epub"),
    footnotesInline: path.join(outputDir, "footnotes-inline.epub"),
    cjkSource: path.join(outputDir, "cjk-source.epub"),
    malformedMissingResource: path.join(outputDir, "malformed-missing-resource.epub"),
    nestedSections: path.join(outputDir, "nested-sections.epub"),
    splitTextInline: path.join(outputDir, "split-text-inline.epub"),
    entitiesSpecialChars: path.join(outputDir, "entities-special-chars.epub"),
    navLandmarks: path.join(outputDir, "nav-landmarks.epub"),
    duplicateHrefs: path.join(outputDir, "duplicate-hrefs.epub"),
    largeChapterChunking: path.join(outputDir, "large-chapter-chunking.epub")
  };

  write(paths.minimalEpub3, epub3Entries("Minimal EPUB 3", `<p>Hello fixture.</p>`, { nav: true }));
  write(paths.epub2Ncx, epub2Entries());
  write(paths.imagesAndCss, [
    ...epub3Entries("Images and CSS", `<p>Image below.</p><img src="../images/pixel.png" alt="pixel"/>`, { nav: true, css: true, image: true })
  ]);
  write(
    paths.footnotesInline,
    epub3Entries(
      "Footnotes Inline",
      `<p id="p1" class="lead">A <strong>bold</strong> word with <em>emphasis</em> and <a id="ref1" epub:type="noteref" href="#fn1">note</a>.</p><aside id="fn1" epub:type="footnote"><p><span class="note">Footnote text.</span></p></aside>`,
      { nav: true }
    )
  );
  write(paths.cjkSource, epub3Entries("CJK Source", `<p>中文段落，日本語テキスト, and English mixed.</p>`, { nav: true }));
  write(paths.malformedMissingResource, epub3Entries("Malformed Missing Resource", `<p>Broken manifest resource.</p>`, { nav: true, missingCss: true }));
  write(paths.nestedSections, nestedSectionsEntries());
  write(paths.splitTextInline, epub3Entries("Split Text Inline", `<p>This is <em>very</em> important and <strong>must</strong> stay linked to <a href="#note1">note</a>.</p><aside id="note1" epub:type="footnote"><p>Note body.</p></aside>`, { nav: true }));
  write(paths.entitiesSpecialChars, entitiesSpecialCharsEntries());
  write(paths.navLandmarks, navLandmarksEntries());
  write(paths.duplicateHrefs, duplicateHrefsEntries());
  write(paths.largeChapterChunking, epub3Entries("Large Chapter Chunking", largeChapterBody(), { nav: true }));

  return paths;
}

function write(filePath: string, entries: ZipOutputEntry[]): void {
  fs.writeFileSync(filePath, buildZip(entries));
}

function baseEntries(rootFile = "OPS/content.opf"): ZipOutputEntry[] {
  return [
    { name: "mimetype", method: 0, data: Buffer.from("application/epub+zip") },
    {
      name: "META-INF/container.xml",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="${rootFile}" media-type="application/oebps-package+xml"/></rootfiles>
</container>`)
    }
  ];
}

function epub3Entries(
  title: string,
  body: string,
  options: { nav?: boolean; css?: boolean; image?: boolean; missingCss?: boolean } = {}
): ZipOutputEntry[] {
  const manifest = [
    `<item id="chap" href="chapters/chapter1.xhtml" media-type="application/xhtml+xml"/>`,
    options.nav ? `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>` : "",
    options.css || options.missingCss ? `<item id="css" href="styles/main.css" media-type="text/css"/>` : "",
    options.image ? `<item id="pixel" href="images/pixel.png" media-type="image/png"/>` : ""
  ]
    .filter(Boolean)
    .join("\n    ");
  const entries: ZipOutputEntry[] = [
    ...baseEntries(),
    {
      name: "OPS/content.opf",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${slug(title)}</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:creator>BookTrans Fixture Generator</dc:creator>
    <dc:language>en</dc:language>
  </metadata>
  <manifest>
    ${manifest}
  </manifest>
  <spine><itemref idref="chap"/></spine>
</package>`)
    },
    {
      name: "OPS/chapters/chapter1.xhtml",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head><title>${title}</title>${options.css || options.missingCss ? `<link rel="stylesheet" href="../styles/main.css"/>` : ""}</head>
  <body><h1>${title}</h1>${body}</body>
</html>`)
    }
  ];
  if (options.nav) {
    entries.push({
      name: "OPS/nav.xhtml",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol><li><a href="chapters/chapter1.xhtml">${title}</a></li></ol></nav></body></html>`)
    });
  }
  if (options.css) {
    entries.push({ name: "OPS/styles/main.css", method: 8, data: Buffer.from("body { font-family: serif; } img { width: 1px; }") });
  }
  if (options.image) {
    entries.push({ name: "OPS/images/pixel.png", method: 8, data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]) });
  }
  return entries;
}

function epub2Entries(): ZipOutputEntry[] {
  return [
    ...baseEntries(),
    {
      name: "OPS/content.opf",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<package version="2.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">epub2-ncx</dc:identifier><dc:title>EPUB 2 NCX</dc:title><dc:language>en</dc:language></metadata>
  <manifest><item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/><item id="chap" href="chapter1.xhtml" media-type="application/xhtml+xml"/></manifest>
  <spine toc="ncx"><itemref idref="chap"/></spine>
</package>`)
    },
    {
      name: "OPS/toc.ncx",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1"><head/><docTitle><text>EPUB 2 NCX</text></docTitle><navMap><navPoint id="nav1" playOrder="1"><navLabel><text>Chapter</text></navLabel><content src="chapter1.xhtml"/></navPoint></navMap></ncx>`)
    },
    {
      name: "OPS/chapter1.xhtml",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>EPUB 2 NCX</title></head><body><h1>EPUB 2 NCX</h1><p>Legacy package fixture.</p></body></html>`)
    }
  ];
}

function nestedSectionsEntries(): ZipOutputEntry[] {
  return [
    ...baseEntries(),
    {
      name: "OPS/content.opf",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">nested-sections</dc:identifier><dc:title>Nested Sections</dc:title><dc:language>en</dc:language></metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chap1" href="chapters/chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="chap2" href="chapters/chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="appendix" href="chapters/appendix.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine><itemref idref="chap1"/><itemref idref="chap2"/><itemref idref="appendix" linear="no"/></spine>
</package>`)
    },
    xhtmlEntry("OPS/chapters/chapter1.xhtml", "Chapter One", `<section><h1>Chapter One</h1><section><h2>Section One</h2><p>Opening paragraph.</p><section><h3>Subsection One</h3><p>Nested detail.</p></section></section></section>`),
    xhtmlEntry("OPS/chapters/chapter2.xhtml", "Chapter Two", `<section><h1>Chapter Two</h1><section><h2>Section Two</h2><p>Second paragraph.</p></section></section>`),
    xhtmlEntry("OPS/chapters/appendix.xhtml", "Appendix", `<section><h1>Appendix</h1><p>Non linear material.</p></section>`),
    {
      name: "OPS/nav.xhtml",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol><li><a href="chapters/chapter1.xhtml">Chapter One</a><ol><li><a href="chapters/chapter1.xhtml#section-one">Section One</a></li></ol></li><li><a href="chapters/chapter2.xhtml">Chapter Two</a></li></ol></nav></body></html>`)
    }
  ];
}

function navLandmarksEntries(): ZipOutputEntry[] {
  return [
    ...baseEntries(),
    {
      name: "OPS/content.opf",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">nav-landmarks</dc:identifier><dc:title>Nav Landmarks</dc:title><dc:language>en</dc:language></metadata>
  <manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chap" href="chapters/chapter1.xhtml" media-type="application/xhtml+xml"/></manifest>
  <spine><itemref idref="nav" linear="no"/><itemref idref="chap"/></spine>
</package>`)
    },
    xhtmlEntry("OPS/chapters/chapter1.xhtml", "Readable Chapter", `<h1>Readable Chapter</h1><p>Body text for translation.</p>`),
    {
      name: "OPS/nav.xhtml",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol><li><a href="chapters/chapter1.xhtml">Readable Chapter</a></li></ol></nav><nav epub:type="landmarks"><ol><li><a epub:type="bodymatter" href="chapters/chapter1.xhtml">Start</a></li></ol></nav><nav epub:type="page-list"><ol><li><a href="chapters/chapter1.xhtml#p1">1</a></li></ol></nav></body></html>`)
    }
  ];
}

function entitiesSpecialCharsEntries(): ZipOutputEntry[] {
  return [
    ...baseEntries(),
    {
      name: "OPS/content.opf",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">entities-special-chars</dc:identifier><dc:title>Entities Special Chars</dc:title><dc:language>en</dc:language></metadata>
  <manifest><item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/><item id="chap" href="chapters/chapter1.xhtml" media-type="application/xhtml+xml"/></manifest>
  <spine><itemref idref="chap"/></spine>
</package>`)
    },
    {
      name: "OPS/chapters/chapter1.xhtml",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html [<!ENTITY nbsp "&#160;">]>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>Entities Special Chars</title></head><body><h1>Entities Special Chars</h1><p>Tom &amp; Jerry&nbsp;said “Hello” — then paused… 😊 &lt;safe&gt; &quot;quoted&quot;.</p></body></html>`)
    },
    {
      name: "OPS/nav.xhtml",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol><li><a href="chapters/chapter1.xhtml">Entities Special Chars</a></li></ol></nav></body></html>`)
    }
  ];
}

function duplicateHrefsEntries(): ZipOutputEntry[] {
  return [
    ...baseEntries(),
    {
      name: "OPS/content.opf",
      method: 8,
      data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">duplicate-hrefs</dc:identifier><dc:title>Duplicate Hrefs</dc:title><dc:language>en</dc:language></metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="chapA" href="part-a/chapter.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapB" href="part-b/chapter.xhtml" media-type="application/xhtml+xml"/>
    <item id="cssA" href="part-a/styles/main.css" media-type="text/css"/>
    <item id="cssB" href="part-b/styles/main.css" media-type="text/css"/>
    <item id="imgA" href="part-a/images/pixel.png" media-type="image/png"/>
    <item id="imgB" href="part-b/images/pixel.png" media-type="image/png"/>
  </manifest>
  <spine><itemref idref="chapA"/><itemref idref="chapB"/></spine>
</package>`)
    },
    xhtmlEntry("OPS/part-a/chapter.xhtml", "Part A", `<h1>Part A</h1><p>Relative resources A.</p><img src="images/pixel.png" alt="a"/>`, `<link rel="stylesheet" href="styles/main.css"/>`),
    xhtmlEntry("OPS/part-b/chapter.xhtml", "Part B", `<h1>Part B</h1><p>Relative resources B.</p><img src="images/pixel.png" alt="b"/>`, `<link rel="stylesheet" href="styles/main.css"/>`),
    { name: "OPS/nav.xhtml", method: 8, data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?><html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><body><nav epub:type="toc"><ol><li><a href="part-a/chapter.xhtml">Part A</a></li><li><a href="part-b/chapter.xhtml">Part B</a></li></ol></nav></body></html>`) },
    { name: "OPS/part-a/styles/main.css", method: 8, data: Buffer.from("body { color: #111; }") },
    { name: "OPS/part-b/styles/main.css", method: 8, data: Buffer.from("body { color: #222; }") },
    { name: "OPS/part-a/images/pixel.png", method: 8, data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x01]) },
    { name: "OPS/part-b/images/pixel.png", method: 8, data: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x02]) }
  ];
}

function largeChapterBody(): string {
  return Array.from({ length: 18 }, (_, index) => `<p>Long chapter paragraph ${index + 1} with enough text to create a separate translatable group for progress accounting.</p>`).join("");
}

function xhtmlEntry(name: string, title: string, body: string, head = ""): ZipOutputEntry {
  return {
    name,
    method: 8,
    data: Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"><head><title>${title}</title>${head}</head><body>${body}</body></html>`)
  };
}

function slug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
