import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rendererIndexPath = path.join(repoRoot, "dist/renderer/index.html");
const preloadPath = path.join(repoRoot, "dist/main/preload.cjs");
const oldPreloadPath = path.join(repoRoot, "dist/main/preload.js");
const mainPath = path.join(repoRoot, "dist/main/index.js");

describe("packaged Electron renderer paths", () => {
  it("build output includes renderer index and relative asset paths", () => {
    expect(fs.existsSync(rendererIndexPath), "run npm run build before npm test").toBe(true);

    const html = fs.readFileSync(rendererIndexPath, "utf8");
    expect(html).not.toContain('src="/assets/');
    expect(html).not.toContain('href="/assets/');
    expect(html).toMatch(/src="\.\/assets\/index-[^"]+\.js"/);
    expect(html).toMatch(/href="\.\/assets\/index-[^"]+\.css"/);
  });

  it("build output includes a CommonJS preload script", () => {
    expect(fs.existsSync(preloadPath), "run npm run build before npm test").toBe(true);
    expect(fs.existsSync(oldPreloadPath)).toBe(false);

    const preload = fs.readFileSync(preloadPath, "utf8");
    expect(preload).not.toMatch(/^import\s+.*electron/m);
    expect(preload).toContain('require("electron")');
  });

  it("production main process points to packaged preload and renderer files", () => {
    expect(fs.existsSync(mainPath), "run npm run build before npm test").toBe(true);
    expect(fs.existsSync(rendererIndexPath)).toBe(true);

    const main = fs.readFileSync(mainPath, "utf8");
    expect(main).toContain("dist/main/preload.cjs");
    expect(main).toContain("dist/renderer/index.html");
    expect(main).not.toContain("localhost");
  });
});
